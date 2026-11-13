"""Reproduce the PCA metrics and an exploratory supervised check on the
Wisconsin Diagnostic Breast Cancer dataset (scikit-learn copy)."""
import numpy as np, pandas as pd, sklearn
from sklearn.datasets import load_breast_cancer
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.pipeline import make_pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.metrics import roc_auc_score, confusion_matrix

d = load_breast_cancer()
X = pd.DataFrame(d.data, columns=d.feature_names)
malignant = (d.target == 0).astype(int)          # sklearn codes 0 = malignant
print("sklearn", sklearn.__version__)
print("cases", len(X), "features", X.shape[1], "missing", int(X.isna().sum().sum()))
print("malignant", int(malignant.sum()), "benign", int((1 - malignant).sum()))

corr = X.corr().abs().values
iu = np.triu_indices_from(corr, k=1)
print("feature pairs", len(iu[0]), "|r|>0.9:", int((corr[iu] > 0.9).sum()), "|r|>0.8:", int((corr[iu] > 0.8).sum()))

Z = StandardScaler().fit_transform(X)
pca = PCA().fit(Z)
evr = pca.explained_variance_ratio_
cum = np.cumsum(evr)
for k in (1, 2, 3, 5, 6, 7, 10):
    print(f"k={k:2d} component={evr[k-1]*100:6.2f}% cumulative={cum[k-1]*100:6.2f}%")
print("first k reaching 90%:", int(np.argmax(cum >= 0.90) + 1), " 95%:", int(np.argmax(cum >= 0.95) + 1))

load = pd.DataFrame(pca.components_[:2].T, index=d.feature_names, columns=["PC1", "PC2"])
print("\nPC1 top 6 by |loading|\n", load.PC1.reindex(load.PC1.abs().sort_values(ascending=False).index).head(6).round(3))
print("PC1 min loading", round(load.PC1.min(), 3), "all positive:", bool((load.PC1 > 0).all()))
print("\nPC2 top + / bottom -\n", load.PC2.sort_values(ascending=False).head(4).round(3), "\n", load.PC2.sort_values().head(4).round(3))

scores = pca.transform(Z)
print("\nPC1 score AUC vs malignancy (descriptive, labels not used in fitting):", round(max(roc_auc_score(malignant, scores[:, 0]), roc_auc_score(malignant, -scores[:, 0])), 4))
print("PC2 score AUC:", round(max(roc_auc_score(malignant, scores[:, 1]), roc_auc_score(malignant, -scores[:, 1])), 4))

print("\nExploratory supervised check: 10-fold stratified CV, scaler+PCA fitted inside each fold, logistic regression, cutoff 0.5")
cv = StratifiedKFold(n_splits=10, shuffle=True, random_state=42)
for k in (2, 5, 7, 10, 30):
    steps = [StandardScaler()] + ([PCA(n_components=k)] if k < 30 else []) + [LogisticRegression(max_iter=5000)]
    p = cross_val_predict(make_pipeline(*steps), X, malignant, cv=cv, method="predict_proba")[:, 1]
    tn, fp, fn, tp = confusion_matrix(malignant, (p >= 0.5).astype(int)).ravel()
    print(f"k={k:2d} sensitivity={tp/(tp+fn)*100:5.1f}% missed={fn:2d} specificity={tn/(tn+fp)*100:5.1f}% false_alarms={fp:2d} AUC={roc_auc_score(malignant,p):.4f}")
