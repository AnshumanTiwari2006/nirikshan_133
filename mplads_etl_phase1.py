"""
MPLADS AI - Phase 1 ETL Pipeline
================================

Purpose
-------
1. Preserve raw MPLADS Excel files.
2. Load the six source datasets.
3. Standardize column names.
4. Parse canonical Work IDs.
5. Dissect Work ID, IDA and constituency fields.
6. Clean dates and monetary columns.
7. Produce data-quality reports.
8. Build the master fact_work table from the UNION of all valid Work IDs.
9. Build fact_payment at transaction grain.
10. Aggregate payment information back to fact_work.
11. Create basic analytical features.
12. Create MP, district and vendor dimensions.
13. Save all processed outputs.

IMPORTANT
---------
This script intentionally does NOT train ML models.
It creates the ETL/data foundation required before feature engineering,
risk scoring, anomaly detection and dashboard development.

Raw source files are never overwritten.
"""

from pathlib import Path
import re
import shutil
import warnings

import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")


# ============================================================
# 1. PROJECT DIRECTORIES
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

DATA_DIR = BASE_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed"
FEATURE_DIR = DATA_DIR / "features"
OUTPUT_DIR = DATA_DIR / "outputs"
QUALITY_DIR = DATA_DIR / "quality_reports"

for folder in [
    DATA_DIR,
    RAW_DIR,
    PROCESSED_DIR,
    FEATURE_DIR,
    OUTPUT_DIR,
    QUALITY_DIR,
]:
    folder.mkdir(parents=True, exist_ok=True)


# ============================================================
# 2. SOURCE FILE NAMES
# ============================================================

SOURCE_FILES = {
    "recommended": "Works Recommended.xlsx",
    "sanctioned": "Works Sanctioned.xlsx",
    "completed": "Works Completed.xlsx",
    "expenditure": "Expenditure on Completed and On-going Works as on Date.xlsx",
    "calamity": "Amount consented for Calamity.xlsx",
    "allocation": "Allocated Limit for Honble MPs.xlsx",
}


# ============================================================
# 3. HELPER FUNCTIONS
# ============================================================

def clean_column_name(col):
    """Convert source column names into simple snake_case names."""

    col = str(col).strip()
    col = col.replace("₹", "rs")
    col = col.replace("'", "")
    col = re.sub(r"[^A-Za-z0-9]+", "_", col)
    col = re.sub(r"_+", "_", col)
    col = col.strip("_")

    return col.lower()


def parse_work_field(value):
    """
    Parse an MPLADS Work field.

    Example:
        WS/ MP620/2024-2025/133166-Construction of buildings...

    Returns:
        work_id
        mp_code
        financial_year
        work_sequence
        work_description
        data_quality_flag
    """

    WORK_ID_PATTERN = re.compile(
        r"WS/\s*(MP\d+)/(\d{4}-\d{4})/(\d+)"
    )

    if pd.isna(value):
        return {
            "work_id": None,
            "mp_code": None,
            "financial_year": None,
            "work_sequence": None,
            "parsed_work_description": None,
            "data_quality_flag": "MISSING_WORK_ID",
        }

    value = str(value).strip()

    match = WORK_ID_PATTERN.search(value)

    if not match:
        return {
            "work_id": None,
            "mp_code": None,
            "financial_year": None,
            "work_sequence": None,
            "parsed_work_description": value,
            "data_quality_flag": "MALFORMED_WORK_ID",
        }

    mp_code = match.group(1)
    financial_year = match.group(2)
    work_sequence = match.group(3)

    work_id = f"WS/{mp_code}/{financial_year}/{work_sequence}"

    remainder = value[match.end():]
    remainder = remainder.lstrip("- ").strip()

    return {
        "work_id": work_id,
        "mp_code": mp_code,
        "financial_year": financial_year,
        "work_sequence": work_sequence,
        "parsed_work_description": remainder,
        "data_quality_flag": "VALID_WORK_ID",
    }


def expand_work_column(df, column="work"):
    """Extract canonical Work ID fields from a Work column."""

    if column not in df.columns:
        raise KeyError(
            f"Column '{column}' was not found. "
            f"Available columns: {df.columns.tolist()}"
        )

    parsed = df[column].apply(parse_work_field)

    parsed_df = pd.DataFrame(
        parsed.tolist(),
        index=df.index,
    )

    return pd.concat([df, parsed_df], axis=1)


