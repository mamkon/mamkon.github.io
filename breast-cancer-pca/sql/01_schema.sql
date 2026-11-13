-- Breast biopsy PCA case study: research warehouse (SQLite).
-- Star schema. Cases and features are dimensions; measurements, component
-- scores, loadings and cross-validation results are facts.
PRAGMA foreign_keys = ON;

-- Grain: one biopsy case. Diagnosis is stored here and nowhere else.
CREATE TABLE dim_case (
  case_id   INTEGER PRIMARY KEY,
  diagnosis TEXT NOT NULL CHECK (diagnosis IN ('Malignant', 'Benign'))
);

-- Grain: one of the 30 measurements. Each is one nuclear characteristic
-- (radius, texture, ...) summarized one way (mean, standard error, worst).
CREATE TABLE dim_feature (
  feature_id     INTEGER PRIMARY KEY,
  feature_name   TEXT NOT NULL UNIQUE,
  characteristic TEXT NOT NULL,
  statistic      TEXT NOT NULL CHECK (statistic IN ('mean', 'standard error', 'worst'))
);

-- Grain: one principal component from the PCA fitted on all cases.
CREATE TABLE dim_component (
  component_id        INTEGER PRIMARY KEY,
  variance_ratio      REAL NOT NULL CHECK (variance_ratio BETWEEN 0 AND 1),
  cumulative_variance REAL NOT NULL CHECK (cumulative_variance BETWEEN 0 AND 1.000001)
);

-- Grain: one evaluated approach (a way of preparing model inputs).
CREATE TABLE dim_approach (
  approach_id   INTEGER PRIMARY KEY,
  approach_name TEXT NOT NULL UNIQUE,
  family        TEXT NOT NULL CHECK (family IN ('Feature generation', 'Feature selection', 'No reduction')),
  n_inputs      INTEGER NOT NULL CHECK (n_inputs BETWEEN 1 AND 30)
);

-- Grain: one case x one measurement (569 x 30 = 17,070 rows).
CREATE TABLE fact_measurement (
  case_id    INTEGER NOT NULL REFERENCES dim_case,
  feature_id INTEGER NOT NULL REFERENCES dim_feature,
  value      REAL NOT NULL,
  z_score    REAL NOT NULL,
  PRIMARY KEY (case_id, feature_id)
);

-- Grain: one component x one measurement (30 x 30 = 900 rows).
CREATE TABLE fact_loading (
  component_id INTEGER NOT NULL REFERENCES dim_component,
  feature_id   INTEGER NOT NULL REFERENCES dim_feature,
  loading      REAL NOT NULL,
  PRIMARY KEY (component_id, feature_id)
);

-- Grain: one case x one of the first 10 components.
CREATE TABLE fact_case_score (
  case_id      INTEGER NOT NULL REFERENCES dim_case,
  component_id INTEGER NOT NULL REFERENCES dim_component,
  score        REAL NOT NULL,
  PRIMARY KEY (case_id, component_id)
);

-- Grain: one approach x one cross-validation fold. Counts only, so every
-- rate is recomputed from its numerator and denominator.
CREATE TABLE fact_cv_fold (
  approach_id     INTEGER NOT NULL REFERENCES dim_approach,
  fold            INTEGER NOT NULL CHECK (fold BETWEEN 1 AND 10),
  true_positives  INTEGER NOT NULL,
  false_negatives INTEGER NOT NULL,
  false_positives INTEGER NOT NULL,
  true_negatives  INTEGER NOT NULL,
  PRIMARY KEY (approach_id, fold)
);

-- Grain: one approach x one fold x one selected measurement. Feature
-- selection is refitted in every fold, so the chosen set can differ.
CREATE TABLE fact_selected_feature (
  approach_id INTEGER NOT NULL REFERENCES dim_approach,
  fold        INTEGER NOT NULL,
  feature_id  INTEGER NOT NULL REFERENCES dim_feature,
  PRIMARY KEY (approach_id, fold, feature_id)
);
