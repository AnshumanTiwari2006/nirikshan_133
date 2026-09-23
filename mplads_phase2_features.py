"""
MPLADS AI — PHASE 2
Feature Engineering + Initial Risk Signals
===========================================

INPUTS
------
data/processed/fact_work.csv
data/processed/fact_payment.csv
data/processed/recommended_clean.csv
data/processed/sanctioned_clean.csv
data/processed/completed_clean.csv
data/processed/payment_clean.csv

OUTPUTS
-------
data/features/work_features.csv
data/features/payment_features.csv
data/features/vendor_features.csv
data/features/mp_features.csv
data/features/district_features.csv
data/features/category_features.csv
data/features/risk_signals.csv
data/features/model_features.csv
data/quality_reports/data_quality_events.csv

IMPORTANT
---------
This phase DOES NOT train ML models.

It creates:
1. Analytical features
2. Lifecycle/timeline features
3. Financial features
4. Payment/vendor behaviour features
5. MP/district/category rollups
6. Explainable rule-based risk signals
7. A model-ready feature table

The rule-based risk score is only a BASELINE / EXPLAINABILITY layer.
Isolation Forest, anomaly models, duplicate-work similarity and other
ML components should be built after this phase is validated.
"""

from pathlib import Path
import re
import numpy as np
import pandas as pd


# ============================================================
# 1. DIRECTORIES
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

DATA_DIR = BASE_DIR / "data"
PROCESSED_DIR = DATA_DIR / "processed"
FEATURE_DIR = DATA_DIR / "features"
QUALITY_DIR = DATA_DIR / "quality_reports"

FEATURE_DIR.mkdir(parents=True, exist_ok=True)
QUALITY_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================
# 2. SETTINGS
# ============================================================

TODAY = pd.Timestamp.today().normalize()

# Conservative thresholds for INITIAL rule-based signals.
# These are not government/legal thresholds.
# They are screening thresholds that will later be calibrated.
OVER_BUDGET_RATE_THRESHOLD = 10.0       # %
HIGH_UTILIZATION_THRESHOLD = 100.0      # %
VERY_HIGH_UTILIZATION_THRESHOLD = 110.0 # %
LONG_COMPLETION_DAYS = 730              # 2 years
LONG_PENDING_DAYS = 730                # 2 years
PAYMENT_RECENCY_DAYS = 365              # 1 year
HIGH_VENDOR_CONCENTRATION = 0.90       # HHI-like concentration
HIGH_VENDOR_COUNT = 10
HIGH_PAYMENT_COUNT = 10
RECONCILIATION_TOLERANCE = 1.0          # currency units
SPLIT_PAYMENT_RATIO = 0.01             # many small payments relative to total


# ============================================================
# 3. HELPERS
# ============================================================

def ensure_datetime(df, columns):
    for col in columns:
        if col in df.columns:
            df[col] = pd.to_datetime(
                df[col],
                errors="coerce",
            )
    return df


def ensure_numeric(df, columns):
    for col in columns:
        if col in df.columns:
            df[col] = pd.to_numeric(
                df[col],
                errors="coerce",
            )
    return df


def safe_divide(numerator, denominator):
    denominator = denominator.replace(0, np.nan)
    return numerator / denominator


def normalize_text(value):
    if pd.isna(value):
        return ""
    value = str(value).upper().strip()
    value = re.sub(r"\s+", " ", value)
    return value


def first_existing(df, candidates):
    for col in candidates:
        if col in df.columns:
            return col
    return None


def save_csv(df, filename):
    path = FEATURE_DIR / filename
    df.to_csv(path, index=False)
    print(f"Saved: {path} | rows={len(df):,} cols={len(df.columns):,}")


# ============================================================
# 4. LOAD PHASE 1 OUTPUTS
# ============================================================

print("=" * 72)
print("MPLADS AI — PHASE 2")
print("FEATURE ENGINEERING + INITIAL RISK SIGNALS")
print("=" * 72)

required_files = [
    PROCESSED_DIR / "fact_work.csv",
    PROCESSED_DIR / "fact_payment.csv",
    PROCESSED_DIR / "recommended_clean.csv",
    PROCESSED_DIR / "sanctioned_clean.csv",
    PROCESSED_DIR / "completed_clean.csv",
    PROCESSED_DIR / "payment_clean.csv",
]

