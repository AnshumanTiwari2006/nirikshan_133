import pandas as pd
import numpy as np
import os
import sys
import warnings

warnings.filterwarnings('ignore')

sys.path.append(r"D:\SIH")
from common_utils import normalize_vendor_name

# 1. Setup Directories
BASE_DIR = r"D:\SIH"
OUTPUT_DIR = os.path.join(BASE_DIR, "model_outputs", "ensemble")
os.makedirs(OUTPUT_DIR, exist_ok=True)

print("="*70)
print("MODEL 5: FINAL RISK ENSEMBLE (FIXED)")
print("="*70)

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
# 2. Base work table
# ---------------------------------------------------------------------
print("\nLoading component data...")
fact_work = pd.read_csv(os.path.join(BASE_DIR, "data", "processed", "fact_work.csv"))

cols = ['work_id', 'mp_code', 'district_name', 'state', 'sanction_amount']
desc_col = 'parsed_work_description' if 'parsed_work_description' in fact_work.columns else 'work_description'
cols.append(desc_col)
base_df = fact_work[cols].copy().rename(columns={desc_col: 'work_description'})
print(f"Base work universe: {len(base_df)} rows")

# ---------------------------------------------------------------------
# 3. Baseline risk
# ---------------------------------------------------------------------
risk_signals = pd.read_csv(os.path.join(BASE_DIR, "data", "features", "risk_signals.csv"))
base_df = base_df.merge(risk_signals[['work_id', 'baseline_risk_score']], on='work_id', how='left')
base_df['baseline_risk_score'] = base_df['baseline_risk_score'].fillna(0)

# ---------------------------------------------------------------------
# 4. Isolation Forest — full-population scores (requires the patched
#    train_isolation_forest.py to have been RE-RUN so *_all_scores.csv
#    actually exist; falls back with a loud warning otherwise)
# ---------------------------------------------------------------------
if_dir = os.path.join(BASE_DIR, "model_outputs", "isolation_forest")
comp_all_path = os.path.join(if_dir, "completed_all_scores.csv")
ongo_all_path = os.path.join(if_dir, "ongoing_all_scores.csv")

if os.path.exists(comp_all_path) and os.path.exists(ongo_all_path):
    if_df = pd.concat([pd.read_csv(comp_all_path), pd.read_csv(ongo_all_path)])
    print(f"Loaded full-population Isolation Forest scores: {len(if_df)} rows")
else:
    print("!" * 70)
    print("WARNING: *_all_scores.csv NOT FOUND.")
    print("You must re-run the patched train_isolation_forest.py BEFORE this")
    print("script, or the ensemble will silently fall back to flagged-only")
    print("scores and under-represent 95% of works.")
    print("!" * 70)
    if_df = pd.concat([
        pd.read_csv(os.path.join(if_dir, "completed_anomalies.csv")),
        pd.read_csv(os.path.join(if_dir, "ongoing_anomalies.csv"))
    ])

base_df = base_df.merge(if_df[['work_id', 'anomaly_score', 'is_anomaly']], on='work_id', how='left')
base_df['is_anomaly'] = base_df['is_anomaly'].fillna(False)
base_df['anomaly_score'] = base_df['anomaly_score'].fillna(base_df['anomaly_score'].max())
print(f"Works missing an Isolation Forest score after merge: {base_df['anomaly_score'].isna().sum()}")

# ---------------------------------------------------------------------
# 5. XGBoost cost deviation — now using the SIGNED column
# ---------------------------------------------------------------------
cost_dev = pd.read_csv(os.path.join(BASE_DIR, "model_outputs", "xgboost", "cost_deviations.csv"))
base_df = base_df.merge(
    cost_dev[['work_id', 'cost_deviation_pct_signed', 'cost_deviation_pct_abs']],
    on='work_id', how='left'
)
base_df['cost_deviation_pct_signed'] = base_df['cost_deviation_pct_signed'].fillna(0)
base_df['cost_deviation_pct_abs'] = base_df['cost_deviation_pct_abs'].fillna(0)

# ---------------------------------------------------------------------
# 6. Duplicate clusters (exploded to work-level)
# ---------------------------------------------------------------------
dup_clusters = pd.read_csv(os.path.join(BASE_DIR, "model_outputs", "duplicate_detection", "fact_duplicate_clusters.csv"))
dup_exploded = []
for _, row in dup_clusters.iterrows():
    for wid in str(row['work_ids']).split(';'):
        dup_exploded.append({
            'work_id': wid,
            'cluster_size': row['cluster_size'],
            'duplicate_funding_candidate': row.get('duplicate_funding_candidate', False),
        })
dup_df = pd.DataFrame(dup_exploded)
if not dup_df.empty:
    base_df = base_df.merge(dup_df, on='work_id', how='left')
else:
    base_df['cluster_size'] = np.nan
    base_df['duplicate_funding_candidate'] = False
base_df['duplicate_funding_candidate'] = base_df['duplicate_funding_candidate'].fillna(False)

