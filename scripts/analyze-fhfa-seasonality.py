# How much do US house prices dip in winter, and how does that differ by metro?
#
#   curl -sL -o /path/outside/repo/hpi_master.csv https://www.fhfa.gov/hpi/download/monthly/hpi_master.csv
#   python3 -I scripts/analyze-fhfa-seasonality.py /path/outside/repo/hpi_master.csv
#
# Writes docs/data/fhfa-seasonality-2016-2025.json. The 17 MB CSV itself is NOT committed.
#
# METHOD. FHFA publishes each purchase-only index twice: not seasonally adjusted (index_nsa) and
# seasonally adjusted (index_sa). Their ratio, index_nsa / index_sa - 1, is the seasonal factor FHFA's
# own adjustment removed for that period: how far prices sat above (+) or below (-) the trend purely
# because of the time of year. We average it over the ten full years 2016-2025.
#   - Monthly: the US and the nine census divisions (FHFA's monthly purchase-only series stops there).
#   - Quarterly: the 100 metros in FHFA's purchase-only MSA series.
# Per metro, "winter dip" = the higher of Q2/Q3 minus the lower of Q4/Q1, in percentage points.
#
# WHAT THIS IS NOT. FHFA dates a sale by the loan's origination date (FHFA HPI FAQ), so a house agreed
# around Christmas is counted when its loan is made, usually in the new year. The series covers loans
# bought or guaranteed by Fannie Mae and Freddie Mac only. It is a price pattern, not a measure of any
# one buyer's discount.
import csv
import json
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "docs" / "data" / "fhfa-seasonality-2016-2025.json"
YEARS = range(2016, 2026)
MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def main(path: str) -> None:
    monthly = defaultdict(lambda: defaultdict(list))   # place -> month -> [factor %]
    quarterly = defaultdict(lambda: defaultdict(list))  # (name, id) -> quarter -> [factor %]
    with open(path, newline="", encoding="utf-8") as fh:
        for r in csv.DictReader(fh):
            if r["hpi_type"] != "traditional" or r["hpi_flavor"] != "purchase-only":
                continue
            if int(r["yr"]) not in YEARS or not r["index_nsa"] or not r["index_sa"]:
                continue
            f = (float(r["index_nsa"]) / float(r["index_sa"]) - 1) * 100
            p = int(r["period"])
            if r["frequency"] == "monthly" and r["level"] == "USA or Census Division":
                monthly[r["place_name"]][p].append(f)
            elif r["frequency"] == "quarterly" and r["level"] == "MSA":
                quarterly[(r["place_name"], r["place_id"])][p].append(f)

    avg = lambda xs: round(sum(xs) / len(xs), 2)

    areas = []
    for name, by_m in sorted(monthly.items()):
        if any(len(by_m[m]) != len(YEARS) for m in range(1, 13)):
            raise SystemExit(f"ABORT: {name} is missing months in {YEARS[0]}-{YEARS[-1]}")
        f = {MONTHS[m - 1]: avg(by_m[m]) for m in range(1, 13)}
        hi = max(f, key=f.get); lo = min(f, key=f.get)
        areas.append({"area": name, "factors": f, "december": f["Dec"], "january": f["Jan"],
                      "peakMonth": hi, "peak": f[hi], "lowMonth": lo, "low": f[lo],
                      "peakToLow": round(f[hi] - f[lo], 2)})

    metros = []
    for (name, pid), by_q in quarterly.items():
        if any(len(by_q[q]) != len(YEARS) for q in range(1, 5)):
            continue  # a metro without all 40 quarters is left out rather than averaged on fewer
        q = {f"Q{i}": avg(by_q[i]) for i in range(1, 5)}
        winter = min(q["Q4"], q["Q1"]); summer = max(q["Q2"], q["Q3"])
        metros.append({"metro": name, "id": pid, **q, "winterDip": round(summer - winter, 2),
                       "lowestQuarter": min(q, key=q.get)})
    metros.sort(key=lambda m: m["winterDip"])

    dips = sorted(m["winterDip"] for m in metros)
    n = len(dips)
    median = round((dips[n // 2] + dips[(n - 1) // 2]) / 2, 2)
    low_q = defaultdict(int)
    for m in metros:
        low_q[m["lowestQuarter"]] += 1

    out = {
        "source": "https://www.fhfa.gov/hpi/download/monthly/hpi_master.csv",
        "series": "FHFA House Price Index, traditional purchase-only (Fannie Mae / Freddie Mac loans)",
        "years": f"{YEARS[0]}-{YEARS[-1]}",
        "method": "seasonal factor = index_nsa / index_sa - 1, in %, averaged per month or quarter over the years; "
                  "winterDip = max(Q2,Q3) - min(Q4,Q1) in percentage points",
        "monthlyAreas": areas,
        "metroCount": n,
        "metroMedianWinterDip": median,
        "metrosByLowestQuarter": dict(sorted(low_q.items())),
        "metros": metros,
    }
    OUT.write_text(json.dumps(out, indent=1) + "\n")
    us = next(a for a in areas if a["area"] == "United States")
    print(f"wrote {OUT.relative_to(ROOT)}: {len(areas)} monthly areas, {n} metros")
    print(f"  US: Dec {us['december']}%, Jan {us['january']}%, peak {us['peakMonth']} {us['peak']}%, low {us['lowMonth']} {us['low']}%")
    print(f"  metro median winter dip {median} pts; lowest quarter: {dict(low_q)}")
    print("  smallest:", [(m["metro"], m["winterDip"]) for m in metros[:5]])
    print("  largest: ", [(m["metro"], m["winterDip"]) for m in metros[-10:]])


if __name__ == "__main__":
    main(sys.argv[1])
