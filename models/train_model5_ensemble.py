# import pandas as pd
# import numpy as np
# import os
# import warnings

# warnings.filterwarnings('ignore')

# # 1. Setup Directories
# BASE_DIR = r"D:\SIH"
# OUTPUT_DIR = os.path.join(BASE_DIR, "model_outputs", "ensemble")
# os.makedirs(OUTPUT_DIR, exist_ok=True)

# print("="*70)
# print("MODEL 5: FINAL RISK ENSEMBLE")
# print("="*70)

# # Configuration: Ensemble Weights
# WEIGHTS = {
#     'baseline_risk_score_norm': 0.25,
#     'isolation_forest_score_norm': 0.30,
#     'cost_deviation_score_norm': 0.25,
#     'duplicate_flag_score': 0.10,
#     'vendor_network_score_norm': 0.10,
# }

# print("Using transparent weights for the ensemble:")
# for k, v in WEIGHTS.items():
#     print(f"  - {k}: {v:.2f}")

# # 2. Load Inputs
# print("\nLoading component data...")
# # Fact Work
# fact_work = pd.read_csv(os.path.join(BASE_DIR, "data", "processed", "fact_work.csv"))
# # Keep only essential columns to start the base table
# cols = ['work_id', 'mp_code', 'district_name', 'state', 'sanction_amount']
# if 'parsed_work_description' in fact_work.columns:
#     cols.append('parsed_work_description')
# else:
#     cols.append('work_description')
# base_df = fact_work[cols].copy()
# base_df = base_df.rename(columns={'parsed_work_description': 'work_description', 'work_description': 'work_description'})

# # Baseline Risk
# risk_signals = pd.read_csv(os.path.join(BASE_DIR, "data", "features", "risk_signals.csv"))
# base_df = base_df.merge(risk_signals[['work_id', 'baseline_risk_score']], on='work_id', how='left')

# # Isolation Forest
# if_comp = pd.read_csv(os.path.join(BASE_DIR, "model_outputs", "isolation_forest", "completed_anomalies.csv"))
# if_ongo = pd.read_csv(os.path.join(BASE_DIR, "model_outputs", "isolation_forest", "ongoing_anomalies.csv"))
# if_df = pd.concat([if_comp, if_ongo])
# base_df = base_df.merge(if_df[['work_id', 'anomaly_score', 'is_anomaly']], on='work_id', how='left')
# base_df['is_anomaly'] = base_df['is_anomaly'].fillna(False)

# # XGBoost Cost Deviations
# cost_dev = pd.read_csv(os.path.join(BASE_DIR, "model_outputs", "xgboost", "cost_deviations.csv"))
# base_df = base_df.merge(cost_dev[['work_id', 'cost_deviation_pct']], on='work_id', how='left')
# base_df['cost_deviation_pct'] = base_df['cost_deviation_pct'].fillna(0)

# # Duplicate Clusters
# dup_clusters = pd.read_csv(os.path.join(BASE_DIR, "model_outputs", "duplicate_detection", "fact_duplicate_clusters.csv"))
# # Explode work_ids
# dup_exploded = []
# for _, row in dup_clusters.iterrows():
#     wids = str(row['work_ids']).split(';')
#     for wid in wids:
#         dup_exploded.append({
#             'work_id': wid,
#             'cluster_size': row['cluster_size'],
#             'duplicate_funding_candidate': row.get('duplicate_funding_candidate', False),
#             'bulk_procurement_pattern': row.get('bulk_procurement_pattern', False)
#         })
# dup_df = pd.DataFrame(dup_exploded)
# if not dup_df.empty:
#     base_df = base_df.merge(dup_df, on='work_id', how='left')
# else:
#     base_df['cluster_size'] = np.nan
#     base_df['duplicate_funding_candidate'] = False
#     base_df['bulk_procurement_pattern'] = False

# base_df['duplicate_funding_candidate'] = base_df['duplicate_funding_candidate'].fillna(False)