def normalize_work_id(value):
    """Normalize a Work ID already present in a source column."""

    if pd.isna(value):
        return None

    value = str(value).strip()

    match = re.search(
        r"WS/\s*(MP\d+)/(\d{4}-\d{4})/(\d+)",
        value,
    )

    if not match:
        return None

    mp_code = match.group(1)
    financial_year = match.group(2)
    work_sequence = match.group(3)

    return f"WS/{mp_code}/{financial_year}/{work_sequence}"


def parse_ida(value):
    """
    Split IDA into district_name and ida_office_title.

    Example:
        GHAZIABAD(DISTRICT MAGISTRAE GHAZIABAD_IDA)
    """

    if pd.isna(value):
        return {
            "district_name": None,
            "ida_office_title": None,
        }

    value = str(value).strip()

    if "(" in value:
        district, office = value.split("(", 1)

        return {
            "district_name": district.strip(),
            "ida_office_title": office.rstrip(")").strip(),
        }

    return {
        "district_name": value,
        "ida_office_title": None,
    }


def parse_constituency(value):
    """
    Split constituency reservation suffix.

    Example:
        FARIDKOT(SC)
    """

    if pd.isna(value):
        return {
            "constituency_clean": None,
            "reservation_type": None,
        }

    value = str(value).strip()

    match = re.match(
        r"^(.*?)\s*\((SC|ST)\)\s*$",
        value,
        flags=re.IGNORECASE,
    )

    if match:
        return {
            "constituency_clean": match.group(1).strip(),
            "reservation_type": match.group(2).upper(),
        }

    return {
        "constituency_clean": value,
        "reservation_type": "GENERAL",
    }


def add_date_features(df, date_column, prefix):
    """Add year/month/quarter features for a date column."""

    if date_column not in df.columns:
        return df

    df[f"{prefix}_year"] = df[date_column].dt.year
    df[f"{prefix}_month"] = df[date_column].dt.month
    df[f"{prefix}_quarter"] = df[date_column].dt.quarter

    return df


def clean_amount_column(df, column):
    """Convert monetary values to numeric."""

    if column not in df.columns:
        return df

    df[column] = (
        df[column]
        .astype(str)
        .str.replace(",", "", regex=False)
        .str.replace("₹", "", regex=False)
        .str.strip()
    )

    df[column] = pd.to_numeric(
        df[column],
        errors="coerce",
    )

    return df


def prepare_work_source(df, source_name):
    """Prepare a work-level source and report duplicate Work IDs."""

    df = df.copy()
    df = df[df["work_id"].notna()].copy()

    duplicate_count = df["work_id"].duplicated().sum()

    print(
        f"{source_name}: "
        f"{len(df):,} rows | "
        f"{df['work_id'].nunique():,} unique Work IDs | "
        f"{duplicate_count:,} duplicate Work IDs"
    )

    return df


def data_quality_report(df, name):
    """Create a basic dataset-level quality summary."""

    report = {
        "dataset": name,
        "rows": len(df),
        "columns": len(df.columns),
        "duplicate_rows": int(df.duplicated().sum()),
        "missing_values": int(df.isna().sum().sum()),
    }

    if "work_id" in df.columns:
        report["valid_work_ids"] = int(
            df["work_id"].notna().sum()
        )

        report["missing_work_ids"] = int(
            df["work_id"].isna().sum()
        )

        report["unique_work_ids"] = int(
            df["work_id"].nunique()
        )

    return report


# ============================================================
# 4. VERIFY RAW FILES
# ============================================================

print("=" * 70)
print("MPLADS AI - PHASE 1 ETL")
print("=" * 70)

missing_files = []

for key, filename in SOURCE_FILES.items():

    source_path = RAW_DIR / filename

    if not source_path.exists():
        missing_files.append(filename)

if missing_files:
    print("\nERROR: The following files are missing from data/raw/:")
    for filename in missing_files:
        print(" -", filename)

    print(
        "\nCopy the original MPLADS Excel files into "
        "data/raw/ and run the script again."
    )

    raise FileNotFoundError(
        "One or more required raw Excel files are missing."
    )

print("\nAll six raw Excel files found.")


# ============================================================
# 5. LOAD RAW EXCEL FILES
# ============================================================

