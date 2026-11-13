# Breast Biopsy Triage with PCA: Dimensionality Reduction and K-Fold Cross-Validation

![Python](https://img.shields.io/badge/Python-3.12-c2185b?style=flat-square)
![scikit-learn](https://img.shields.io/badge/scikit--learn-PCA%20%26%20CV-c2185b?style=flat-square)
![SQLite](https://img.shields.io/badge/SQL-SQLite%20star%20schema-c2185b?style=flat-square)
![Status](https://img.shields.io/badge/status-proof%20of%20concept-2f6f9f?style=flat-square)

**Case study:** [mamkon.github.io/breast-cancer-pca](https://mamkon.github.io/breast-cancer-pca/)
**Interactive dashboard:** [mamkon.github.io/breast-cancer-pca/dashboard](https://mamkon.github.io/breast-cancer-pca/dashboard/)
**Author:** Mamkon Mercy Oyeleke, Data Analytics & Business Intelligence Consultant

> **Not clinically validated.** This is an analytical proof of concept on a public research dataset from one institution. It is not a diagnostic tool and has had no regulatory review.

---

## 1. Objective and context

Breast cancer is the most commonly diagnosed cancer in women in Canada: an estimated 29,660 new cases in 2023, 27% of all new cancers in women (Canada excluding Nova Scotia; Statistics Canada, Table 13-10-0747-01). Most diagnoses are confirmed by pathology review.

A fine needle aspirate biopsy can be summarized as 30 measurements of the cell nuclei. Many of those measurements repeat each other: mean radius and mean perimeter correlate at 0.998, and 21 of the 435 feature pairs correlate above 0.9.

**Objective:** show whether the 30 measurements can be reduced to a much smaller set of inputs without losing the ability to detect malignancy, and prove it on cases the model has not seen.

The study covers four things:

1. **Dimensionality reduction with PCA.** 30 standardized measurements compressed to 7 principal components, which retain 91.0% of the total variance in the measurements.
2. **Feature selection against feature generation.** Seven selected original measurements compared with seven PCA components under the same cross-validation.
3. **Ten-fold stratified cross-validation.** Scaling, PCA and feature selection are refitted inside each training fold, so no held-out case influences preparation.
4. **A SQL warehouse and dashboard.** Results are loaded into a SQLite star schema, checked against pandas, and published as an interactive browser dashboard.

---

## 2. Results

### Feature selection against feature generation

10-fold stratified cross-validation, logistic regression, default 0.5 cutoff, 569 cases (212 malignant).

| Approach | Inputs | Sensitivity | Malignant cases missed | False alarms | AUC |
| :--- | :---: | :---: | :---: | :---: | :---: |
| PCA, 2 components | 2 | 92.0% | 17 | 12 | 0.988 |
| PCA, 5 components | 5 | 94.8% | 11 | 10 | 0.993 |
| **PCA, 7 components** | **7** | **95.3%** | **10** | **8** | **0.993** |
| PCA, 10 components | 10 | 96.2% | 8 | 4 | 0.994 |
| Top 7 measurements (feature selection) | 7 | 92.9% | 15 | 10 | 0.987 |
| All 30 measurements | 30 | 95.3% | 10 | 4 | 0.995 |

**What this shows**

- **At seven inputs, PCA missed five fewer cancers than feature selection** and matched the full set of 30 measurements.
- **PCA did not improve on using all 30 measurements.** Its value is a smaller, uncorrelated input, not higher accuracy.
- **Feature selection chose redundant inputs.** The same seven measurements were selected in all ten folds, and five of them describe nuclear size.
- **The differences are small.** Five cases on one dataset needs confirmation on new data. Sensitivity for seven components ranged from 76.2% to 100% across folds.

### What the first two components measure

- **PC1 (44.3% of variance): overall nuclear size and border irregularity.** Every measurement loads positively. The strongest are mean concave points (0.261), mean concavity (0.258) and worst concave points (0.251). Ranking cases by PC1 alone separates malignant from benign with an AUC of 0.97, although PCA never saw the diagnosis.
- **PC2 (19.0% of variance): boundary complexity against size.** Mean fractal dimension (0.367) loads positively; mean radius (−0.234) and mean area (−0.231) load negatively. On its own PC2 separates diagnosis weakly (AUC 0.62).

These are morphometric image features, not biomarkers in the molecular sense.

---

## 3. Data

| Source | What it is | How it is used |
| :--- | :--- | :--- |
| [Breast Cancer Wisconsin (Diagnostic)](https://doi.org/10.24432/C5DW2B), UCI Machine Learning Repository, via scikit-learn | 569 biopsy cases, 30 nuclear measurements each, early 1990s, one institution | All analysis |
| [Statistics Canada, Table 13-10-0747-01](https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1310074701) | Female breast cancer incidence by province and year, 1992 to 2023, from the Canadian Cancer Registry | Population context only. It has no link to the biopsy cases. |

No Canadian patient-level biopsy measurements are publicly available, so nothing here estimates how the method would perform on Canadian cases.

Canadian data adapted from Statistics Canada, Table 13-10-0747-01. This does not constitute an endorsement by Statistics Canada of this product.

---

## 4. Repository layout

```text
breast-cancer-pca/
├── index.html                 # Case study page
├── dashboard/
│   ├── index.html             # Interactive dashboard (Chart.js)
│   ├── data.json              # Dashboard data, written by the build script
│   └── chart.umd.js           # Chart.js 4.4.4, MIT licence
├── sql/
│   ├── 01_schema.sql          # SQLite star schema: 4 dimensions, 6 fact tables
│   └── 02_analysis_queries.sql# Named analysis queries
├── canada/
│   ├── extract_statcan.py     # Extracts the Statistics Canada table
│   └── breast_cancer_incidence_females.csv
├── build_case_study.py        # PCA, cross-validation, warehouse load, SQL checks, dashboard data
├── verify_pca.py              # Quick standalone check of the headline figures
├── results.json               # Output of every SQL query
├── cumulative-variance.png
└── pc1-pc2-case-map.png
```

The SQLite database is generated by the build and is not committed.

---

## 5. Reproduce

```sh
python -m pip install scikit-learn pandas numpy matplotlib
python breast-cancer-pca/build_case_study.py
```

The build stops if any SQL result disagrees with the matching pandas calculation. To refresh the Canadian extract, download the full table from Statistics Canada and run `python breast-cancer-pca/canada/extract_statcan.py PATH/TO/13100747.csv`.

---

## 6. Limitations and next steps

**Limitations**

- One institution, digitized in the early 1990s. Staining, imaging and case mix differ today.
- 569 cases, with 37% malignant: far above a screening population.
- No external validation, and sensitivity is reported at an untuned 0.5 cutoff.

**Next steps**

1. Choose a cutoff that meets a clinician-set sensitivity target, then report the resulting review workload.
2. Use nested cross-validation so the cutoff and component count are also chosen inside the training folds.
3. Repeat the selection and generation comparison at several input budgets.
4. Validate on an independent, contemporary cohort before any pilot.