# # Vendor Network Flags
# fact_payment = pd.read_csv(os.path.join(BASE_DIR, "data", "processed", "fact_payment.csv"))
# vendor_flags = pd.read_csv(os.path.join(BASE_DIR, "model_outputs", "graph_analytics", "vendor_network_flags.csv"))
# # Normalize names again to match
# import re
# def normalize_vendor_name(name):
#     if pd.isna(name): return 'UNKNOWN'
#     name = str(name).upper().strip()
#     suffixes = [r'\bPVT\b', r'\bLTD\b', r'\bPRIVATE\b', r'\bLIMITED\b', r'\bCONTRACTORS\b', r'\bCONTRACTOR\b', r'\bCO\b', r'\bINC\b', r'\bLLC\b', r'\bENTERPRISES\b', r'\bENTERPRISE\b', r'\bBUILDCON\b', r'\bAND\b', r'\b&\b', r'\.', r',']
#     for s in suffixes: name = re.sub(s, '', name)
#     name = re.sub(r'\s+', ' ', name).strip()
#     return name if name else 'UNKNOWN'

# fact_payment['vendor_name_clean'] = fact_payment['vendor_name'].apply(normalize_vendor_name)
# payment_vendor = fact_payment[['work_id', 'vendor_name_clean']].drop_duplicates()
# payment_vendor = payment_vendor.merge(vendor_flags[['vendor_name_clean', 'high_concentration_flag']], on='vendor_name_clean', how='left')
# payment_vendor['high_concentration_flag'] = payment_vendor['high_concentration_flag'].fillna(False)
# # If a work has multiple vendors, take max flag (True)
# work_vendor_flag = payment_vendor.groupby('work_id', as_index=False)['high_concentration_flag'].max()

# base_df = base_df.merge(work_vendor_flag, on='work_id', how='left')
# base_df['high_concentration_flag'] = base_df['high_concentration_flag'].fillna(False)

# # 3. Normalization (0-100 Scale)
# print("\nNormalizing component scores...")

# # Baseline
# base_df['baseline_risk_score_norm'] = base_df['baseline_risk_score'].fillna(0) # It's already 0-100

# # Isolation Forest
# # Lower score (negative) means MORE anomalous. So we invert it.
# if_min = base_df['anomaly_score'].min()
# if_max = base_df['anomaly_score'].max()
# if pd.notna(if_min) and if_max != if_min:
#     # 100 for min (most anomalous), 0 for max (least anomalous)
#     base_df['isolation_forest_score_norm'] = ((if_max - base_df['anomaly_score']) / (if_max - if_min)) * 100
# else:
#     base_df['isolation_forest_score_norm'] = 0
# base_df['isolation_forest_score_norm'] = base_df['isolation_forest_score_norm'].fillna(0)

# # Cost Deviation
# cd_p99 = base_df['cost_deviation_pct'].quantile(0.99)
# cd_min = base_df['cost_deviation_pct'].min()
# # Cap at 99th percentile so outliers don't squash the scale
# cd_capped = base_df['cost_deviation_pct'].clip(upper=cd_p99)
# if cd_p99 > cd_min:
#     base_df['cost_deviation_score_norm'] = ((cd_capped - cd_min) / (cd_p99 - cd_min)) * 100
# else:
#     base_df['cost_deviation_score_norm'] = 0

# # Duplicate Flag
# base_df['duplicate_flag_score'] = base_df['duplicate_funding_candidate'].astype(float) * 100

# # Vendor Network Flag (simply using concentration flag as binary 0/100, can expand to total flags later)
# base_df['vendor_network_score_norm'] = base_df['high_concentration_flag'].astype(float) * 100

# # 4. Ensemble Scoring
# base_df['final_risk_score'] = (
#     WEIGHTS['baseline_risk_score_norm'] * base_df['baseline_risk_score_norm'] +
#     WEIGHTS['isolation_forest_score_norm'] * base_df['isolation_forest_score_norm'] +
#     WEIGHTS['cost_deviation_score_norm'] * base_df['cost_deviation_score_norm'] +
#     WEIGHTS['duplicate_flag_score'] * base_df['duplicate_flag_score'] +
#     WEIGHTS['vendor_network_score_norm'] * base_df['vendor_network_score_norm']
# )

# # 5. Risk Bands
# def assign_band(score):
#     if score >= 70: return 'HIGH'
#     if score >= 40: return 'MEDIUM'
#     return 'LOW'

# base_df['risk_band'] = base_df['final_risk_score'].apply(assign_band)