missing = [str(p) for p in required_files if not p.exists()]

if missing:
    print("\nMissing Phase 1 files:")
    for path in missing:
        print(" -", path)

    raise FileNotFoundError(
        "Run mplads_etl_phase1.py successfully before Phase 2."
    )


fact_work = pd.read_csv(
    PROCESSED_DIR / "fact_work.csv"
)

fact_payment = pd.read_csv(
    PROCESSED_DIR / "fact_payment.csv"
)

recommended = pd.read_csv(
    PROCESSED_DIR / "recommended_clean.csv"
)

sanctioned = pd.read_csv(
    PROCESSED_DIR / "sanctioned_clean.csv"
)

completed = pd.read_csv(
    PROCESSED_DIR / "completed_clean.csv"
)

payment_clean = pd.read_csv(
    PROCESSED_DIR / "payment_clean.csv"
)


# ============================================================
# 5. BASIC TYPE CLEANING
# ============================================================

date_columns = [
    "recommended_date",
    "sanction_date",
    "completion_date",
    "first_expenditure_date",
    "last_expenditure_date",
]

numeric_columns = [
    "recommended_amount",
    "sanction_amount",
    "completed_amount",
    "total_expenditure",
    "payment_count",
    "vendor_count",
    "utilization_rate",
    "cost_overrun_amount",
    "cost_overrun_rate",
    "completion_days",
    "completion_vs_expenditure_difference",
]

fact_work = ensure_datetime(
    fact_work,
    date_columns,
)

fact_work = ensure_numeric(
    fact_work,
    numeric_columns,
)

fact_payment = ensure_datetime(
    fact_payment,
    ["expenditure_date"],
)

fact_payment = ensure_numeric(
    fact_payment,
    ["fund_disbursed_amount"],
)


# ============================================================
# 6. DATA QUALITY EVENTS
# ============================================================

print("\n" + "=" * 72)
print("BUILDING DATA QUALITY EVENTS")
print("=" * 72)

quality_events = []


def add_quality_event(
    source,
    row_number,
    work_id,
    column,
    raw_value,
    issue_type,
    severity,
):
    quality_events.append({
        "source": source,
        "row_number": row_number,
        "work_id": work_id,
        "column": column,
        "raw_value": raw_value,
        "issue_type": issue_type,
        "severity": severity,
    })


# Recommended malformed/missing Work IDs.
if "work_id" in recommended.columns:

    bad_recommended = recommended[
        recommended["work_id"].isna()
    ]

    for idx, row in bad_recommended.iterrows():
        add_quality_event(
            source="recommended",
            row_number=int(idx) + 1,
            work_id=None,
            column="work",
            raw_value=row.get("work"),
            issue_type="MISSING_OR_MALFORMED_WORK_ID",
            severity="MEDIUM",
        )


# Sanctioned malformed Work IDs.
if "work_id" in sanctioned.columns:

    bad_sanctioned = sanctioned[
        sanctioned["work_id"].isna()
    ]

    for idx, row in bad_sanctioned.iterrows():
        add_quality_event(
            source="sanctioned",
            row_number=int(idx) + 1,
            work_id=None,
            column="work",
            raw_value=row.get("work"),
            issue_type="MISSING_OR_MALFORMED_WORK_ID",
            severity="HIGH",
        )


# Completed malformed Work IDs.
if "work_id" in completed.columns:

    bad_completed = completed[
        completed["work_id"].isna()
    ]

    for idx, row in bad_completed.iterrows():
        add_quality_event(
            source="completed",
            row_number=int(idx) + 1,
            work_id=None,
            column="work",
            raw_value=row.get("work"),
            issue_type="MISSING_OR_MALFORMED_WORK_ID",
            severity="MEDIUM",
        )


# Suspicious Work Status values.
if "work_status" in sanctioned.columns:

    known_status_words = [
        "COMPLETED",
        "ONGOING",
        "SANCTIONED",
        "PENDING",
        "CANCELLED",
        "IN PROGRESS",
        "NOT STARTED",
    ]

    for idx, row in sanctioned.iterrows():

        status = row.get("work_status")

        if pd.isna(status):
            continue

        status_text = str(status).strip().upper()

        # Numeric-looking status is suspicious.
        if re.fullmatch(
            r"[-+]?\d+(?:\.\d+)?",
            status_text,
        ):

            add_quality_event(
                source="sanctioned",
                row_number=int(idx) + 1,
                work_id=row.get("work_id"),
                column="work_status",
                raw_value=status,
                issue_type="NUMERIC_VALUE_IN_STATUS_FIELD",
                severity="HIGH",
            )