print("\n" + "=" * 70)
print("LOADING RAW DATA")
print("=" * 70)

# The uploaded MPLADS exports have their actual column headers
# on the second Excel row, hence header=1.
recommended_raw = pd.read_excel(
    RAW_DIR / SOURCE_FILES["recommended"],
    header=1,
    engine="calamine",
)

sanctioned_raw = pd.read_excel(
    RAW_DIR / SOURCE_FILES["sanctioned"],
    header=1,
    engine="calamine",
)

completed_raw = pd.read_excel(
    RAW_DIR / SOURCE_FILES["completed"],
    header=1,
    engine="calamine",
)

expenditure_raw = pd.read_excel(
    RAW_DIR / SOURCE_FILES["expenditure"],
    header=1,
    engine="calamine",
)

calamity_raw = pd.read_excel(
    RAW_DIR / SOURCE_FILES["calamity"],
    header=1,
    engine="calamine",
)

allocation_raw = pd.read_excel(
    RAW_DIR / SOURCE_FILES["allocation"],
    header=1,
    engine="calamine",
)

print("Raw files loaded successfully.")


# ============================================================
# 6. STANDARDIZE COLUMN NAMES
# ============================================================

datasets = {
    "recommended": recommended_raw,
    "sanctioned": sanctioned_raw,
    "completed": completed_raw,
    "expenditure": expenditure_raw,
    "calamity": calamity_raw,
    "allocation": allocation_raw,
}

for name, df in datasets.items():
    df.columns = [
        clean_column_name(c)
        for c in df.columns
    ]


# ============================================================
# 7. DISPLAY RAW DATA INVENTORY
# ============================================================

print("\n" + "=" * 70)
print("SOURCE DATA INVENTORY")
print("=" * 70)

for name, df in datasets.items():

    print(
        f"\n{name.upper()}: "
        f"{len(df):,} rows × {len(df.columns)} columns"
    )

    print("Columns:")
    for column in df.columns:
        print("  -", column)


# ============================================================
# 8. SOURCE-SPECIFIC COLUMN RENAMING
# ============================================================

recommended = recommended_raw.rename(columns={
    "work": "work",
    "recommended_amount_rs": "recommended_amount",
    "honble_members_of_parliament": "mp_name",
    "recommended_date": "recommended_date",
    "sanction_date": "sanction_date",
})

sanctioned = sanctioned_raw.rename(columns={
    "honble_members_of_parliament": "mp_name",
    "sanction_amount_rs": "sanction_amount",
    "sanction_date": "sanction_date",
    "work_status": "work_status",
})

completed = completed_raw.rename(columns={
    "work": "work",
    "work_description": "work_description",
    "honble_members_of_parliament": "mp_name",
    "completion_date": "completion_date",
    "amount_disbursed_rs": "completed_amount",
})

expenditure = expenditure_raw.rename(columns={
    "work": "work_description_source",
    "work_id": "work_id",
    "honble_members_of_parliament": "mp_name",
    "expenditure_date": "expenditure_date",
    "vendor_name": "vendor_name",
    "payment_status": "payment_status",
    "fund_disbursed_amount_rs": "fund_disbursed_amount",
})

calamity = calamity_raw.rename(columns={
    "honble_members_of_parliament": "mp_name",
    "consent_amount_rs": "consent_amount",
    "date_of_consent": "consent_date",
})

allocation = allocation_raw.rename(columns={
    "honble_members_of_parliaments": "mp_name",
    "allocated_amount_rs": "allocated_amount",
})


# ============================================================
# 9. PARSE WORK FIELDS
# ============================================================

print("\n" + "=" * 70)
print("PARSING WORK IDs")
print("=" * 70)

recommended = expand_work_column(
    recommended,
    "work",
)

sanctioned = expand_work_column(
    sanctioned,
    "work",
)

completed = expand_work_column(
    completed,
    "work",
)

# Expenditure already contains Work ID.
expenditure["work_id"] = (
    expenditure["work_id"]
    .apply(normalize_work_id)
)

print("Recommended Work IDs parsed.")
print("Sanctioned Work IDs parsed.")
print("Completed Work IDs parsed.")
print("Expenditure Work IDs normalized.")


# ============================================================
# 10. PARSE IDA
# ============================================================

