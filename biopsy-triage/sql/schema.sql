-- ML-Assisted Biopsy Triage: database schema (SQLite)
-- Author: Mercy Mamkon Oyeleke
-- Built by the notebook (Section 13). Data: UCI Breast Cancer Wisconsin (Diagnostic), CC BY 4.0.

-- One row per biopsy (all 569), with the 30 image-derived features
CREATE TABLE biopsies (
    biopsy_id INTEGER PRIMARY KEY,
    mean_radius REAL,
    mean_texture REAL,
    mean_perimeter REAL,
    mean_area REAL,
    mean_smoothness REAL,
    mean_compactness REAL,
    mean_concavity REAL,
    mean_concave_points REAL,
    mean_symmetry REAL,
    mean_fractal_dimension REAL,
    radius_error REAL,
    texture_error REAL,
    perimeter_error REAL,
    area_error REAL,
    smoothness_error REAL,
    compactness_error REAL,
    concavity_error REAL,
    concave_points_error REAL,
    symmetry_error REAL,
    fractal_dimension_error REAL,
    worst_radius REAL,
    worst_texture REAL,
    worst_perimeter REAL,
    worst_area REAL,
    worst_smoothness REAL,
    worst_compactness REAL,
    worst_concavity REAL,
    worst_concave_points REAL,
    worst_symmetry REAL,
    worst_fractal_dimension REAL,
    is_malignant INTEGER,          -- 1 = malignant (positive class), 0 = benign
    split TEXT                     -- 'train' or 'test'
);

-- One row per test biopsy per model
CREATE TABLE predictions (
    biopsy_id INTEGER,
    model_name TEXT,               -- 'Logistic Regression' or 'k-NN'
    probability_malignant REAL,
    predicted_default INTEGER,     -- flag at 0.50
    predicted_tuned INTEGER,       -- flag at the tuned threshold
    threshold_used REAL,
    PRIMARY KEY (biopsy_id, model_name),
    FOREIGN KEY (biopsy_id) REFERENCES biopsies(biopsy_id)
);

-- Audit trail: one row per model run
CREATE TABLE model_runs (
    run_id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_name TEXT,
    hyperparameter TEXT,
    threshold REAL,
    cv_recall REAL,
    test_recall REAL,
    test_specificity REAL,
    target_met INTEGER,            -- 1 if the 98% recall target was reached in cross-validation
    run_date TEXT,
    owner TEXT
);

-- Queue reordering simulation (per 1,000 biopsies)
CREATE TABLE impact_scenarios (
    scenario_id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_name TEXT,
    prevalence REAL,
    volume INTEGER,
    cancers_in_priority INTEGER,
    cancers_in_standard INTEGER,
    false_alarms INTEGER,
    total_priority INTEGER,
    days_to_clear_priority REAL,   -- illustrative: assumes 20 reviews per day
    days_to_clear_full REAL
);