quality_events_df = pd.DataFrame(
    quality_events,
    columns=[
        "source",
        "row_number",
        "work_id",
        "column",
        "raw_value",
        "issue_type",
        "severity",
    ],
)

quality_events_path = (
    QUALITY_DIR / "data_quality_events.csv"
)

quality_events_df.to_csv(
    quality_events_path,
    index=False,
)

print(
    f"Data-quality events found: "
    f"{len(quality_events_df):,}"
)

print(
    f"Saved: {quality_events_path}"
)


# ============================================================
# 7. WORK-LEVEL LIFECYCLE FEATURES
# ============================================================

print("\n" + "=" * 72)
print("BUILDING WORK LIFECYCLE FEATURES")
print("=" * 72)

work_features = fact_work.copy()


# ------------------------------------------------------------
# Recommendation → Sanction
# ------------------------------------------------------------

work_features["recommendation_to_sanction_days"] = (
    work_features["sanction_date"]
    -
    work_features["recommended_date"]
).dt.days


# ------------------------------------------------------------
# Sanction → Completion
# ------------------------------------------------------------

work_features["sanction_to_completion_days"] = (
    work_features["completion_date"]
    -
    work_features["sanction_date"]
).dt.days


# ------------------------------------------------------------
# Recommendation → Completion
# ------------------------------------------------------------

work_features["recommendation_to_completion_days"] = (
    work_features["completion_date"]
    -
    work_features["recommended_date"]
).dt.days


# ------------------------------------------------------------
# Sanction → First Expenditure
# ------------------------------------------------------------

work_features["sanction_to_first_payment_days"] = (
    work_features["first_expenditure_date"]
    -
    work_features["sanction_date"]
).dt.days


# ------------------------------------------------------------
# First → Last Expenditure
# ------------------------------------------------------------

work_features["payment_activity_duration_days"] = (
    work_features["last_expenditure_date"]
    -
    work_features["first_expenditure_date"]
).dt.days


# ------------------------------------------------------------
# Days since last expenditure
# ------------------------------------------------------------

work_features["days_since_last_expenditure"] = (
    TODAY
    -
    work_features["last_expenditure_date"]
).dt.days


# ------------------------------------------------------------
# Days since sanction for incomplete work
# ------------------------------------------------------------

work_features["days_since_sanction"] = (
    TODAY
    -
    work_features["sanction_date"]
).dt.days


# ============================================================
# 8. FINANCIAL FEATURES
# ============================================================

print("\nBuilding financial features...")

work_features["expenditure_to_sanction_ratio"] = (
    safe_divide(
        work_features["total_expenditure"],
        work_features["sanction_amount"],
    )
)

work_features["expenditure_to_sanction_pct"] = (
    work_features["expenditure_to_sanction_ratio"]
    * 100
)

work_features["recommendation_to_sanction_amount_change"] = (
    work_features["sanction_amount"]
    -
    work_features["recommended_amount"]
)

work_features["sanction_amount_change_pct"] = (
    safe_divide(
        work_features[
            "recommendation_to_sanction_amount_change"
        ],
        work_features["recommended_amount"],
    )
    * 100
)


# ------------------------------------------------------------
# Completion amount vs expenditure
# ------------------------------------------------------------

work_features["completion_expenditure_difference"] = (
    work_features["completed_amount"]
    -
    work_features["total_expenditure"]
)

work_features["completion_expenditure_difference_pct"] = (
    safe_divide(
        work_features[
            "completion_expenditure_difference"
        ].abs(),
        work_features["completed_amount"].abs(),
    )
    * 100
)


# ------------------------------------------------------------
# Remaining sanctioned amount
# ------------------------------------------------------------

work_features["remaining_sanction_balance"] = (
    work_features["sanction_amount"]
    -
    work_features["total_expenditure"]
)


# ============================================================
# 9. PAYMENT FEATURES
# ============================================================

