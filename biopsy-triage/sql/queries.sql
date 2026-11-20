-- ML-Assisted Biopsy Triage: operational queries (SQLite)
-- Author: Mercy Mamkon Oyeleke
-- Run against triage.db (built by the notebook) or load the CSVs in /data.

-- Q1. Confusion matrix counts per model at the tuned threshold
-- Answers: how many cancers each model catches and misses, and how many false alarms it raises.
-- Used by: clinical lead, donor.
SELECT p.model_name,
       b.is_malignant      AS actual_malignant,
       p.predicted_tuned   AS flagged_priority,
       COUNT(*)            AS case_count
FROM biopsies b
JOIN predictions p ON b.biopsy_id = p.biopsy_id
GROUP BY p.model_name, b.is_malignant, p.predicted_tuned
ORDER BY p.model_name, actual_malignant DESC, flagged_priority DESC;

-- Q2. Missed malignant cases with their probabilities
-- Answers: which cancers would wait in the standard queue, and how close they were to the threshold.
-- Used by: pathologists, safety board.
SELECT p.model_name, b.biopsy_id, b.mean_radius, b.mean_texture,
       ROUND(p.probability_malignant, 3) AS probability_malignant,
       p.threshold_used
FROM biopsies b
JOIN predictions p ON b.biopsy_id = p.biopsy_id
WHERE b.is_malignant = 1 AND p.predicted_tuned = 0
ORDER BY p.model_name, p.probability_malignant DESC;

-- Q3. Cases where the two models disagree
-- Answers: where model choice changes the triage decision.
-- Used by: data team, clinical lead.
SELECT b.biopsy_id, b.is_malignant,
       lr.predicted_tuned  AS lr_flag,
       kn.predicted_tuned  AS knn_flag
FROM biopsies b
JOIN predictions lr ON lr.biopsy_id = b.biopsy_id AND lr.model_name = 'Logistic Regression'
JOIN predictions kn ON kn.biopsy_id = b.biopsy_id AND kn.model_name = 'k-NN'
WHERE lr.predicted_tuned <> kn.predicted_tuned
ORDER BY b.is_malignant DESC, b.biopsy_id;

-- Q4. Priority workload at each threshold (logistic regression)
-- Answers: how the size of the priority queue changes as the threshold moves.
-- Used by: lab manager planning staff time.
WITH thresholds(t) AS (
    SELECT 0.1 UNION ALL SELECT 0.2 UNION ALL SELECT 0.3 UNION ALL SELECT 0.4 UNION ALL SELECT 0.5
    UNION ALL SELECT 0.6 UNION ALL SELECT 0.7 UNION ALL SELECT 0.8 UNION ALL SELECT 0.9
)
SELECT th.t AS threshold,
       SUM(CASE WHEN p.probability_malignant >= th.t THEN 1 ELSE 0 END)                       AS flagged_cases,
       SUM(CASE WHEN p.probability_malignant >= th.t AND b.is_malignant = 1 THEN 1 ELSE 0 END) AS cancers_caught,
       SUM(CASE WHEN p.probability_malignant <  th.t AND b.is_malignant = 1 THEN 1 ELSE 0 END) AS cancers_missed,
       ROUND(100.0 * SUM(CASE WHEN p.probability_malignant >= th.t THEN 1 ELSE 0 END) / COUNT(*), 1) AS priority_share_pct
FROM thresholds th
CROSS JOIN predictions p
JOIN biopsies b ON b.biopsy_id = p.biopsy_id
WHERE p.model_name = 'Logistic Regression'
GROUP BY th.t
ORDER BY th.t;

-- Q5. Queue scenarios ranked by cancers left in the standard queue
-- Answers: how the recommended rule performs as cancer prevalence changes.
-- Used by: donor, NGO program lead.
SELECT prevalence, volume, cancers_in_priority, cancers_in_standard,
       false_alarms, total_priority, days_to_clear_priority, days_to_clear_full
FROM impact_scenarios
ORDER BY cancers_in_standard ASC;