# # 6. Evidence String Generator
# def build_evidence_string(row):
#     reasons = []
#     if row.get('cost_deviation_pct', 0) > 100:
#         reasons.append(f"Cost {row['cost_deviation_pct']:.0f}% above peer-predicted amount")
#     if row.get('is_anomaly', False):
#         reasons.append("Flagged as a statistical outlier across combined lifecycle/payment behavior")
#     if row.get('duplicate_funding_candidate', False):
#         reasons.append(f"Near-identical work found in same district (cluster of {row['cluster_size']})")
#     if row.get('high_concentration_flag', False):
#         reasons.append("Vendor payment concentration unusually high")
        
#     if not reasons:
#         return "No significant risk signals detected"
#     return "; ".join(reasons)

# print("Generating evidence strings...")
# base_df['evidence_string'] = base_df.apply(build_evidence_string, axis=1)

# # 7. Final Outputs
# out_cols = [
#     'work_id', 'mp_code', 'district_name', 'state', 'work_description', 'sanction_amount',
#     'final_risk_score', 'risk_band', 'evidence_string',
#     'baseline_risk_score_norm', 'isolation_forest_score_norm', 
#     'cost_deviation_score_norm', 'duplicate_flag_score', 'vendor_network_score_norm'
# ]
# final_df = base_df[out_cols].sort_values('final_risk_score', ascending=False)

# output_file = os.path.join(OUTPUT_DIR, "fact_work_risk.csv")
# final_df.to_csv(output_file, index=False)
# print(f"\nSaved 77,628 ensemble risk records to {output_file}")

# # 8. Cross-Checks
# print("\n--- FINAL RISK BAND DISTRIBUTION ---")
# print(final_df['risk_band'].value_counts())

# print("\n--- SPOT CHECK (TOP 10 HIGH RISK) ---")
# for idx, row in final_df.head(10).iterrows():
#     print(f"[{row['final_risk_score']:.1f}] {row['work_id']} - {row['evidence_string']}")

# print("\nModel 5 script execution complete.")



















import pandas as pd
import numpy as np
import os
import re
import warnings
from pathlib import Path

warnings.filterwarnings('ignore')

# 1. Setup Directories
BASE_DIR = Path(__file__).resolve().parent.parent
OUTPUT_DIR = BASE_DIR / "model_outputs" / "ensemble"
os.makedirs(OUTPUT_DIR, exist_ok=True)

print("="*70)
print("MODEL 5: FINAL RISK ENSEMBLE (FIXED)")
print("="*70)

# Configuration: Ensemble Weights
# NOTE: cluster_outlier_score is new — small weight carved out of
# duplicate_flag_score so the total still sums to 1.0
WEIGHTS = {
    'baseline_risk_score_norm': 0.25,
    'isolation_forest_score_norm': 0.30,
    'cost_deviation_score_norm': 0.25,
    'duplicate_flag_score': 0.07,
    'cluster_outlier_score': 0.03,
    'vendor_network_score_norm': 0.10,
}
assert abs(sum(WEIGHTS.values()) - 1.0) < 1e-6, "Weights must sum to 1.0"

print("Using transparent weights for the ensemble:")
for k, v in WEIGHTS.items():
    print(f"  - {k}: {v:.2f}")

# ---------------------------------------------------------------------
# 2. Load base work table
# ---------------------------------------------------------------------
print("\nLoading component data...")
fact_work = pd.read_csv(BASE_DIR / "data" / "processed" / "fact_work.csv")

cols = ['work_id', 'mp_code', 'district_name', 'state', 'sanction_amount']
desc_col = 'parsed_work_description' if 'parsed_work_description' in fact_work.columns else 'work_description'
cols.append(desc_col)
base_df = fact_work[cols].copy()
base_df = base_df.rename(columns={desc_col: 'work_description'})

print(f"Base work universe: {len(base_df)} rows")

# ---------------------------------------------------------------------
# 3. Baseline risk
# ---------------------------------------------------------------------
risk_signals = pd.read_csv(BASE_DIR / "data" / "features" / "risk_signals.csv")
base_df = base_df.merge(risk_signals[['work_id', 'baseline_risk_score']], on='work_id', how='left')
base_df['baseline_risk_score'] = base_df['baseline_risk_score'].fillna(0)