print("\nBuilding payment behaviour features...")

payment_group = fact_payment.groupby(
    "work_id",
    dropna=True,
)

payment_agg = payment_group.agg(
    payment_mean_amount=(
        "fund_disbursed_amount",
        "mean",
    ),

    payment_median_amount=(
        "fund_disbursed_amount",
        "median",
    ),

    payment_max_amount=(
        "fund_disbursed_amount",
        "max",
    ),

    payment_min_amount=(
        "fund_disbursed_amount",
        "min",
    ),

    payment_std_amount=(
        "fund_disbursed_amount",
        "std",
    ),

    unique_payment_dates=(
        "expenditure_date",
        "nunique",
    ),
).reset_index()


work_features = work_features.merge(
    payment_agg,
    on="work_id",
    how="left",
)


# ------------------------------------------------------------
# Maximum payment share
# ------------------------------------------------------------

work_features["max_payment_share"] = safe_divide(
    work_features["payment_max_amount"],
    work_features["total_expenditure"],
)


# ------------------------------------------------------------
# Average payment share
# ------------------------------------------------------------

work_features["average_payment_share"] = safe_divide(
    work_features["payment_mean_amount"],
    work_features["total_expenditure"],
)


# ------------------------------------------------------------
# Payments per active month
# ------------------------------------------------------------

work_features["payment_count_per_month"] = safe_divide(
    work_features["payment_count"],
    (
        work_features["payment_activity_duration_days"]
        .clip(lower=1)
        / 30
    ),
)


# ============================================================
# 10. VENDOR CONCENTRATION FEATURES
# ============================================================

print("\nBuilding vendor concentration features...")

vendor_work = fact_payment[
    [
        "work_id",
        "vendor_name",
        "fund_disbursed_amount",
    ]
].copy()

vendor_work["vendor_name_clean"] = (
    vendor_work["vendor_name"]
    .apply(normalize_text)
)

vendor_work = vendor_work[
    vendor_work["vendor_name_clean"] != ""
].copy()


# Vendor amount per work.
vendor_amounts = (
    vendor_work
    .groupby(
        [
            "work_id",
            "vendor_name_clean",
        ],
        as_index=False,
    )["fund_disbursed_amount"]
    .sum()
)

vendor_amounts["vendor_share"] = (
    vendor_amounts["fund_disbursed_amount"]
    /
    vendor_amounts.groupby("work_id")[
        "fund_disbursed_amount"
    ].transform("sum")
)


# HHI-style concentration:
# sum of squared vendor shares.
vendor_hhi = (
    vendor_amounts
    .assign(
        vendor_share_squared=lambda x:
        x["vendor_share"] ** 2
    )
    .groupby("work_id")
    .agg(
        vendor_hhi=(
            "vendor_share_squared",
            "sum",
        ),

        dominant_vendor_share=(
            "vendor_share",
            "max",
        ),

        vendor_amount_std=(
            "fund_disbursed_amount",
            "std",
        ),
    )
    .reset_index()
)

work_features = work_features.merge(
    vendor_hhi,
    on="work_id",
    how="left",
)


# ============================================================
# 11. PAYMENT SPLITTING FEATURES
# ============================================================

print("\nBuilding payment splitting features...")

payment_split = (
    fact_payment
    .groupby("work_id")
    .agg(
        payment_count=("payment_id", "count"),
        total_expenditure=(
            "fund_disbursed_amount",
            "sum",
        ),
    )
    .reset_index()
)

# Threshold based on the total expenditure.
# This is a screening feature, not proof of splitting.
payment_thresholds = (
    payment_split["total_expenditure"].abs()
    * SPLIT_PAYMENT_RATIO
)

payment_split["small_payment_count"] = 0

# Use merge back to individual transactions.
payment_with_total = fact_payment.merge(
    payment_split[
        [
            "work_id",
            "total_expenditure",
        ]
    ],
    on="work_id",
    how="left",
    suffixes=("", "_work"),
)

payment_with_total["small_payment_flag"] = (
    payment_with_total["fund_disbursed_amount"].abs()
    <=
    (
        payment_with_total["total_expenditure"].abs()
        *
        SPLIT_PAYMENT_RATIO
    )
)

