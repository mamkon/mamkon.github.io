"""Extract female breast cancer incidence from Statistics Canada
Table 13-10-0747-01 (Canadian Cancer Registry).

Download the full table from
https://www150.statcan.gc.ca/n1/tbl/csv/13100747-eng.zip, unzip it, then:

    python canada/extract_statcan.py PATH/TO/13100747.csv

Writes canada/breast_cancer_incidence_females.csv next to this script.
"""
import sys
from pathlib import Path
import pandas as pd

SITE = "Primary types of cancer (ICD-O-3)"
KEEP = {
    "Number of new cancer cases": "new_cases",
    "Cancer incidence rate": "rate_per_100k",
    "Low 95% confidence interval, cancer incidence rate": "rate_low",
    "High 95% confidence interval, cancer incidence rate": "rate_high",
    "Average age at diagnosis": "average_age",
}
raw = pd.read_csv(sys.argv[1], low_memory=False)
females = raw[(raw.Sex == "Females") & raw.Characteristics.isin(KEEP)]
breast = females[females[SITE] == "Breast [C50.0-C50.9]"]
wide = (breast.pivot_table(index=["GEO", "REF_DATE"], columns="Characteristics", values="VALUE")
        .rename(columns=KEEP).reset_index().rename(columns={"GEO": "geography", "REF_DATE": "year"}))
all_sites = females[females[SITE].str.startswith("Total, all primary sites") &
                    (females.Characteristics == "Number of new cancer cases")]
totals = all_sites.rename(columns={"GEO": "geography", "REF_DATE": "year", "VALUE": "all_cancer_cases"})[
    ["geography", "year", "all_cancer_cases"]]
out = wide.merge(totals, on=["geography", "year"], how="left").dropna(subset=["rate_per_100k"])
out = out[["geography", "year", "new_cases", "all_cancer_cases", "rate_per_100k", "rate_low", "rate_high", "average_age"]]
out[["new_cases", "all_cancer_cases"]] = out[["new_cases", "all_cancer_cases"]].astype("Int64")
target = Path(__file__).resolve().parent / "breast_cancer_incidence_females.csv"
out.sort_values(["geography", "year"]).to_csv(target, index=False)
print(f"Wrote {len(out)} rows to {target.name}")