# ---------------------------------------------------------------------
# 7. Cluster outliers
# ---------------------------------------------------------------------
outliers_path = os.path.join(BASE_DIR, "model_outputs", "duplicate_detection", "cluster_outliers.csv")
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
# 8. Vendor network — all 3 flags, using the SHARED normalize function
# ---------------------------------------------------------------------
fact_payment = pd.read_csv(os.path.join(BASE_DIR, "data", "processed", "fact_payment.csv"))
vendor_flags = pd.read_csv(os.path.join(BASE_DIR, "model_outputs", "graph_analytics", "vendor_network_flags.csv"))

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

base_df['baseline_risk_score_norm'] = base_df['baseline_risk_score']

if_min, if_max = base_df['anomaly_score'].min(), base_df['anomaly_score'].max()
if pd.notna(if_min) and if_max != if_min:
    base_df['isolation_forest_score_norm'] = ((if_max - base_df['anomaly_score']) / (if_max - if_min)) * 100
else:
    base_df['isolation_forest_score_norm'] = 0
base_df['isolation_forest_score_norm'] = base_df['isolation_forest_score_norm'].fillna(0)

# Cost deviation — only positive (over-cost) deviations count as risk.
# Uses the signed column now, clipped at 0 on the low end, so a work
# that came in UNDER budget correctly scores 0 risk here, not a
# nonzero "floor" value.
cd_p99 = base_df['cost_deviation_pct_signed'].clip(lower=0).quantile(0.99)
cd_capped = base_df['cost_deviation_pct_signed'].clip(lower=0, upper=cd_p99)
base_df['cost_deviation_score_norm'] = (cd_capped / cd_p99) * 100 if cd_p99 > 0 else 0

base_df['duplicate_flag_score'] = base_df['duplicate_funding_candidate'].astype(float) * 100
base_df['cluster_outlier_score'] = base_df['is_cluster_outlier'].astype(float) * 100
base_df['vendor_network_score_norm'] = (base_df['vendor_total_flags'] / 3.0) * 100

# ---------------------------------------------------------------------
# 10. Ensemble scoring
# ---------------------------------------------------------------------
base_df['final_risk_score'] = sum(WEIGHTS[k] * base_df[k] for k in WEIGHTS)

# ---------------------------------------------------------------------
# 11. Risk bands — PERCENTILE-BASED, not fixed absolute cutoffs.
# Fixed cutoffs (e.g. >=70) are brittle on a weighted-sum score: hitting
# 70 requires several components to be high simultaneously for the same
# work, which is naturally rare and can produce an empty HIGH band. A
# percentile cutoff self-calibrates to a stable, dashboard-sized review
# queue regardless of how the underlying score distribution shifts as
# weights are tuned.
# ---------------------------------------------------------------------
high_cutoff = base_df['final_risk_score'].quantile(0.98)    # top 2%
medium_cutoff = base_df['final_risk_score'].quantile(0.90)  # next 8%

def assign_band(score):
    if score >= high_cutoff:
        return 'HIGH'
    if score >= medium_cutoff:
        return 'MEDIUM'
    return 'LOW'

base_df['risk_band'] = base_df['final_risk_score'].apply(assign_band)
print(f"\nPercentile-based cutoffs — HIGH >= {high_cutoff:.2f}, MEDIUM >= {medium_cutoff:.2f}")

# ---------------------------------------------------------------------
# 12. Evidence string — now correctly direction-aware
# ---------------------------------------------------------------------
def build_evidence_string(row):
    reasons = []
    if row.get('cost_deviation_pct_signed', 0) > 100:
        reasons.append(f"Cost {row['cost_deviation_pct_signed']:.0f}% above peer-predicted amount")
    elif row.get('cost_deviation_pct_signed', 0) < -50:
        # Informational only — not weighted as risk, but useful context
        reasons.append(f"Cost {abs(row['cost_deviation_pct_signed']):.0f}% below peer-predicted amount (informational)")
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
# 14. Cross-checks
# ---------------------------------------------------------------------
print("\n--- FINAL RISK BAND DISTRIBUTION ---")
print(final_df['risk_band'].value_counts())
print(f"\nHIGH + MEDIUM as % of total: {(final_df['risk_band'] != 'LOW').mean()*100:.2f}%")

print("\n--- FINAL SCORE DISTRIBUTION ---")
print(final_df['final_risk_score'].describe())

corr = final_df['final_risk_score'].corr(final_df['baseline_risk_score_norm'])
print(f"\nCorrelation between final_risk_score and baseline_risk_score_norm: {corr:.3f}")
if corr > 0.9:
    print(" -> WARNING: Ensemble is barely different from the baseline. Revisit weights.")
else:
    print(" -> Ensemble appears to be meaningfully incorporating the new signals.")

print("\n--- SPOT CHECK (TOP 10 HIGH RISK) ---")
for idx, row in final_df.head(10).iterrows():
    print(f"[{row['final_risk_score']:.1f}] {row['work_id']} - {row['evidence_string']}")

print("\nModel 5 script execution complete.")
