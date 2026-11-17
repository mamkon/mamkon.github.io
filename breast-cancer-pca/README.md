# Breast Biopsy PCA, with Canadian Context

![Python](https://img.shields.io/badge/Python-3.12-c2185b?style=flat-square)
![scikit-learn](https://img.shields.io/badge/scikit--learn-PCA%20%26%20CV-c2185b?style=flat-square)
![SQLite](https://img.shields.io/badge/SQL-SQLite%20star%20schema-c2185b?style=flat-square)
![Power BI](https://img.shields.io/badge/Power%20BI-6%20pages%20%C2%B7%20DAX-c2185b?style=flat-square)
![Status](https://img.shields.io/badge/status-proof%20of%20concept-2f6f9f?style=flat-square)

**Case study:** [mamkon.github.io/breast-cancer-pca](https://mamkon.github.io/breast-cancer-pca/)
**Interactive dashboard:** [mamkon.github.io/breast-cancer-pca/dashboard](https://mamkon.github.io/breast-cancer-pca/dashboard/)
**Power BI report:** [six page images and project download](https://mamkon.github.io/breast-cancer-pca/#power-bi-report)
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
| Statistics Canada, Table 13-10-0761-01, and Health Reports 82-003-X | Cases by stage at diagnosis (2017) and five-year net survival by stage (2010 to 2017) | Power BI Canadian Context page |
| [Canadian Partnership Against Cancer, breast screening data tables](https://www.partnershipagainstcancer.ca/data-tables-breast-indicators/) | Share of women diagnosed within the target wait after an abnormal screen, by province, 2019 to 2020 | Power BI Provincial Map hover details |
| [Statistics Canada, Health Reports 82-003-X (Hwee and Bougie, 2021)](https://www150.statcan.gc.ca/n1/en/catalogue/82-003-X202100800001) | Breast cancer incidence and death rates by ethnicity, 2006 to 2016, from census data linked to the cancer registry | Power BI Ethnicity and Equity page |
| [Wilkinson, Ng, Ellison and Seely, The Oncologist (2024)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12395137/) | Age at diagnosis and mortality by race and ethnicity in Canada | Findings panel on the Ethnicity and Equity page |

No Canadian patient-level biopsy measurements are publicly available, so nothing here estimates how the method would perform on Canadian cases. The national cancer registry does not collect race or ethnicity, so those rates come only from the census-linked studies above. No demographic data was generated or simulated.

Canadian data adapted from Statistics Canada, Table 13-10-0747-01. This does not constitute an endorsement by Statistics Canada of this product.

---

## 4. Power BI report

Six pages built on a star schema: five lookup tables (Province, Year, Stage, Diagnosis, Model) joined to the fact tables, with the biopsy tables kept separate from the Canadian tables because they share no key.

| Page | Slicer | What it answers |
| --- | --- | --- |
| Executive Overview | Diagnosis | Live cards (569 cases, 7 components, 91.0% variance kept, 6 of 212 cancers missed), cancers missed by model, recall in each fold |
| PCA and Validation | Model | Case map on PC1 and PC2, variance added by each component, model comparison |
| Biopsy Findings | Diagnosis | How six nuclear measurements differ between benign and malignant cases |
| Canadian Context | Year range | Incidence 1992 to 2023, cases by stage, survival by stage |
| Provincial Map | Province | 2023 rates by province, rank, and biopsy diagnosis within the 7-week target |
| Ethnicity and Equity | Group | Incidence and death rates by ethnicity, and age at diagnosis |

DAX measures include fewest cancers missed and best mean recall for the selected models, components needed for 90%, variance added per component, change across the selected years, provincial rank, gap to the national rate, and biopsy-wait shortfall against the 90% target. The report uses five-fold cross-validation with class-weighted models, so its figures differ slightly from the ten-fold results above. Built with help from Claude, Codex and Google Colab; every figure was checked against its source.

---

## 5. Repository layout

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
├── powerbi/
│   ├── page-1-executive-overview.png … page-6-ethnicity-and-equity.png
│   └── breast-cancer-analysis-six-pages.zip   # PBIP project and CSV snapshots
├── cumulative-variance.png
└── pc1-pc2-case-map.png
```

The SQLite database is generated by the build and is not committed.

---

## 6. Reproduce

```sh
python -m pip install scikit-learn pandas numpy matplotlib
python breast-cancer-pca/build_case_study.py
```

The build stops if any SQL result disagrees with the matching pandas calculation. To refresh the Canadian extract, download the full table from Statistics Canada and run `python breast-cancer-pca/canada/extract_statcan.py PATH/TO/13100747.csv`.

---

## 7. Limitations and next steps

**Limitations**

- One institution, digitized in the early 1990s. Staining, imaging and case mix differ today.
- 569 cases, with 37% malignant: far above a screening population.
- No external validation, and sensitivity is reported at an untuned 0.5 cutoff.

**Next steps**

1. Choose a cutoff that meets a clinician-set sensitivity target, then report the resulting review workload.
2. Use nested cross-validation so the cutoff and component count are also chosen inside the training folds.
3. Repeat the selection and generation comparison at several input budgets.
4. Validate on an independent, contemporary cohort before any pilot.
