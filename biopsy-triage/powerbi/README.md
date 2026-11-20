# Power BI Build Guide: ML-Assisted Biopsy Triage

This folder is the build kit for the Power BI report: the data model, the DAX measures and the page layout. The report is built in Power BI Desktop from the CSV files in [`../data`](../data).

## 1. Load the data

Get Data > Text/CSV and load all four files:

| File | What it holds |
|---|---|
| `biopsies.csv` | All 569 biopsies: 30 image-derived features, `is_malignant` (1 = malignant), `split` (train/test) |
| `predictions.csv` | One row per test biopsy per model (171 x 2): probability of malignancy, default and tuned flags, threshold used |
| `model_runs.csv` | Audit trail: hyperparameter, threshold, cross-validated recall, test recall, test specificity, target met, run date, owner |
| `impact_scenarios.csv` | Queue simulation per 1,000 biopsies at 15%, 25% and 37% prevalence |

## 2. Data model

- `biopsies[biopsy_id]` (one) to `predictions[biopsy_id]` (many), **single direction**.
- `model_runs` and `impact_scenarios` stay unrelated; they feed cards and tables.
- Add the calculated column `actual_malignant` in `predictions` (see `DAX_measures.dax`).

## 3. Parameters (Modeling > New parameter > Numeric range)

| Parameter | Range | Default | Used for |
|---|---|---|---|
| Threshold | 0.01 to 0.99, step 0.01 | 0.09 | Trade-off explorer |
| Prevalence | 0.05 to 0.40, step 0.01 | 0.25 | Queue simulator |
| Capacity | 5 to 100, step 1 | 20 | Days to clear the queues |

Capacity is an illustrative assumption. Replace it with a partner lab's real daily review capacity.

## 4. Measures

Copy them from [`DAX_measures.dax`](DAX_measures.dax). Expected values at the tuned threshold, which is how you check the build:

| Model | Threshold | Caught | Missed | False alarms | Recall | Specificity | Priority share |
|---|---|---|---|---|---|---|---|
| Logistic Regression | 0.09 | 63 | 1 | 7 | 98.4% | 93.5% | 40.9% |
| k-NN (k=3) | 0.07 | 62 | 2 | 5 | 96.9% | 95.3% | 39.2% |

## 5. Pages

1. **Donor summary.** KPI cards (Cancers Caught, Cancers Missed, False Alarms, Malignant Recall, Specificity), the recommendation ("Fund with conditions"), the three funding conditions and a one-sentence takeaway.
2. **Model comparison.** Two matrices (actual vs flagged) side by side, a metrics table built from `model_runs`, and the top 10 logistic regression coefficients as a bar chart.
3. **Trade-off explorer.** Threshold slider; line chart of Recall @T and Priority Share @T across thresholds; cards for Cancers Missed @T and False Alarms @T.
4. **Queue simulator.** Prevalence and Capacity sliders; cards for Cancers in Priority Queue, Cancers in Standard Queue and Days to Clear Priority Queue vs Days to Clear Full Queue.
5. **Governance and risks.** Model card (purpose, users, data, threshold, limitations, owner, review date), data citation and licence, and the funding conditions.

## 6. Accessibility

- Alt text on every visual (Format > General > Alt text).
- Colour-blind-safe palette: malignant/missed in dark magenta, benign/cleared in blue-grey; never rely on red/green alone.
- Set the tab order (View > Selection > Tab order) to follow reading order.
- Minimum 12 pt text on cards and axis labels.