# ---------------------------------------------------------------------
# 4. Isolation Forest — FIX for Bug 2: use the ALL-SCORES files (every
#    work gets a real score), not just the flagged-only anomaly files.
#    Falls back to the flagged-only files with a warning if the patched
#    all-scores files don't exist yet.
# ---------------------------------------------------------------------
if_dir = BASE_DIR / "model_outputs" / "isolation_forest"
comp_all_path = if_dir / "completed_all_scores.csv"
ongo_all_path = if_dir / "ongoing_all_scores.csv"

if os.path.exists(comp_all_path) and os.path.exists(ongo_all_path):
    if_comp = pd.read_csv(comp_all_path)
    if_ongo = pd.read_csv(ongo_all_path)
    if_df = pd.concat([if_comp, if_ongo])
    print(f"Loaded full-population Isolation Forest scores: {len(if_df)} rows")
else:
    print("WARNING: *_all_scores.csv not found — falling back to flagged-only files.")
    print("         Re-run the patched train_isolation_forest.py to fix this properly.")
    if_comp = pd.read_csv(os.path.join(if_dir, "completed_anomalies.csv"))
    if_ongo = pd.read_csv(os.path.join(if_dir, "ongoing_anomalies.csv"))
    if_df = pd.concat([if_comp, if_ongo])

base_df = base_df.merge(if_df[['work_id', 'anomaly_score', 'is_anomaly']], on='work_id', how='left')
base_df['is_anomaly'] = base_df['is_anomaly'].fillna(False)
# Works with NO score at all (shouldn't happen if all_scores files are complete,
# but guard anyway) get the least-anomalous value, i.e. "normal"
base_df['anomaly_score'] = base_df['anomaly_score'].fillna(base_df['anomaly_score'].max())

missing_if = base_df['anomaly_score'].isna().sum()
print(f"Works missing an Isolation Forest score after merge: {missing_if}")

# ---------------------------------------------------------------------
# 5. XGBoost cost deviation
# ---------------------------------------------------------------------
cost_dev = pd.read_csv(BASE_DIR / "model_outputs" / "xgboost" / "cost_deviations.csv")
base_df = base_df.merge(cost_dev[['work_id', 'cost_deviation_pct']], on='work_id', how='left')
base_df['cost_deviation_pct'] = base_df['cost_deviation_pct'].fillna(0)

# ---------------------------------------------------------------------
# 6. Duplicate clusters (exploded to work-level)
# ---------------------------------------------------------------------
dup_clusters = pd.read_csv(BASE_DIR / "model_outputs" / "duplicate_detection" / "fact_duplicate_clusters.csv")
dup_exploded = []
for _, row in dup_clusters.iterrows():
    wids = str(row['work_ids']).split(';')
    for wid in wids:
        dup_exploded.append({
            'work_id': wid,
            'cluster_size': row['cluster_size'],
            'duplicate_funding_candidate': row.get('duplicate_funding_candidate', False),
            'bulk_procurement_pattern': row.get('bulk_procurement_pattern', False)
        })
dup_df = pd.DataFrame(dup_exploded)
if not dup_df.empty:
    base_df = base_df.merge(dup_df, on='work_id', how='left')
else:
    base_df['cluster_size'] = np.nan
    base_df['duplicate_funding_candidate'] = False
    base_df['bulk_procurement_pattern'] = False
base_df['duplicate_funding_candidate'] = base_df['duplicate_funding_candidate'].fillna(False)

# ---------------------------------------------------------------------
# 7. NEW — Cluster outliers (Bug 3 fix): previously computed but never
#    loaded into the ensemble at all.
# ---------------------------------------------------------------------
outliers_path = BASE_DIR / "model_outputs" / "duplicate_detection" / "cluster_outliers.csv"
cluster_outliers = pd.read_csv(outliers_path)
if not cluster_outliers.empty:
    base_df = base_df.merge(
        cluster_outliers[['work_id', 'z_score']].rename(columns={'z_score': 'cluster_outlier_z'}),
        on='work_id', how='left'
    )
else:
    base_df['cluster_outlier_z'] = np.nan