for df in [
    recommended,
    sanctioned,
    completed,
    expenditure,
]:

    if "ida" in df.columns:

        parsed_ida = df["ida"].apply(parse_ida)

        parsed_ida = pd.DataFrame(
            parsed_ida.tolist(),
            index=df.index,
        )

        df[
            [
                "district_name",
                "ida_office_title",
            ]
        ] = parsed_ida


# ============================================================
# 11. PARSE CONSTITUENCY
# ============================================================

for df in [
    recommended,
    sanctioned,
    completed,
    expenditure,
    allocation,
]:

    if "constituency" in df.columns:

        parsed_constituency = (
            df["constituency"]
            .apply(parse_constituency)
        )

        parsed_constituency = pd.DataFrame(
            parsed_constituency.tolist(),
            index=df.index,
        )

        df[
            [
                "constituency_clean",
                "reservation_type",
            ]
        ] = parsed_constituency


# ============================================================
# 12. CLEAN DATES
# ============================================================

DATE_COLUMNS = {
    "recommended": [
        "recommended_date",
        "sanction_date",
    ],
    "sanctioned": [
        "recommended_date",
        "sanction_date",
    ],
    "completed": [
        "completion_date",
    ],
    "expenditure": [
        "expenditure_date",
    ],
    "calamity": [
        "consent_date",
    ],
}

dataset_objects = {
    "recommended": recommended,
    "sanctioned": sanctioned,
    "completed": completed,
    "expenditure": expenditure,
    "calamity": calamity,
}

for name, columns in DATE_COLUMNS.items():

    df = dataset_objects[name]

    for col in columns:

        if col in df.columns:

            df[col] = pd.to_datetime(
                df[col],
                errors="coerce",
                dayfirst=True,
            )

# Add date features.
recommended = add_date_features(
    recommended,
    "recommended_date",
    "recommended",
)

sanctioned = add_date_features(
    sanctioned,
    "sanction_date",
    "sanction",
)

completed = add_date_features(
    completed,
    "completion_date",
    "completion",
)

expenditure = add_date_features(
    expenditure,
    "expenditure_date",
    "expenditure",
)


# ============================================================
# 13. CLEAN AMOUNT COLUMNS
# ============================================================

recommended = clean_amount_column(
    recommended,
    "recommended_amount",
)

sanctioned = clean_amount_column(
    sanctioned,
    "sanction_amount",
)

completed = clean_amount_column(
    completed,
    "completed_amount",
)

expenditure = clean_amount_column(
    expenditure,
    "fund_disbursed_amount",
)

calamity = clean_amount_column(
    calamity,
    "consent_amount",
)

allocation = clean_amount_column(
    allocation,
    "allocated_amount",
)


# ============================================================
# 14. DATA QUALITY REPORT
# ============================================================

print("\n" + "=" * 70)
print("DATA QUALITY REPORT")
print("=" * 70)

reports = []

for name, df in {
    "recommended": recommended,
    "sanctioned": sanctioned,
    "completed": completed,
    "expenditure": expenditure,
}.items():

    reports.append(
        data_quality_report(
            df,
            name,
        )
    )

quality_df = pd.DataFrame(reports)

print(quality_df.to_string(index=False))

quality_df.to_csv(
    QUALITY_DIR / "dataset_quality_report.csv",
    index=False,
)


# ============================================================
# 15. SAVE CLEANED SOURCE TABLES
# ============================================================

recommended.to_csv(
    PROCESSED_DIR / "recommended_clean.csv",
    index=False,
)

sanctioned.to_csv(
    PROCESSED_DIR / "sanctioned_clean.csv",
    index=False,
)

completed.to_csv(
    PROCESSED_DIR / "completed_clean.csv",
    index=False,
)

expenditure.to_csv(
    PROCESSED_DIR / "payment_clean.csv",
    index=False,
)

calamity.to_csv(
    PROCESSED_DIR / "calamity_clean.csv",
    index=False,
)

allocation.to_csv(
    PROCESSED_DIR / "allocation_clean.csv",
    index=False,
)


# ============================================================
# 16. CREATE MASTER WORK ID UNIVERSE
# ============================================================

print("\n" + "=" * 70)
print("BUILDING MASTER WORK UNIVERSE")
print("=" * 70)

