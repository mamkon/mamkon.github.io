-- Each query is named with a "-- name:" line and is run by build_case_study.py.

-- name: cohort
SELECT diagnosis, COUNT(*) AS cases,
       ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS share_pct
FROM dim_case GROUP BY diagnosis ORDER BY cases DESC;

-- name: completeness
SELECT (SELECT COUNT(*) FROM dim_case) * (SELECT COUNT(*) FROM dim_feature) AS expected_rows,
       COUNT(*) AS loaded_rows
FROM fact_measurement;

-- name: components_to_reach_90
SELECT MIN(component_id) AS components, ROUND(100 * MIN(cumulative_variance), 1) AS cumulative_pct
FROM dim_component WHERE cumulative_variance >= 0.90;

-- name: top_loadings
WITH ranked AS (
  SELECT l.component_id, f.feature_name, l.loading,
         ROW_NUMBER() OVER (PARTITION BY l.component_id ORDER BY ABS(l.loading) DESC) AS rank_in_component
  FROM fact_loading l JOIN dim_feature f USING (feature_id)
  WHERE l.component_id <= 2
)
SELECT component_id, rank_in_component, feature_name, ROUND(loading, 3) AS loading
FROM ranked WHERE rank_in_component <= 5 ORDER BY component_id, rank_in_component;

-- name: pc1_by_diagnosis
SELECT c.diagnosis, COUNT(*) AS cases, ROUND(AVG(s.score), 2) AS mean_pc1,
       ROUND(MIN(s.score), 2) AS min_pc1, ROUND(MAX(s.score), 2) AS max_pc1
FROM fact_case_score s JOIN dim_case c USING (case_id)
WHERE s.component_id = 1 GROUP BY c.diagnosis;

-- name: approach_summary
SELECT a.approach_name, a.family, a.n_inputs,
       SUM(v.true_positives) AS caught, SUM(v.false_negatives) AS missed,
       SUM(v.false_positives) AS false_alarms,
       ROUND(100.0 * SUM(v.true_positives) / SUM(v.true_positives + v.false_negatives), 1) AS sensitivity_pct,
       ROUND(100.0 * SUM(v.true_negatives) / SUM(v.true_negatives + v.false_positives), 1) AS specificity_pct,
       ROUND(100.0 * MIN(1.0 * v.true_positives / (v.true_positives + v.false_negatives)), 1) AS worst_fold_sensitivity_pct,
       ROUND(100.0 * MAX(1.0 * v.true_positives / (v.true_positives + v.false_negatives)), 1) AS best_fold_sensitivity_pct
FROM fact_cv_fold v JOIN dim_approach a USING (approach_id)
GROUP BY a.approach_id ORDER BY a.approach_id;

-- name: selection_stability
SELECT f.feature_name, COUNT(*) AS folds_selected
FROM fact_selected_feature s JOIN dim_feature f USING (feature_id)
GROUP BY f.feature_id ORDER BY folds_selected DESC, f.feature_name;
