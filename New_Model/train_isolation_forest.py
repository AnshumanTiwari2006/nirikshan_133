import pandas as pd
import numpy as np
import os
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
import warnings

warnings.filterwarnings('ignore')

# 1. Setup Directories
BASE_DIR = r"D:\SIH"
DATA_FILE = os.path.join(BASE_DIR, "data", "features", "model_features.csv")
WORK_FEATURES_FILE = os.path.join(BASE_DIR, "data", "features", "work_features.csv")
OUTPUT_DIR = os.path.join(BASE_DIR, "model_outputs", "isolation_forest")
os.makedirs(OUTPUT_DIR, exist_ok=True)

print("="*70)
print("MODEL 1: UNSUPERVISED ANOMALY DETECTOR (ISOLATION FOREST)")
print("="*70)

# 2. Load Data
print(f"Loading data from {DATA_FILE}...")
df = pd.read_csv(DATA_FILE)
work_df = pd.read_csv(WORK_FEATURES_FILE)

# 3. Sanity Checks on Input Data
print("\n--- SANITY CHECKS ---")
print(f"Row count matches 77,628: {len(df) == 77628} (Actual: {len(df)})")

desc = df.describe()
desc.to_csv(os.path.join(OUTPUT_DIR, "data_describe.csv"))
print("Saved data_describe.csv (check for impossible values like negative amounts or ratios >> 100).")

missing_counts = df.isna().sum()
missing_counts[missing_counts > 0].to_csv(os.path.join(OUTPUT_DIR, "missing_values.csv"))
print("Saved missing_values.csv (distinguish genuine missing vs 'doesn't apply to ongoing').")

# 4. Feature Selection & Preprocessing
numeric_cols = df.select_dtypes(include='number').columns.tolist()

cols_to_drop = [
    'work_id', 'mp_code', 'district_name', 'vendor_name', 'baseline_risk_score',
    'baseline_risk_band'
]
flag_cols = [c for c in numeric_cols if c.endswith('_flag') or c.endswith('_signal')]
numeric_cols = [c for c in numeric_cols if c not in cols_to_drop and c not in flag_cols]

print(f"\nSelected {len(numeric_cols)} numeric columns for training.")

zero_var_cols = [c for c in numeric_cols if df[c].var() == 0]
if zero_var_cols:
    print(f"Dropping zero-variance columns: {zero_var_cols}")
    numeric_cols = [c for c in numeric_cols if c not in zero_var_cols]

corr_matrix = df[numeric_cols].corr().abs()
upper = corr_matrix.where(np.triu(np.ones(corr_matrix.shape), k=1).astype(bool))
to_drop_corr = [column for column in upper.columns if any(upper[column] > 0.95)]
if to_drop_corr:
    print(f"Dropping highly correlated (>0.95) columns: {to_drop_corr}")
    numeric_cols = [c for c in numeric_cols if c not in to_drop_corr]

if 'completed_flag' not in df.columns:
    df = df.merge(work_df[['work_id', 'completed_flag']], on='work_id', how='left')

# 5. Split by Lifecycle Stage
df_completed = df[df['completed_flag'] == True].copy()
df_ongoing = df[df['completed_flag'] == False].copy()

print(f"\nSplit into two datasets based on lifecycle:")
print(f" - Completed Works: {len(df_completed)} rows")
print(f" - Ongoing Works: {len(df_ongoing)} rows")