small_payment_counts = (
    payment_with_total
    .groupby("work_id")["small_payment_flag"]
    .sum()
    .reset_index(
        name="small_payment_count"
    )
)

work_features = work_features.merge(
    small_payment_counts,
    on="work_id",
    how="left",
)


work_features["small_payment_ratio"] = safe_divide(
    work_features["small_payment_count"],
    work_features["payment_count"],
)


# ============================================================
# 12. STATUS FEATURES
# ============================================================

print("\nBuilding status/lifecycle flags...")

status_text = (
    work_features
    .get(
        "work_status",
        pd.Series(
            "",
            index=work_features.index,
        ),
    )
    .fillna("")
    .astype(str)
    .str.upper()
    .str.strip()
)

work_features["status_is_completed"] = (
    status_text.str.contains(
        "COMPLETE",
        na=False,
    )
    |
    work_features["completion_date"].notna()
)

work_features["status_is_ongoing"] = (
    status_text.str.contains(
        "ONGOING|IN PROGRESS",
        regex=True,
        na=False,
    )
)

work_features["status_is_pending"] = (
    status_text.str.contains(
        "PENDING|NOT STARTED",
        regex=True,
        na=False,
    )
)


# ============================================================
# 13. DELAY FEATURES
# ============================================================

print("\nBuilding delay features...")

work_features["long_completion_flag"] = (
    work_features["sanction_to_completion_days"]
    >
    LONG_COMPLETION_DAYS
)

work_features["long_pending_flag"] = (
    work_features["completion_date"].isna()
    &
    (
        work_features["days_since_sanction"]
        >
        LONG_PENDING_DAYS
    )
)

work_features["stale_payment_activity_flag"] = (
    work_features["completion_date"].isna()
    &
    (
        work_features["days_since_last_expenditure"]
        >
        PAYMENT_RECENCY_DAYS
    )
)


# ============================================================
# 14. FINANCIAL ANOMALY FLAGS
# ============================================================

print("\nBuilding financial anomaly signals...")

work_features["over_budget_flag_v2"] = (
    work_features["cost_overrun_rate"]
    >
    OVER_BUDGET_RATE_THRESHOLD
)

work_features["very_high_utilization_flag"] = (
    work_features["expenditure_to_sanction_pct"]
    >
    VERY_HIGH_UTILIZATION_THRESHOLD
)

work_features["reconciliation_mismatch_flag"] = (
    work_features[
        "completion_expenditure_difference"
    ].abs()
    >
    RECONCILIATION_TOLERANCE
)


# ============================================================
# 15. PAYMENT / VENDOR ANOMALY FLAGS
# ============================================================

print("\nBuilding payment/vendor anomaly signals...")

work_features["high_vendor_concentration_flag"] = (
    work_features["dominant_vendor_share"]
    >=
    HIGH_VENDOR_CONCENTRATION
)

work_features["many_vendor_flag"] = (
    work_features["vendor_count"]
    >=
    HIGH_VENDOR_COUNT
)

work_features["many_payment_flag"] = (
    work_features["payment_count"]
    >=
    HIGH_PAYMENT_COUNT
)

work_features["payment_splitting_signal"] = (
    (
        work_features["small_payment_ratio"]
        >=
        0.50
    )
    &
    (
        work_features["payment_count"]
        >=
        5
    )
)


# ============================================================
# 16. DATA QUALITY FLAGS
# ============================================================

work_features["invalid_work_id_flag"] = (
    work_features["work_id"].isna()
)

work_features["missing_sanction_amount_flag"] = (
    work_features["sanction_amount"].isna()
)

work_features["missing_recommended_amount_flag"] = (
    work_features["recommended_amount"].isna()
)


# ============================================================
# 17. EXPLAINABLE BASELINE RISK SCORE
# ============================================================

print("\nBuilding baseline explainable risk score...")

# IMPORTANT:
# This is NOT an ML score.
# It is a transparent screening score to validate feature behaviour.

risk_columns = {
    "over_budget_flag_v2": 20,
    "very_high_utilization_flag": 15,
    "long_completion_flag": 15,
    "long_pending_flag": 15,
    "stale_payment_activity_flag": 10,
    "reconciliation_mismatch_flag": 15,
    "high_vendor_concentration_flag": 10,
    "payment_splitting_signal": 10,
    "many_payment_flag": 5,
    "many_vendor_flag": 5,
}

