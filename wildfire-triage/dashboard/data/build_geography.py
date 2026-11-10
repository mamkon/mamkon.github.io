"""Build public aggregates from the pinned CNFDB file and research checkout."""

import argparse
import csv
import hashlib
import json
import sys
from pathlib import Path

import pandas as pd


def build(raw_path, research):
    sys.path.insert(0, str(research))
    from src.config import END_YEAR, SIZE_LABELS
    from src.load_warehouse import EXCLUDED_AGENCIES, START_YEAR
    from src.prepare_cnfdb import prepare_frame

    source = pd.read_csv(research / "data/source_versions.csv").iloc[0]
    with raw_path.open("rb") as handle:
        digest = hashlib.file_digest(handle, "sha256").hexdigest()
    if digest != source.sha256:
        raise ValueError("CNFDB source hash differs from the pinned research input")

    raw = pd.read_csv(raw_path, low_memory=False)
    records = prepare_frame(raw, pd.read_csv(research / "data/seeds/cause_mapping.csv"))
    scope = records.year.between(START_YEAR, END_YEAR) & ~records.reporting_agency.isin(EXCLUDED_AGENCIES)
    eligible = records.loc[scope & records.eligible_for_analysis]
    year_stats = eligible.groupby("year").agg(records=("size_ha", "size"), area=("size_ha", "sum"), large=("is_large_fire", "sum"))

    dashboard = Path(__file__).resolve().parents[1]
    summary = json.loads((dashboard / "summary.json").read_text(encoding="utf-8"))
    for year, row in year_stats.iterrows():
        expected = summary["annual"][str(int(year))]
        assert row.records == expected["records"]
        assert abs(row.area - expected["area"]) < .0051
    assert len(year_stats) == len(summary["annual"])

    ranked = eligible.sort_values(["size_ha", "source_row"], ascending=[False, True])
    total_area = eligible.size_ha.sum()
    concentration = {
        pct: float(ranked.size_ha.iloc[:(len(ranked) * pct + 99) // 100].sum() / total_area)
        for pct in (1, 3, 5, 10)
    }
    with (dashboard / "data/vw_concentration.csv").open(encoding="utf-8", newline="") as handle:
        for row in csv.DictReader(handle):
            if row["reporting_agency"] == "ALL":
                assert abs(concentration[int(row["top_pct"])] - float(row["area_share"])) < 1e-10

    mapped = eligible.loc[~eligible.invalid_coordinates]
    cells = mapped.groupby(["grid_latitude", "grid_longitude"]).agg(
        records=("size_ha", "size"), large=("is_large_fire", "sum"), area=("size_ha", "sum")
    )
    assert cells.records.sum() == len(mapped)
    assert abs(cells.area.sum() - mapped.size_ha.sum()) < .001
    assert eligible.size_class.value_counts().sum() == len(eligible)
    scoped_ids = eligible.NFDBFIREID.astype("string").str.strip().replace("", pd.NA)
    return {
        "source_sha256": digest,
        "annual_large": {int(year): int(row.large) for year, row in year_stats.iterrows()},
        "top_10_area_share": concentration[10],
        "size_bins": [[label, int(eligible.size_class.eq(label).sum())] for label in SIZE_LABELS],
        "cells": [
            [int(lat), int(lon), int(row.records), int(row.large), round(float(row.area), 2)]
            for (lat, lon), row in cells.iterrows()
        ],
        "quality": {
            "records": len(eligible),
            "missing_size_candidates": int(records.loc[scope, "missing_size"].sum()),
            "invalid_size_candidates": int(records.loc[scope, "invalid_size"].sum()),
            "exact_duplicate_candidates": int(records.loc[scope, "exact_duplicate_row"].sum()),
            "repeated_id_records": int(scoped_ids[scoped_ids.notna()].duplicated(keep=False).sum()),
            "missing_id_records": int(scoped_ids.isna().sum()),
            "invalid_coordinates": int(eligible.invalid_coordinates.sum()),
            "unknown_month": int(eligible.invalid_month.sum()),
        },
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("raw_file", type=Path)
    parser.add_argument("research_checkout", type=Path)
    args = parser.parse_args()
    data = build(args.raw_file, args.research_checkout.resolve())
    target = Path(__file__).with_name("geographic-evidence.json")
    target.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(data["quality"], len(data["cells"]), data["top_10_area_share"])
