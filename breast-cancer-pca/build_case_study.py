"""Build the breast biopsy PCA case study from the scikit-learn copy of the
Wisconsin Diagnostic Breast Cancer dataset.

Runs the PCA, a 10-fold cross-validated comparison of feature generation
(PCA) against feature selection, loads a SQLite warehouse (including the
Statistics Canada incidence extract in canada/), runs the SQL analysis,
checks SQL against pandas, and writes the dashboard data file.

    python build_case_study.py
"""
import json, re, sqlite3
from pathlib import Path

import numpy as np
import pandas as pd
import sklearn
from sklearn.datasets import load_breast_cancer
from sklearn.decomposition import PCA
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import StratifiedKFold
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

HERE = Path(__file__).resolve().parent
DB = HERE / "breast_cancer_pca.db"
SEED, FOLDS, CUTOFF = 42, 10, 0.5

data = load_breast_cancer()
X = pd.DataFrame(data.data, columns=data.feature_names)
malignant = (data.target == 0).astype(int)  # scikit-learn codes 0 = malignant

# ---- 1. PCA on all cases. The diagnosis is not passed to any of these calls.
Z = StandardScaler().fit_transform(X)
pca = PCA().fit(Z)
scores = pca.transform(Z)
ratio = pca.explained_variance_ratio_
cumulative = np.cumsum(ratio)

# ---- 2. Cross-validated comparison. Every preparation step sits inside the
# pipeline, so it is refitted on the training part of each fold only.
def reducer(family, k):
    if family == "Feature generation":
        return [PCA(n_components=k)]
    if family == "Feature selection":
        return [SelectKBest(f_classif, k=k)]
    return []

APPROACHES = [
    ("PCA, 2 components", "Feature generation", 2),
    ("PCA, 5 components", "Feature generation", 5),
    ("PCA, 7 components", "Feature generation", 7),
    ("PCA, 10 components", "Feature generation", 10),
    ("Top 7 measurements", "Feature selection", 7),
    ("All 30 measurements", "No reduction", 30),
]
cv = StratifiedKFold(n_splits=FOLDS, shuffle=True, random_state=SEED)
fold_rows, selected_rows, auc = [], [], {}
for approach_id, (name, family, k) in enumerate(APPROACHES, 1):
    prob = np.zeros(len(X))
    for fold, (train, test) in enumerate(cv.split(X, malignant), 1):
        model = make_pipeline(StandardScaler(), *reducer(family, k), LogisticRegression(max_iter=5000))
        model.fit(X.iloc[train], malignant[train])
        p = model.predict_proba(X.iloc[test])[:, 1]
        prob[test] = p
        flag, truth = p >= CUTOFF, malignant[test] == 1
        fold_rows.append((approach_id, fold, int((flag & truth).sum()), int((~flag & truth).sum()),
                          int((flag & ~truth).sum()), int((~flag & ~truth).sum())))
        if family == "Feature selection":
            for j in np.flatnonzero(model.named_steps["selectkbest"].get_support()):
                selected_rows.append((approach_id, fold, int(j) + 1))
    auc[name] = float(roc_auc_score(malignant, prob))

# ---- 3. Load the warehouse.
DB.unlink(missing_ok=True)
db = sqlite3.connect(DB)
db.executescript((HERE / "sql" / "01_schema.sql").read_text())

def split_name(name):
    if name.startswith("mean "):
        return name[5:], "mean"
    if name.startswith("worst "):
        return name[6:], "worst"
    return name[:-6], "standard error"  # "<characteristic> error"

db.executemany("INSERT INTO dim_case VALUES (?, ?)",
               [(i + 1, "Malignant" if m else "Benign") for i, m in enumerate(malignant)])
db.executemany("INSERT INTO dim_feature VALUES (?, ?, ?, ?)",
               [(j + 1, n, *split_name(n)) for j, n in enumerate(data.feature_names)])
db.executemany("INSERT INTO dim_component VALUES (?, ?, ?)",
               [(c + 1, float(ratio[c]), float(cumulative[c])) for c in range(30)])
db.executemany("INSERT INTO dim_approach VALUES (?, ?, ?, ?)",
               [(i, *a) for i, a in enumerate(APPROACHES, 1)])
db.executemany("INSERT INTO fact_measurement VALUES (?, ?, ?, ?)",
               [(i + 1, j + 1, float(X.iat[i, j]), float(Z[i, j])) for i in range(len(X)) for j in range(30)])