work_features["baseline_risk_score"] = 0.0

for flag, weight in risk_columns.items():

    work_features["baseline_risk_score"] += (
        work_features[flag]
        .fillna(False)
        .astype(int)
        *
        weight
    )


work_features["baseline_risk_score"] = (
    work_features["baseline_risk_score"]
    .clip(upper=100)
)


def risk_band(score):

    if pd.isna(score):
        return "UNKNOWN"

    if score >= 70:
        return "HIGH"

    if score >= 40:
        return "MEDIUM"

    return "LOW"


work_features["baseline_risk_band"] = (
    work_features["baseline_risk_score"]
    .apply(risk_band)
)


# ============================================================
# 18. GENERATE "WHY FLAGGED" EXPLANATIONS
# ============================================================

def build_reason_list(row):

    reasons = []

    if row.get("over_budget_flag_v2", False):
        reasons.append(
            "Expenditure exceeds sanctioned amount"
        )

    if row.get("very_high_utilization_flag", False):
        reasons.append(
            "Very high fund utilization"
        )

    if row.get("long_completion_flag", False):
        reasons.append(
            "Long completion duration"
        )

    if row.get("long_pending_flag", False):
        reasons.append(
            "Long-running pending work"
        )

    if row.get("stale_payment_activity_flag", False):
        reasons.append(
            "No recent expenditure activity"
        )

    if row.get("reconciliation_mismatch_flag", False):
        reasons.append(
            "Completed amount differs from payment expenditure"
        )

    if row.get("high_vendor_concentration_flag", False):
        reasons.append(
            "High concentration of expenditure with one vendor"
        )

    if row.get("payment_splitting_signal", False):
        reasons.append(
            "Many relatively small payment transactions"
        )

    if row.get("many_payment_flag", False):
        reasons.append(
            "High number of payment transactions"
        )

    if row.get("many_vendor_flag", False):
        reasons.append(
            "High number of vendors"
        )

    if not reasons:
        reasons.append(
            "No baseline risk rule triggered"
        )

    return " | ".join(reasons)


work_features["risk_reasons"] = (
    work_features
    .apply(
        build_reason_list,
        axis=1,
    )
)


# ============================================================
# 19. VENDOR-LEVEL FEATURES
# ============================================================

print("\nBuilding vendor-level features...")

vendor_features = (
    fact_payment
    .assign(
        vendor_name_clean=lambda x:
        x["vendor_name"].apply(normalize_text)
    )
    .query("vendor_name_clean != ''")
    .groupby("vendor_name_clean")
    .agg(
        transaction_count=(
            "payment_id",
            "count",
        ),

        work_count=(
            "work_id",
            "nunique",
        ),

        total_disbursed=(
            "fund_disbursed_amount",
            "sum",
        ),

        average_transaction=(
            "fund_disbursed_amount",
            "mean",
        ),

        median_transaction=(
            "fund_disbursed_amount",
            "median",
        ),

        max_transaction=(
            "fund_disbursed_amount",
            "max",
        ),

        first_transaction_date=(
            "expenditure_date",
            "min",
        ),

        last_transaction_date=(
            "expenditure_date",
            "max",
        ),
    )
    .reset_index()
)

vendor_features["transactions_per_work"] = safe_divide(
    vendor_features["transaction_count"],
    vendor_features["work_count"],
)

vendor_features["average_work_value"] = safe_divide(
    vendor_features["total_disbursed"],
    vendor_features["work_count"],
)

vendor_features["vendor_name_clean"] = (
    vendor_features["vendor_name_clean"]
)


# ============================================================
# 20. MP-LEVEL FEATURES
# ============================================================

print("\nBuilding MP-level features...")