work_id_sets = [

    set(
        recommended["work_id"]
        .dropna()
    ),

    set(
        sanctioned["work_id"]
        .dropna()
    ),

    set(
        completed["work_id"]
        .dropna()
    ),

    set(
        expenditure["work_id"]
        .dropna()
    ),
]

all_work_ids = set().union(
    *work_id_sets
)

print(
    f"Total unique Work IDs: "
    f"{len(all_work_ids):,}"
)

fact_work = pd.DataFrame({
    "work_id": sorted(all_work_ids),
})


# ============================================================
# 17. DISSECT CANONICAL WORK ID
# ============================================================

fact_work["mp_code"] = (
    fact_work["work_id"]
    .str.extract(r"(MP\d+)")[0]
)

fact_work["financial_year"] = (
    fact_work["work_id"]
    .str.extract(r"(20\d{2}-20\d{2})")[0]
)

fact_work["work_sequence"] = (
    fact_work["work_id"]
    .str.extract(r"/(\d+)$")[0]
)


# ============================================================
# 18. PREPARE WORK-LEVEL SOURCE TABLES
# ============================================================

recommended_work = prepare_work_source(
    recommended,
    "Recommended",
)

sanctioned_work = prepare_work_source(
    sanctioned,
    "Sanctioned",
)

completed_work = prepare_work_source(
    completed,
    "Completed",
)


# ============================================================
# 19. BUILD RECOMMENDED FACT SOURCE
# ============================================================

recommended_columns = [
    "work_id",
    "work_category",
    "state",
    "ida",
    "district_name",
    "ida_office_title",
    "mp_name",
    "constituency_clean",
    "reservation_type",
    "work_description",
    "recommended_date",
    "recommended_amount",
    "sanction_date",
]

recommended_fact = recommended_work[
    [
        c
        for c in recommended_columns
        if c in recommended_work.columns
    ]
].copy()


# ============================================================
# 20. BUILD SANCTIONED FACT SOURCE
# ============================================================

sanctioned_columns = [
    "work_id",
    "work_category",
    "state",
    "ida",
    "district_name",
    "ida_office_title",
    "mp_name",
    "constituency_clean",
    "reservation_type",
    "work_description",
    "work_status",
    "recommended_date",
    "sanction_amount",
    "sanction_date",
]

sanctioned_fact = sanctioned_work[
    [
        c
        for c in sanctioned_columns
        if c in sanctioned_work.columns
    ]
].copy()


# ============================================================
# 21. BUILD COMPLETED FACT SOURCE
# ============================================================

completed_columns = [
    "work_id",
    "work_category",
    "state",
    "ida",
    "district_name",
    "ida_office_title",
    "work_description",
    "mp_name",
    "constituency_clean",
    "reservation_type",
    "completion_date",
    "completed_amount",
]

completed_fact = completed_work[
    [
        c
        for c in completed_columns
        if c in completed_work.columns
    ]
].copy()


# ============================================================
# 22. JOIN SANCTIONED → FACT_WORK
# ============================================================

fact_work = fact_work.merge(
    sanctioned_fact,
    on="work_id",
    how="left",
)

print(
    "After Sanctioned join:",
    fact_work.shape,
)


# ============================================================
# 23. JOIN RECOMMENDED → FACT_WORK
# ============================================================

fact_work = fact_work.merge(
    recommended_fact,
    on="work_id",
    how="left",
    suffixes=("", "_recommended"),
)

context_fields = [
    "work_category",
    "state",
    "ida",
    "district_name",
    "ida_office_title",
    "mp_name",
    "constituency_clean",
    "reservation_type",
    "work_description",
    "recommended_date",
    "sanction_date",
]

for col in context_fields:
    if col in fact_work.columns and f"{col}_recommended" in fact_work.columns:
        fact_work[col] = fact_work[col].combine_first(fact_work[f"{col}_recommended"])
        fact_work.drop(columns=[f"{col}_recommended"], inplace=True)

print(
    "After Recommended join:",
    fact_work.shape,
)


# ============================================================
# 24. JOIN COMPLETED → FACT_WORK
# ============================================================

fact_work = fact_work.merge(
    completed_fact,
    on="work_id",
    how="left",
    suffixes=("", "_completed"),
)

for col in context_fields:
    if col in fact_work.columns and f"{col}_completed" in fact_work.columns:
        fact_work[col] = fact_work[col].combine_first(fact_work[f"{col}_completed"])
        fact_work.drop(columns=[f"{col}_completed"], inplace=True)

