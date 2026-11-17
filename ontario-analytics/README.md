# Ontario Analytics browser companion

An interactive, three-page browser version of my Ontario chronic disease and healthcare access Power BI report. Every figure comes from two public sources:

| Source | What it gives the page | Licence |
| --- | --- | --- |
| [Public Health Ontario, Chronic Disease Incidence and Prevalence Snapshot (2014 to 2023)](https://www.publichealthontario.ca/en/Data-and-Analysis/Chronic-Disease/Chronic-Disease-Incidence-Prevalence), based on ICES Chronic Disease Derived Cohorts | Age-standardized incidence and prevalence (both sexes, per 100,000) of asthma, COPD, diabetes and hypertension, for Ontario and 29 Public Health Units | Open Government Licence – Ontario |
| [CIHI, Wait Times for Priority Procedures in Canada, 2008–2024 — Data Tables (2025)](https://www.cihi.ca/en/explore-wait-times-for-priority-procedures-across-canada) | Median and 90th-percentile waits, benchmark share and volume for hip replacement, knee replacement and MRI (Ontario), plus hip and knee for Ontario's 6 health regions | CIHI terms of use, with attribution |

## How the data was prepared

`build_data.py` turns the two publisher workbooks into `ontario-public-data.json`, the file the page reads:

- Keeps only age-standardized rates for both sexes, and separates the 29 Public Health Units from Ontario and the regional rollups.
- Keeps counts of 1 to 4 cases suppressed, as the publisher does. Those show as "not available".
- Keeps CIHI calendar-year rows only (April to September periods). The extra fiscal-year and Q3–Q4 periods collected during COVID-19 are left out.
- Never sums rates, medians or percentages. Provincial rates and Public Health Unit medians stay separate.

Run it with `python build_data.py ontario-public-data.json <folder with the two .xlsx files>`. The workbooks are in my [course repository](https://github.com/mamkon/Architecture_and_Data_Audit).

## Limits

- Historical figures, not live data. Public Health Unit boundaries follow the publisher's snapshot.
- No Public Health Unit to CIHI region join is made, and nothing here is a forecast or clinical advice.
- This is a browser companion, not a native Power BI export.