db.executemany("INSERT INTO fact_loading VALUES (?, ?, ?)",
               [(c + 1, j + 1, float(pca.components_[c, j])) for c in range(30) for j in range(30)])
db.executemany("INSERT INTO fact_case_score VALUES (?, ?, ?)",
               [(i + 1, c + 1, float(scores[i, c])) for i in range(len(X)) for c in range(10)])
db.executemany("INSERT INTO fact_cv_fold VALUES (?, ?, ?, ?, ?, ?)", fold_rows)
db.executemany("INSERT INTO fact_selected_feature VALUES (?, ?, ?)", selected_rows)
# Canadian registry context. A separate, aggregate source: no join to the cases.
canada = pd.read_csv(HERE / "canada" / "breast_cancer_incidence_females.csv")
canada.to_sql("fact_canada_incidence", db, if_exists="append", index=False)
db.commit()

# ---- 4. Run the named SQL queries.
sql_text = (HERE / "sql" / "02_analysis_queries.sql").read_text()
queries = {m.group(1): m.group(2).strip()
           for m in re.finditer(r"-- name: (\w+)\n(.*?)(?=\n-- name:|\Z)", sql_text, re.S)}
results = {name: pd.read_sql_query(q, db) for name, q in queries.items()}

# ---- 5. Check SQL against pandas. Any disagreement stops the build.
folds = pd.DataFrame(fold_rows, columns=["approach_id", "fold", "tp", "fn", "fp", "tn"])
by_approach = folds.groupby("approach_id")[["tp", "fn", "fp", "tn"]].sum()
summary = results["approach_summary"]
assert results["completeness"].iloc[0].tolist() == [569 * 30, 569 * 30]
assert summary.caught.tolist() == by_approach.tp.tolist() and summary.missed.tolist() == by_approach.fn.tolist()
assert np.allclose(summary.sensitivity_pct, (100 * by_approach.tp / (by_approach.tp + by_approach.fn)).round(1))
assert int(results["components_to_reach_90"].components[0]) == int(np.argmax(cumulative >= 0.90) + 1)
pandas_top = pd.Series(pca.components_[0], index=data.feature_names).abs().sort_values(ascending=False).index[:5].tolist()
assert results["top_loadings"].query("component_id == 1").feature_name.tolist() == pandas_top
assert (folds[["tp", "fn", "fp", "tn"]].sum(axis=1).groupby(folds.approach_id).sum() == 569).all()
ca = canada[canada.geography == "Canada (excluding Nova Scotia)"].sort_values("year")
assert results["canada_trend"].new_cases.tolist() == ca.new_cases.tolist()
assert np.allclose(results["canada_trend"].rate_per_100k, ca.rate_per_100k)
print("SQL results match pandas on every check.\n")
for name, frame in results.items():
    print(f"== {name}\n{frame.to_string(index=False)}\n")
print("Pooled out-of-fold AUC:", {k: round(v, 4) for k, v in auc.items()})

# ---- 6. Dashboard data.
summary_out = summary.assign(auc=[round(auc[n], 4) for n in summary.approach_name]).to_dict("records")
payload = {
    "meta": {"cases": 569, "features": 30, "malignant": int(malignant.sum()), "benign": int((1 - malignant).sum()),
             "folds": FOLDS, "cutoff": CUTOFF, "seed": SEED, "scikit_learn": sklearn.__version__},
    "variance": [{"component": c + 1, "ratio": round(float(ratio[c]), 6), "cumulative": round(float(cumulative[c]), 6)} for c in range(30)],
    "cases": [{"id": i + 1, "malignant": int(malignant[i]), "pc": [round(float(v), 3) for v in scores[i, :3]]} for i in range(len(X))],
    "features": list(data.feature_names),
    "loadings": [[round(float(v), 4) for v in pca.components_[c]] for c in range(7)],
    "approaches": summary_out,
    "folds": [dict(zip(["approach_id", "fold", "tp", "fn", "fp", "tn"], r)) for r in fold_rows],
    "selection_stability": results["selection_stability"].to_dict("records"),
    "canada": {"trend": results["canada_trend"].to_dict("records"),
               "provinces": results["canada_provinces_latest"].to_dict("records")},
}
(HERE / "dashboard" / "data.json").write_text(json.dumps(payload, separators=(",", ":")))
(HERE / "results.json").write_text(json.dumps({k: v.to_dict("records") for k, v in results.items()} | {"auc": auc}, indent=1))
print("\nWrote dashboard/data.json and results.json")