mp_features = (
    work_features
    .groupby("mp_code", dropna=False)
    .agg(
        work_count=("work_id", "nunique"),

        sanctioned_amount_total=(
            "sanction_amount",
            "sum",
        ),

        expenditure_total=(
            "total_expenditure",
            "sum",
        ),

        completed_work_count=(
            "completed_flag",
            "sum",
        ),

        high_risk_work_count=(
            "baseline_risk_band",
            lambda x:
            (x == "HIGH").sum(),
        ),

        medium_risk_work_count=(
            "baseline_risk_band",
            lambda x:
            (x == "MEDIUM").sum(),
        ),

        average_risk_score=(
            "baseline_risk_score",
            "mean",
        ),

        average_cost_overrun_rate=(
            "cost_overrun_rate",
            "mean",
        ),

        average_utilization_rate=(
            "expenditure_to_sanction_pct",
            "mean",
        ),

        total_payment_count=(
            "payment_count",
            "sum",
        ),

        total_vendor_count=(
            "vendor_count",
            "sum",
        ),
    )
    .reset_index()
)

mp_features["completion_rate"] = safe_divide(
    mp_features["completed_work_count"],
    mp_features["work_count"],
)

mp_features["high_risk_rate"] = safe_divide(
    mp_features["high_risk_work_count"],
    mp_features["work_count"],
)


# ============================================================
# 21. DISTRICT-LEVEL FEATURES
# ============================================================

print("\nBuilding district-level features...")

district_features = (
    work_features
    .groupby(
        [
            "state",
            "district_name",
        ],
        dropna=False,
    )
    .agg(
        work_count=("work_id", "nunique"),

        sanctioned_amount_total=(
            "sanction_amount",
            "sum",
        ),

        expenditure_total=(
            "total_expenditure",
            "sum",
        ),

        completed_work_count=(
            "completed_flag",
            "sum",
        ),

        high_risk_work_count=(
            "baseline_risk_band",
            lambda x:
            (x == "HIGH").sum(),
        ),

        average_risk_score=(
            "baseline_risk_score",
            "mean",
        ),

        average_cost_overrun_rate=(
            "cost_overrun_rate",
            "mean",
        ),

        average_completion_days=(
            "sanction_to_completion_days",
            "mean",
        ),
    )
    .reset_index()
)

district_features["completion_rate"] = safe_divide(
    district_features["completed_work_count"],
    district_features["work_count"],
)

district_features["high_risk_rate"] = safe_divide(
    district_features["high_risk_work_count"],
    district_features["work_count"],
)


# ============================================================
# 22. CATEGORY FEATURES
# ============================================================

category_column = first_existing(
    work_features,
    [
        "work_category",
    ],
)

if category_column:

    category_features = (
        work_features
        .groupby(
            category_column,
            dropna=False,
        )
        .agg(
            work_count=("work_id", "nunique"),

            sanctioned_amount_total=(
                "sanction_amount",
                "sum",
            ),

            expenditure_total=(
                "total_expenditure",
                "sum",
            ),

            completed_work_count=(
                "completed_flag",
                "sum",
            ),

            high_risk_work_count=(
                "baseline_risk_band",
                lambda x:
                (x == "HIGH").sum(),
            ),

            average_risk_score=(
                "baseline_risk_score",
                "mean",
            ),

            average_cost_overrun_rate=(
                "cost_overrun_rate",
                "mean",
            ),

            average_completion_days=(
                "sanction_to_completion_days",
                "mean",
            ),
        )
        .reset_index()
    )

else:

    category_features = pd.DataFrame()


# ============================================================
# 23. MODEL-READY FEATURE TABLE
# ============================================================

print("\nBuilding model-ready feature table...")

model_feature_candidates = [
    "work_id",
    "mp_code",
    "financial_year",

    "recommended_amount",
    "sanction_amount",
    "completed_amount",
    "total_expenditure",

    "payment_count",
    "vendor_count",

    "recommendation_to_sanction_days",
    "sanction_to_completion_days",
    "recommendation_to_completion_days",
    "sanction_to_first_payment_days",
    "payment_activity_duration_days",
    "days_since_last_expenditure",
    "days_since_sanction",

    "expenditure_to_sanction_ratio",
    "expenditure_to_sanction_pct",
    "sanction_amount_change_pct",
    "cost_overrun_amount",
    "cost_overrun_rate",
    "remaining_sanction_balance",

    "payment_mean_amount",
    "payment_median_amount",
    "payment_max_amount",
    "payment_min_amount",
    "payment_std_amount",

    "max_payment_share",
    "average_payment_share",
    "payment_count_per_month",

    "vendor_hhi",
    "dominant_vendor_share",

    "small_payment_count",
    "small_payment_ratio",

    "completion_expenditure_difference",
    "completion_expenditure_difference_pct",

    "completed_flag",
    "over_budget_flag_v2",
    "very_high_utilization_flag",
    "long_completion_flag",
    "long_pending_flag",
    "stale_payment_activity_flag",
    "reconciliation_mismatch_flag",
    "high_vendor_concentration_flag",
    "payment_splitting_signal",
    "many_payment_flag",
    "many_vendor_flag",

    "baseline_risk_score",
    "baseline_risk_band",
]

