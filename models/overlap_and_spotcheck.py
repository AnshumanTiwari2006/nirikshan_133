import pandas as pd
import numpy as np

# 1. Load Anomaly Lists
if_completed = pd.read_csv(r"D:\SIH\model_outputs\isolation_forest\completed_anomalies.csv")
if_ongoing = pd.read_csv(r"D:\SIH\model_outputs\isolation_forest\ongoing_anomalies.csv")
if_anomalies = pd.concat([if_completed, if_ongoing])

xgb_anomalies = pd.read_csv(r"D:\SIH\model_outputs\xgboost\top_cost_deviations.csv")

# 2. Overlap Check
if_work_ids = set(if_anomalies['work_id'])
xgb_work_ids = set(xgb_anomalies['work_id'])

overlap_ids = if_work_ids.intersection(xgb_work_ids)

print("="*60)
print("CROSS-MODEL OVERLAP CHECK (Model 1 vs Model 2)")
print("="*60)
print(f"Isolation Forest Total Anomalies: {len(if_work_ids)}")
print(f"XGBoost Total Anomalies (Top 5%): {len(xgb_work_ids)}")
print(f"Overlapping Anomalies: {len(overlap_ids)}")
print(f" - {(len(overlap_ids) / len(if_work_ids)) * 100:.1f}% of Isolation Forest's flags also appear in XGBoost's list.")
print(f" - {(len(overlap_ids) / len(xgb_work_ids)) * 100:.1f}% of XGBoost's flags also appear in Isolation Forest's list.")
print(f"These {len(overlap_ids)} works are high-confidence candidates for Ensemble Model 5.")

# 3. Spot Check 10-15 IF Anomalies
print("\n" + "="*60)
print("MANUAL SPOT CHECK (15 ISOLATION FOREST ANOMALIES)")
print("="*60)
# We need to print some interpretable columns, let's grab work_features to see more details
work_features = pd.read_csv(r"D:\SIH\data\features\work_features.csv")
spot_check_df = if_anomalies.sample(15, random_state=42)

# Merge with work_features to get context like category, sanction_amount, etc
spot_check_full = spot_check_df.merge(work_features, on='work_id', suffixes=('', '_drop'))

cols_to_print = [
    'work_id', 'work_description', 'sanction_amount', 'total_expenditure', 
    'completion_days', 'payment_count', 'vendor_hhi', 'baseline_risk_band'
]

# Ensure we have all these columns
cols_to_print = [c for c in cols_to_print if c in spot_check_full.columns]

for idx, row in spot_check_full.iterrows():
    print(f"\nWork ID: {row['work_id']}")
    print(f"Description: {row.get('work_description', 'N/A')}")
    print(f"Sanction Amt: {row.get('sanction_amount', 'N/A')} | Expended: {row.get('total_expenditure', 'N/A')}")
    print(f"Completion Days: {row.get('completion_days', 'N/A')} | Payments: {row.get('payment_count', 'N/A')}")
    print(f"Vendor HHI: {row.get('vendor_hhi', 'N/A')} | Baseline: {row.get('baseline_risk_band', 'N/A')}")

