# Canada Wildfire Intelligence dashboard

An in-place extension of the existing GitHub Pages dashboard. No build step or external chart dependency is needed; serve the repository over HTTP to load its JSON and CSV files. The original case study, research links, images, annual chart and five-year mean, month bars, map geometry, Power BI link and CSV downloads remain available.

## Views and filter scope

- `./#overview`: national totals, monthly counts, annual area, and large-fire count and share. Year changes national totals, the map and month bars. The annual chart retains the complete history. The jurisdiction selector applies to the geographic map and ranking.
- `./#geography`: the same Canadian map and geographic ranking, pooled area concentration, fire-size distribution, agency large-fire shares and a rounded-cell hotspot plot. Year and region selections stay synchronized with Overview. Size, agency shares, concentration and hotspots retain the full study scope.
- `./#triage`: five model alert policies, recall, precision, review share, confusion matrix, recall/workload plot, original 2023–2025 evaluation table, and CSV downloads. National/geographic filters do not apply to the held-out evaluation. Yearly results exist only for the original 10× policy and remain explicitly fixed when policies change.

## Data provenance and validation

Existing `summary.json` and the original `../test_policies.csv` and `../test_by_year.csv` are unchanged. The two CSVs match byte-for-byte with the linked research repository's `modeling/results/` originals.

Added aggregate data are copied unchanged from [wildfire-seasonal-risk-research at f33afbb3bf878750b3cdd55980d8d79ad3185842](https://github.com/mamkon/wildfire-seasonal-risk-research/tree/f33afbb3bf878750b3cdd55980d8d79ad3185842):

| Local file | Research source |
| --- | --- |
| `data/reference_kpis.csv` | `powerbi/reference_kpis.csv` |
| `data/vw_agency.csv` | `powerbi/validation/vw_agency.csv` |
| `data/vw_concentration.csv` | `powerbi/validation/vw_concentration.csv` |

The 2000–2025 fixed-agency scope has 168,276 records, 83,988,359.25419672 recorded hectares and 9,594 large fires (5.7013%). Large means final recorded area **≥200 ha**, confirmed in `modeling/results/evaluation.json` and the case study. Agency record counts sum to the national total, and weighted agency large-fire shares reconcile to 9,594.

All seven policy and three annual rows reconcile confusion-matrix totals, recall, precision, review rate and accuracy. The 10× policy has 18,814 held-out records: TP 1,498, FP 3,793, FN 529, TN 12,994. Recall is 73.9023%, precision 28.3122%, review share 28.1227%. Annual confusion counts sum exactly to the pooled result. Five model policies exclude the alert-all and alert-none baselines; all seven remain downloadable.

All 26 annual record counts, area totals and five-year means match the research annual export at the dashboard's precision. The pooled area differs from the precise KPI by +0.005803 ha due to rounding. All 12 pooled month counts match the seasonality export. The monthly chart excludes 3,418 records without a known month.

Geographic assignment and reporting agency use separate denominators. The geographic ranking includes records with mappable coordinates that could not be assigned to a province or territory under Unassigned. It excludes 207 records without mappable coordinates across the study period. Prince Edward Island's reporting agency is outside the study scope, while the geographic summary includes five records assigned there and 0.52 recorded hectares.

The research concentration export gives pooled shares of 81.7219%, 96.2133% and 98.8197% for the largest 1%, 3% and 5% of records. The same ranked-record method gives 99.8024% for the top 10%. Each group rounds its record count up. The raw-source rebuild also supplies annual large-fire counts, six size bands and 1,121 one-degree rounded cells. The hotspot chart shows historical large-fire counts by cell. Cell area varies with latitude, so count alone does not estimate geographic fire risk or ecological burn severity.

`data/build_geography.py RAW_FILE RESEARCH_CHECKOUT` uses pandas and the pinned research repository's preparation and scope rules. It checks the CNFDB SHA-256, each annual count and area, the published concentration shares, and the mapped subtotal before writing `data/geographic-evidence.json`. It found two exact-duplicate candidates in the year and agency window, zero missing or invalid size candidates, and 1,078 included records with a repeated ID. The analytical scope excludes exact duplicates and keeps repeated IDs for descriptive totals. The evaluation documents its separate ambiguous-identity exclusions. The public export contains aggregated rounded cells and no individual coordinates or predictions.

The integration ZIP's Predictive Triage route opens the integrated view. The dashboard reads the original evaluation CSVs, which retain full threshold precision and include both baselines.

## Power BI status

The existing service report URL is preserved. The pinned research repository includes `dashboard/Canada_Wildfire.pbip`, report definitions, a semantic model and `powerbi/measures.dax`. A separate three-page PBIP companion uses the validated public aggregates. Its report definition, semantic model, and embedded import data are delivered independently from the website. The existing service report remains separate from this companion.

## Verification

Run from the repository root:

```sh
python wildfire-triage/dashboard/tests/validate.py
node --check wildfire-triage/dashboard/dashboard.js
python -m http.server 8765
# In another terminal, with Playwright installed:
CHROMIUM_PATH=/usr/bin/chromium node wildfire-triage/dashboard/tests/browser.cjs
```

`CHROMIUM_PATH` is optional when Playwright's bundled Chromium is installed. `DASHBOARD_BASE` overrides the test server URL (include a trailing slash). `PREVIEW_DIR` optionally saves screenshots to an existing directory. The browser test verifies year/reset/map controls, synchronized year selectors, policy changes, fixed annual evaluation scope, keyboard selection, hash navigation, local links and resources, desktop and 390px layouts, and absence of JavaScript exceptions and console errors or warnings.

Desktop and mobile screenshots are in [`previews/`](previews/). See [Overview](previews/overview.png), [Geography](previews/geography.png), [Triage](previews/triage.png), and the corresponding `*-mobile.png` files. The follow-up audit also checked viewport widths from 320 to 1440 pixels, ran axe on desktop and mobile, and verified that CSV downloads from the case study and dashboard matched the shipped files.

## Deployment

This is a static GitHub Pages change on a dedicated branch. After the PR is merged and Pages deploys, the existing URL serves the update:

- https://mamkon.github.io/wildfire-triage/dashboard/#overview
- https://mamkon.github.io/wildfire-triage/dashboard/#geography
- https://mamkon.github.io/wildfire-triage/dashboard/#triage
- https://mamkon.github.io/wildfire-triage/predictive-triage/

No main-branch push, merge, Pages configuration change or Power BI publication is performed as part of preparing the PR.