base_df['is_cluster_outlier'] = base_df['cluster_outlier_z'].notna()
print(f"Cluster-outlier works loaded: {base_df['is_cluster_outlier'].sum()}")

# ---------------------------------------------------------------------
# 8. Vendor network — FIX for Bug 3: use ALL THREE flags, not just
#    high_concentration_flag.
# ---------------------------------------------------------------------
def normalize_vendor_name(name):
    if pd.isna(name):
        return 'UNKNOWN'
    name = str(name).upper().strip()
    suffixes = [
        r'\bPVT\b', r'\bLTD\b', r'\bPRIVATE\b', r'\bLIMITED\b',
        r'\bCONTRACTORS\b', r'\bCONTRACTOR\b', r'\bCO\b', r'\bINC\b',
        r'\bLLC\b', r'\bENTERPRISES\b', r'\bENTERPRISE\b', r'\bBUILDCON\b',
        r'\bAND\b', r'\b&\b', r'\.', r','
    ]
    for s in suffixes:
        name = re.sub(s, '', name)
    name = re.sub(r'\s+', ' ', name).strip()
    return name if name else 'UNKNOWN'

fact_payment = pd.read_csv(BASE_DIR / "data" / "processed" / "fact_payment.csv")
vendor_flags = pd.read_csv(BASE_DIR / "model_outputs" / "graph_analytics" / "vendor_network_flags.csv")

fact_payment['vendor_name_clean'] = fact_payment['vendor_name'].apply(normalize_vendor_name)
payment_vendor = fact_payment[['work_id', 'vendor_name_clean']].drop_duplicates()

vendor_flags['vendor_total_flags'] = (
    vendor_flags['high_reach_flag'].astype(int) +
    vendor_flags['high_concentration_flag'].astype(int) +
    vendor_flags['bridge_flag'].astype(int)
)

payment_vendor = payment_vendor.merge(
    vendor_flags[['vendor_name_clean', 'vendor_total_flags', 'high_concentration_flag']],
    on='vendor_name_clean', how='left'
)
payment_vendor['vendor_total_flags'] = payment_vendor['vendor_total_flags'].fillna(0)
payment_vendor['high_concentration_flag'] = payment_vendor['high_concentration_flag'].fillna(False)

# If a work has multiple vendors, take the MAX flag count across them
work_vendor_flag = payment_vendor.groupby('work_id', as_index=False).agg(
    vendor_total_flags=('vendor_total_flags', 'max'),
    high_concentration_flag=('high_concentration_flag', 'max')
)

base_df = base_df.merge(work_vendor_flag, on='work_id', how='left')
base_df['vendor_total_flags'] = base_df['vendor_total_flags'].fillna(0)
base_df['high_concentration_flag'] = base_df['high_concentration_flag'].fillna(False)

# ---------------------------------------------------------------------
# 9. Normalization (0-100 scale)
# ---------------------------------------------------------------------
print("\nNormalizing component scores...")

# Baseline — already 0-100
base_df['baseline_risk_score_norm'] = base_df['baseline_risk_score']

# Isolation Forest — lower (more negative) score = more anomalous, so invert
if_min = base_df['anomaly_score'].min()
if_max = base_df['anomaly_score'].max()
if pd.notna(if_min) and if_max != if_min:
    base_df['isolation_forest_score_norm'] = ((if_max - base_df['anomaly_score']) / (if_max - if_min)) * 100
else:
    base_df['isolation_forest_score_norm'] = 0
base_df['isolation_forest_score_norm'] = base_df['isolation_forest_score_norm'].fillna(0)

# Cost Deviation — FIX for Bug 1: floor at 0. A work that came in UNDER
# budget (negative deviation) is not risky and must not inherit a nonzero
# "risk floor" purely from the scale's negative minimum.
cd_p99 = base_df['cost_deviation_pct'].quantile(0.99)
cd_capped = base_df['cost_deviation_pct'].clip(lower=0, upper=cd_p99)
base_df['cost_deviation_score_norm'] = (cd_capped / cd_p99) * 100 if cd_p99 > 0 else 0

# Duplicate flag — binary
base_df['duplicate_flag_score'] = base_df['duplicate_funding_candidate'].astype(float) * 100