model_feature_columns = [
    c
    for c in model_feature_candidates
    if c in work_features.columns
]

model_features = work_features[
    model_feature_columns
].copy()


# ============================================================
# 24. SAVE OUTPUTS
# ============================================================

print("\n" + "=" * 72)
print("SAVING PHASE 2 OUTPUTS")
print("=" * 72)

save_csv(
    work_features,
    "work_features.csv",
)

payment_feature_cols = [
    "work_id",
    "payment_mean_amount",
    "payment_median_amount",
    "payment_max_amount",
    "payment_min_amount",
    "payment_std_amount",
    "unique_payment_dates",
    "max_payment_share",
    "average_payment_share",
    "payment_count_per_month",
    "small_payment_count",
    "small_payment_ratio"
]

payment_features = work_features[[c for c in payment_feature_cols if c in work_features.columns]].copy()

save_csv(
    payment_features,
    "payment_features.csv",
)

save_csv(
    vendor_features,
    "vendor_features.csv",
)

save_csv(
    mp_features,
    "mp_features.csv",
)

save_csv(
    district_features,
    "district_features.csv",
)

if not category_features.empty:

    save_csv(
        category_features,
        "category_features.csv",
    )


save_csv(
    model_features,
    "model_features.csv",
)

# Risk signals are intentionally separated from all raw features.
risk_signal_columns = [
    "work_id",
    "mp_code",
    "state",
    "district_name",
    "work_category",
    "work_description",

    "baseline_risk_score",
    "baseline_risk_band",
    "risk_reasons",

    "over_budget_flag_v2",
    "very_high_utilization_flag",
    "long_completion_flag",
    "long_pending_flag",
    "stale_payment_activity_flag",
    "reconciliation_mismatch_flag",
    "high_vendor_concentration_flag",
    "payment_splitting_signal",
    "many_payment_flag",
    "many_vendor_flag",
]

risk_signal_columns = [
    c
    for c in risk_signal_columns
    if c in work_features.columns
]

risk_signals = work_features[
    risk_signal_columns
].copy()

save_csv(
    risk_signals,
    "risk_signals.csv",
)


# ============================================================
# 25. SUMMARY REPORT
# ============================================================

print("\n" + "=" * 72)
print("PHASE 2 SUMMARY")
print("=" * 72)

print(
    f"\nWork features: "
    f"{len(work_features):,} rows × "
    f"{len(work_features.columns):,} columns"
)

print(
    f"Model features: "
    f"{len(model_features):,} rows × "
    f"{len(model_features.columns):,} columns"
)

print(
    f"Vendor features: "
    f"{len(vendor_features):,}"
)

print(
    f"MP features: "
    f"{len(mp_features):,}"
)

print(
    f"District features: "
    f"{len(district_features):,}"
)

print("\nBaseline risk-band distribution:")

print(
    work_features[
        "baseline_risk_band"
    ]
    .value_counts(
        dropna=False,
    )
    .to_string()
)

print("\nTop risk signals:")

flag_summary = pd.DataFrame({
    "signal": list(risk_columns.keys()),
    "flagged_work_count": [
        int(
            work_features[col]
            .fillna(False)
            .sum()
        )
        for col in risk_columns
    ],
})

flag_summary = flag_summary.sort_values(
    "flagged_work_count",
    ascending=False,
)

print(
    flag_summary.to_string(
        index=False
    )
)

flag_summary.to_csv(
    FEATURE_DIR / "risk_signal_summary.csv",
    index=False,
)


print("\n" + "=" * 72)
print("PHASE 2 COMPLETE")
print("=" * 72)

print(
    "\nIMPORTANT:"
    "\nNo ML model has been trained."
    "\nThe baseline risk score is explainable and rule-based."
    "\nValidate these features before Phase 3 ML."
)