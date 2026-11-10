"""Validate shipped aggregate data without requiring the private fire archive."""
import csv
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
def rows(path):
    with path.open(encoding='utf-8', newline='') as f:
        return list(csv.DictReader(f))

policies = rows(ROOT.parent / 'test_policies.csv')
yearly = rows(ROOT.parent / 'test_by_year.csv')
for row in policies + yearly:
    tn, fp, fn, tp = (int(row[k]) for k in ['true_negatives','false_positives','false_negatives','true_positives'])
    n = int(row['records'])
    assert tn + fp + fn + tp == n
    for field, expected in [('recall',tp/(tp+fn)),('alert_share',(tp+fp)/n),('accuracy',(tp+tn)/n)]:
        assert math.isclose(float(row[field]),expected,abs_tol=1e-12), (field,row)
    assert not row['precision'] if tp+fp == 0 else math.isclose(float(row['precision']),tp/(tp+fp),abs_tol=1e-12)
assert len({r['policy'] for r in policies}) == len(policies) == 7
assert [r['year'] for r in yearly] == ['2023','2024','2025']
selected = next(r for r in policies if r['policy'] == 'Miss cost 10×')
for field in ['records','true_negatives','false_positives','false_negatives','true_positives']:
    assert sum(int(r[field]) for r in yearly) == int(selected[field])
assert all(float(r['threshold']) == float(selected['threshold']) for r in yearly)
summary = json.loads((ROOT/'summary.json').read_text(encoding='utf-8'))
kpi = rows(ROOT/'data/reference_kpis.csv')[0]
assert sum(v['records'] for v in summary['annual'].values()) == int(kpi['reported_records']) == 168276
area_difference = sum(v['area'] for v in summary['annual'].values()) - float(kpi['area_ha'])
assert abs(area_difference) < .15, area_difference # published annual values round to cents
unknown_month = 0
for year, row in summary['annual'].items():
    assert len(row['months']) == 12
    assert all(n >= 0 for n in row['months'])
    assert sum(row['months']) <= row['records']
    unknown_month += row['records'] - sum(row['months'])
for name, region in summary['regions'].items():
    assert all(int(y) in range(2000,2026) and n >= 0 and a >= 0 for y,(n,a) in region['years'].items()), name
geographic_counts = {
    year: sum(region['years'].get(year, (0, 0))[0] for region in summary['regions'].values())
    for year in summary['annual']
}
assert all(count <= summary['annual'][year]['records'] for year, count in geographic_counts.items())
assert int(kpi['reported_records']) - sum(geographic_counts.values()) == 207
agencies = rows(ROOT/'data/vw_agency.csv')
assert len({r['reporting_agency'] for r in agencies}) == len(agencies) == 12
assert sum(int(r['reported_records']) for r in agencies) == 168276
assert math.isclose(sum(int(r['reported_records'])*float(r['large_fire_share']) for r in agencies),9594)
concentration = rows(ROOT/'data/vw_concentration.csv')
assert len({(r['reporting_agency'],r['top_pct']) for r in concentration}) == len(concentration)
assert all(0 <= float(r['area_share']) <= 1 for r in concentration)
print(f'PASS: 7 policies, 3 yearly rows, counts and ratios; 168,276 national records; 9,594 large fires; 12 agencies; {unknown_month} unknown-month records; area rounding difference {area_difference:.6f} ha.')
print('Record-level duplicates, missing coordinates and size distributions cannot be rechecked from aggregate exports.')