print(
    "After Completed join:",
    fact_work.shape,
)


# ============================================================
# 25. BUILD FACT_PAYMENT
# ============================================================

payment_columns = [
    "work_id",
    "state",
    "ida",
    "district_name",
    "ida_office_title",
    "mp_name",
    "constituency_clean",
    "work_description_source",
    "expenditure_date",
    "vendor_name",
    "payment_status",
    "fund_disbursed_amount",
]

fact_payment = expenditure[
    [
        c
        for c in payment_columns
        if c in expenditure.columns
    ]
].copy()

fact_payment = fact_payment[
    fact_payment["work_id"].notna()
].copy()

fact_payment.reset_index(
    drop=True,
    inplace=True,
)

fact_payment["payment_id"] = (
    "PAY_"
    +
    fact_payment.index.astype(str)
)


# ============================================================
# 26. AGGREGATE PAYMENTS TO WORK LEVEL
# ============================================================

payment_summary = (
    fact_payment
    .groupby("work_id")
    .agg(
        total_expenditure=(
            "fund_disbursed_amount",
            "sum",
        ),

        payment_count=(
            "payment_id",
            "count",
        ),

        vendor_count=(
            "vendor_name",
            "nunique",
        ),

        first_expenditure_date=(
            "expenditure_date",
            "min",
        ),

        last_expenditure_date=(
            "expenditure_date",
            "max",
        ),
    )
    .reset_index()
)


# ============================================================
# 27. ADD PAYMENT SUMMARY TO FACT_WORK
# ============================================================

fact_work = fact_work.merge(
    payment_summary,
    on="work_id",
    how="left",
)


# ============================================================
# 28. BASIC FINANCIAL FEATURES
# ============================================================

fact_work["utilization_rate"] = np.where(

    fact_work["sanction_amount"] > 0,

    (
        fact_work["total_expenditure"]
        /
        fact_work["sanction_amount"]
    ) * 100,

    np.nan,
)

fact_work["cost_overrun_amount"] = (
    fact_work["total_expenditure"]
    -
    fact_work["sanction_amount"]
)

fact_work["cost_overrun_rate"] = np.where(

    fact_work["sanction_amount"] > 0,

    (
        fact_work["cost_overrun_amount"]
        /
        fact_work["sanction_amount"]
    ) * 100,

    np.nan,
)


# ============================================================
# 29. COMPLETION DURATION
# ============================================================

fact_work["completion_days"] = (
    fact_work["completion_date"]
    -
    fact_work["sanction_date"]
).dt.days


# ============================================================
# 30. BASIC FLAGS
# ============================================================

fact_work["over_budget_flag"] = (
    fact_work["total_expenditure"]
    >
    fact_work["sanction_amount"]
)

fact_work["no_expenditure_flag"] = (
    fact_work["total_expenditure"]
    .fillna(0)
    ==
    0
)

fact_work["completed_flag"] = (
    fact_work["completion_date"]
    .notna()
)

fact_work["payment_activity_flag"] = (
    fact_work["payment_count"]
    .fillna(0)
    >
    0
)


# ============================================================
# 31. COMPLETED VS EXPENDITURE RECONCILIATION
# ============================================================

fact_work["completion_vs_expenditure_difference"] = (
    fact_work["total_expenditure"]
    -
    fact_work["completed_amount"]
)


# ============================================================
# 32. DATA QUALITY FLAGS
# ============================================================

fact_work["data_quality_flag"] = "OK"

fact_work.loc[
    fact_work["mp_code"].isna(),
    "data_quality_flag",
] = "INVALID_WORK_ID"

fact_work.loc[
    fact_work["sanction_amount"].isna(),
    "data_quality_flag",
] = "MISSING_SANCTION_DATA"

fact_work.loc[
    fact_work["over_budget_flag"].fillna(False),
    "data_quality_flag",
] = "FINANCIAL_ANOMALY"


# ============================================================
# 33. CONNECTION REPORT
# ============================================================