def train_and_validate_iforest(data, subset_name):
    print(f"\n{'='*40}")
    print(f"TRAINING ISOLATION FOREST: {subset_name}")
    print(f"{'='*40}")

    X = data[numeric_cols].copy()

    imputer = SimpleImputer(strategy='median')
    X_imputed = imputer.fit_transform(X)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_imputed)

    # Validation 1: Contamination sweep
    contaminations = [0.03, 0.05, 0.10]
    sweep_results = []
    for contam in contaminations:
        iso = IsolationForest(contamination=contam, random_state=42, n_jobs=-1)
        iso.fit(X_scaled)
        preds = iso.predict(X_scaled)
        n_anomalies = (preds == -1).sum()
        sweep_results.append({'Contamination': contam, 'Anomalies_Flagged': n_anomalies})
    sweep_df = pd.DataFrame(sweep_results)
    print("\nContamination Sweep:")
    print(sweep_df.to_string(index=False))

    # Validation 2: Stability Check (Bootstrap 5 times)
    print("\nRunning Stability Check (5 Bootstraps at contamination=0.05)...")
    contam = 0.05
    n_bootstraps = 5
    flagged_indices = []
    for i in range(n_bootstraps):
        indices = np.random.choice(len(X_scaled), size=len(X_scaled), replace=True)
        X_boot = X_scaled[indices]
        iso = IsolationForest(contamination=contam, random_state=i, n_jobs=-1)
        iso.fit(X_boot)
        preds = iso.predict(X_scaled)
        anomalies = np.where(preds == -1)[0]
        flagged_indices.append(set(anomalies))

    overlaps = []
    for i in range(len(flagged_indices)):
        for j in range(i + 1, len(flagged_indices)):
            intersection = len(flagged_indices[i].intersection(flagged_indices[j]))
            union = len(flagged_indices[i].union(flagged_indices[j]))
            if union > 0:
                overlaps.append(intersection / union)
    mean_overlap = np.mean(overlaps) * 100
    print(f"Mean Anomaly Overlap between bootstraps: {mean_overlap:.2f}%")
    if mean_overlap < 40:
        print(" -> WARNING: Low overlap! Model might be picking up noise.")
    else:
        print(" -> Model stability looks acceptable.")

    # Final Model Training at chosen contamination
    chosen_contam = 0.05
    iso_final = IsolationForest(contamination=chosen_contam, random_state=42, n_jobs=-1)
    iso_final.fit(X_scaled)

    data = data.copy()
    data['anomaly_score'] = iso_final.decision_function(X_scaled)
    data['is_anomaly'] = iso_final.predict(X_scaled) == -1

    # Save flagged-only file (unchanged — for direct review)
    output_file = os.path.join(OUTPUT_DIR, f"{subset_name}_anomalies.csv")
    anomalies_df = data[data['is_anomaly']]
    anomalies_df.to_csv(output_file, index=False)
    print(f"Saved {len(anomalies_df)} anomalies to {output_file}")

    # *** PATCH: save scores for EVERY work in this subset, not just flagged
    # ones. Model 5's ensemble needs a continuous score across all 77,628
    # works to normalize properly — using only the flagged subset gives 95%
    # of works a hard 0 with no gradient. ***
    all_scores_file = os.path.join(OUTPUT_DIR, f"{subset_name}_all_scores.csv")
    data[['work_id', 'anomaly_score', 'is_anomaly']].to_csv(all_scores_file, index=False)
    print(f"Saved {len(data)} total scores (all works, not just flagged) to {all_scores_file}")

    return data


df_completed_scored = train_and_validate_iforest(df_completed, "completed")
df_ongoing_scored = train_and_validate_iforest(df_ongoing, "ongoing")

# Combine and check overlap with baseline
print("\n" + "="*70)
print("SANITY CHECK AGAINST BASELINE")
print("="*70)

all_scored = pd.concat([df_completed_scored, df_ongoing_scored])
if 'baseline_risk_band' not in all_scored.columns:
    all_scored = all_scored.merge(work_df[['work_id', 'baseline_risk_band']], on='work_id', how='left')

if 'baseline_risk_band' in all_scored.columns:
    cross_tab = pd.crosstab(all_scored['is_anomaly'], all_scored['baseline_risk_band'])
    print("\nCross-tabulation (ML Anomaly vs Rule-based Baseline):")
    print(cross_tab)

    high_med_baseline = all_scored[all_scored['baseline_risk_band'].isin(['HIGH', 'MEDIUM'])]
    if len(high_med_baseline) > 0:
        caught_by_ml = high_med_baseline['is_anomaly'].sum()
        overlap_pct = (caught_by_ml / len(high_med_baseline)) * 100
        print(f"\nOverlap: {overlap_pct:.2f}% of HIGH/MEDIUM baseline risks were also flagged by the Isolation Forest.")
        if 40 <= overlap_pct <= 60:
            print(" -> This is in the healthy 40-60% range.")
        elif overlap_pct < 40:
            print(" -> Overlap is lower than expected. ML is finding different patterns than the rules.")
        else:
            print(" -> Overlap is very high. ML is largely agreeing with the rules.")

        total_ml_anomalies = all_scored['is_anomaly'].sum()
        new_value_ml_anomalies = total_ml_anomalies - caught_by_ml
        new_value_pct = (new_value_ml_anomalies / total_ml_anomalies) * 100
        print(f"\nNEW VALUE ADDED: {new_value_pct:.2f}% of the {total_ml_anomalies} ML-flagged anomalies were NOT caught by the baseline rules.")
else:
    print("Baseline risk bands not available for cross-check.")

print("\nModel 1 script execution complete.")