# Cluster outlier — binary (NEW)
base_df['cluster_outlier_score'] = base_df['is_cluster_outlier'].astype(float) * 100

# Vendor network — FIX for Bug 3: proportion of the 3 possible flags triggered,
# not just the single concentration flag
base_df['vendor_network_score_norm'] = (base_df['vendor_total_flags'] / 3.0) * 100

# ---------------------------------------------------------------------
# 10. Ensemble scoring
# ---------------------------------------------------------------------
base_df['final_risk_score'] = sum(
    WEIGHTS[k] * base_df[k] for k in WEIGHTS
)

# ---------------------------------------------------------------------
# 11. Risk bands
# ---------------------------------------------------------------------
def assign_band(score):
    if score >= 70: return 'HIGH'
    if score >= 40: return 'MEDIUM'
    return 'LOW'

base_df['risk_band'] = base_df['final_risk_score'].apply(assign_band)

# ---------------------------------------------------------------------
# 12. Evidence string generator (now includes cluster outlier + full vendor flags)
# ---------------------------------------------------------------------
def build_evidence_string(row):
    reasons = []
    if row.get('cost_deviation_pct', 0) > 100:
        reasons.append(f"Cost {row['cost_deviation_pct']:.0f}% above peer-predicted amount")
    if row.get('is_anomaly', False):
        reasons.append("Flagged as a statistical outlier across combined lifecycle/payment behavior")
    if row.get('duplicate_funding_candidate', False):
        reasons.append(f"Near-identical work found in same district (cluster of {row['cluster_size']})")
    if row.get('is_cluster_outlier', False):
        reasons.append(f"Cost is an outlier within its own bulk-procurement group (z={row['cluster_outlier_z']:.1f})")
    if row.get('vendor_total_flags', 0) >= 2:
        reasons.append("Vendor shows multiple unusual network patterns (reach/concentration/bridging)")
    elif row.get('high_concentration_flag', False):
        reasons.append("Vendor payment concentration unusually high")

    if not reasons:
        return "No significant risk signals detected"
    return "; ".join(reasons)

print("Generating evidence strings...")
base_df['evidence_string'] = base_df.apply(build_evidence_string, axis=1)

# ---------------------------------------------------------------------
# 13. Final output
# ---------------------------------------------------------------------
out_cols = [
    'work_id', 'mp_code', 'district_name', 'state', 'work_description', 'sanction_amount',
    'final_risk_score', 'risk_band', 'evidence_string',
    'baseline_risk_score_norm', 'isolation_forest_score_norm',
    'cost_deviation_score_norm', 'duplicate_flag_score', 'cluster_outlier_score',
    'vendor_network_score_norm'
]
final_df = base_df[out_cols].sort_values('final_risk_score', ascending=False)

output_file = os.path.join(OUTPUT_DIR, "fact_work_risk.csv")
final_df.to_csv(output_file, index=False)
print(f"\nSaved {len(final_df)} ensemble risk records to {output_file}")

# ---------------------------------------------------------------------
# 14. Cross-checks (NEW — was missing entirely before)
# ---------------------------------------------------------------------
print("\n--- FINAL RISK BAND DISTRIBUTION ---")
print(final_df['risk_band'].value_counts())
print(f"\nHIGH + MEDIUM as % of total: {(final_df['risk_band'] != 'LOW').mean()*100:.2f}%")

print("\n--- FINAL SCORE DISTRIBUTION ---")
print(final_df['final_risk_score'].describe())

corr = final_df['final_risk_score'].corr(final_df['baseline_risk_score_norm'])
print(f"\nCorrelation between final_risk_score and baseline_risk_score_norm: {corr:.3f}")
if corr > 0.9:
    print(" -> WARNING: Ensemble is barely different from the baseline. The new")
    print("    signals (Isolation Forest, cost deviation, duplicates, vendor network)")
    print("    may not be adding independent value — revisit weights.")
else:
    print(" -> Ensemble appears to be meaningfully incorporating the new signals.")

print("\n--- SPOT CHECK (TOP 10 HIGH RISK) ---")
for idx, row in final_df.head(10).iterrows():
    print(f"[{row['final_risk_score']:.1f}] {row['work_id']} - {row['evidence_string']}")

print("\nModel 5 script execution complete.")