connection_report = pd.DataFrame({

    "source": [
        "Recommended",
        "Sanctioned",
        "Completed",
        "Expenditure",
    ],

    "rows": [
        len(recommended),
        len(sanctioned),
        len(completed),
        len(expenditure),
    ],

    "unique_work_ids": [
        recommended["work_id"].nunique(),
        sanctioned["work_id"].nunique(),
        completed["work_id"].nunique(),
        expenditure["work_id"].nunique(),
    ],

    "connected_to_fact_work": [

        fact_work["work_id"]
        .isin(
            recommended["work_id"]
        )
        .sum(),

        fact_work["work_id"]
        .isin(
            sanctioned["work_id"]
        )
        .sum(),

        fact_work["work_id"]
        .isin(
            completed["work_id"]
        )
        .sum(),

        fact_work["work_id"]
        .isin(
            expenditure["work_id"]
        )
        .sum(),
    ],
})


# ============================================================
# 34. DIM_MP
# ============================================================

mp_columns = [
    "mp_code",
    "mp_name",
    "constituency_clean",
    "state",
    "reservation_type",
]

dim_mp = (
    fact_work[
        [
            c
            for c in mp_columns
            if c in fact_work.columns
        ]
    ]
    .drop_duplicates(
        subset=["mp_code"]
    )
    .reset_index(drop=True)
)

# Join allocation data
if not allocation.empty and "constituency_clean" in allocation.columns:
    dim_mp = dim_mp.merge(
        allocation[["mp_name", "constituency_clean", "allocated_amount"]].drop_duplicates(subset=["mp_name", "constituency_clean"]),
        on=["mp_name", "constituency_clean"],
        how="left"
    )

# Join calamity data (loose join by mp_name)
if not calamity.empty:
    calamity_grouped = calamity.groupby("mp_name")["consent_amount"].sum().reset_index()
    dim_mp = dim_mp.merge(
        calamity_grouped,
        on="mp_name",
        how="left"
    )


# ============================================================
# 35. DIM_DISTRICT
# ============================================================

district_columns = [
    "state",
    "district_name",
    "ida_office_title",
]

dim_district = (
    fact_work[
        [
            c
            for c in district_columns
            if c in fact_work.columns
        ]
    ]
    .drop_duplicates()
    .reset_index(drop=True)
)

dim_district["district_id"] = (
    "DIST_"
    +
    dim_district.index.astype(str)
)


# ============================================================
# 36. DIM_VENDOR
# ============================================================

dim_vendor = (
    fact_payment[
        ["vendor_name"]
    ]
    .dropna()
    .drop_duplicates()
    .reset_index(drop=True)
)

dim_vendor["vendor_id"] = (
    "VEN_"
    +
    dim_vendor.index.astype(str)
)


# ============================================================
# 37. SAVE MASTER TABLES
# ============================================================

fact_work.to_csv(
    PROCESSED_DIR / "fact_work.csv",
    index=False,
)

fact_payment.to_csv(
    PROCESSED_DIR / "fact_payment.csv",
    index=False,
)

payment_summary.to_csv(
    PROCESSED_DIR / "payment_summary.csv",
    index=False,
)


# ============================================================
# 38. SAVE DIMENSION TABLES
# ============================================================

dim_mp.to_csv(
    PROCESSED_DIR / "dim_mp.csv",
    index=False,
)

dim_district.to_csv(
    PROCESSED_DIR / "dim_district.csv",
    index=False,
)

dim_vendor.to_csv(
    PROCESSED_DIR / "dim_vendor.csv",
    index=False,
)


# ============================================================
# 39. SAVE CONNECTION REPORT
# ============================================================

connection_report.to_csv(
    QUALITY_DIR / "connection_report.csv",
    index=False,
)


# ============================================================
# 40. FINAL SUMMARY
# ============================================================

print("\n" + "=" * 70)
print("ETL COMPLETE")
print("=" * 70)

print(
    f"\nMaster fact_work rows: "
    f"{len(fact_work):,}"
)

print(
    f"Payment transactions: "
    f"{len(fact_payment):,}"
)

print(
    f"MP dimension rows: "
    f"{len(dim_mp):,}"
)

print(
    f"District dimension rows: "
    f"{len(dim_district):,}"
)

print(
    f"Vendor dimension rows: "
    f"{len(dim_vendor):,}"
)

print("\nConnection report:")
print(connection_report.to_string(index=False))

print("\nOutput directory:")
print(PROCESSED_DIR)

print("\nQuality reports:")
print(QUALITY_DIR)

print(
    "\nPhase 1 complete."
    "\nNext phase: feature engineering and anomaly/risk signals."
)
