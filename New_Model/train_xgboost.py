import pandas as pd
import numpy as np
import os
from sklearn.model_selection import GroupKFold
from sklearn.metrics import mean_absolute_percentage_error, mean_squared_error
from sklearn.preprocessing import OneHotEncoder
import category_encoders as ce
import xgboost as xgb
import warnings
import sys

warnings.filterwarnings('ignore')

# Import shared subcategory function (keeps training/serving in sync)
sys.path.append(r"D:\SIH")
from common_utils import extract_subcategory

# 1. Setup Directories
BASE_DIR = r"D:\SIH"
DATA_FILE = os.path.join(BASE_DIR, "data", "features", "work_features.csv")
OUTPUT_DIR = os.path.join(BASE_DIR, "model_outputs", "xgboost")
os.makedirs(OUTPUT_DIR, exist_ok=True)

print("="*70)
print("MODEL 2: COST PREDICTION / DEVIATION MODEL (XGBOOST)")
print("="*70)

# 2. Load Data
print(f"Loading data from {DATA_FILE}...")
df = pd.read_csv(DATA_FILE)

# 3. Sanity Checks & Target Prep
print("\n--- SANITY CHECKS ---")
invalid_target = (df['sanction_amount'] <= 0).sum()
if invalid_target > 0:
    print(f" -> Filtering out {invalid_target} works with non-positive sanction amount.")
    df = df[df['sanction_amount'] > 0].copy()

# 4. Feature Engineering
print("\n--- FEATURE ENGINEERING ---")
if 'work_description' in df.columns:
    df['work_subcategory'] = df['work_description'].apply(extract_subcategory)
else:
    df['work_subcategory'] = 'UNKNOWN'

df['has_recommended_amount'] = df['recommended_amount'].notna().astype(int)
rec_median = df['recommended_amount'].median()
df['recommended_amount_imputed'] = df['recommended_amount'].fillna(rec_median)

y_raw = df['sanction_amount']
y_log = np.log1p(y_raw)

# 5. Feature Selection
features = [
    'work_category', 'state', 'district_name', 'financial_year', 'reservation_type',
    'work_subcategory', 'has_recommended_amount', 'recommended_amount_imputed'
]
available_features = [f for f in features if f in df.columns]
print(f"Selected features for training: {available_features}")

X = df[available_features].copy()

cat_cols = ['work_category', 'state', 'district_name', 'financial_year', 'reservation_type', 'work_subcategory']
cat_cols = [c for c in cat_cols if c in X.columns]
for col in cat_cols:
    X[col] = X[col].fillna('UNKNOWN').astype(str)

target_cols = ['district_name', 'state']
target_cols = [c for c in target_cols if c in X.columns]
onehot_cols = [c for c in cat_cols if c not in target_cols]

gkf = GroupKFold(n_splits=5)
groups = df['district_name'].fillna('UNKNOWN')

print("\n--- TRAINING WITH 5-FOLD GROUP CV ---")
fold = 1
mape_scores, median_ape_scores, rmse_scores = [], [], []
oof_predictions = np.zeros(len(X))

for train_idx, val_idx in gkf.split(X, y_log, groups=groups):
    X_train, X_val = X.iloc[train_idx].copy(), X.iloc[val_idx].copy()
    y_train_log, y_val_log = y_log.iloc[train_idx], y_log.iloc[val_idx]
    y_train_raw, y_val_raw = y_raw.iloc[train_idx], y_raw.iloc[val_idx]

    if target_cols:
        te = ce.TargetEncoder(cols=target_cols)
        X_train[target_cols] = te.fit_transform(X_train[target_cols], y_train_log)
        X_val[target_cols] = te.transform(X_val[target_cols])

    if onehot_cols:
        ohe = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
        ohe_train = pd.DataFrame(ohe.fit_transform(X_train[onehot_cols]), index=X_train.index)
        ohe_val = pd.DataFrame(ohe.transform(X_val[onehot_cols]), index=X_val.index)
        ohe_train.columns = [f"OHE_{i}" for i in range(ohe_train.shape[1])]
        ohe_val.columns = [f"OHE_{i}" for i in range(ohe_val.shape[1])]
        X_train = pd.concat([X_train.drop(columns=onehot_cols), ohe_train], axis=1)
        X_val = pd.concat([X_val.drop(columns=onehot_cols), ohe_val], axis=1)

    model = xgb.XGBRegressor(
        n_estimators=500, max_depth=5, min_child_weight=7,
        subsample=0.8, colsample_bytree=0.8, learning_rate=0.05,
        random_state=42, n_jobs=-1, early_stopping_rounds=20
    )
    model.fit(X_train, y_train_log, eval_set=[(X_val, y_val_log)], verbose=False)

    preds_log = model.predict(X_val)
    preds_raw = np.expm1(preds_log)
    oof_predictions[val_idx] = preds_raw

    valid_mask = y_val_raw >= 1000
    y_val_valid = y_val_raw[valid_mask]
    preds_valid = preds_raw[valid_mask]

    if len(y_val_valid) > 0:
        mape = mean_absolute_percentage_error(y_val_valid, preds_valid)
        absolute_percentage_error = np.abs((y_val_valid - preds_valid) / y_val_valid)
        med_ape = np.median(absolute_percentage_error)
        rmse = np.sqrt(mean_squared_error(y_val_valid, preds_valid))
    else:
        mape, med_ape, rmse = 0, 0, 0

    print(f"Fold {fold} - MAPE (>Rs1k): {mape:.4f} | MedAPE: {med_ape:.4f} | RMSE: {rmse:,.0f} | Best Iter: {model.best_iteration}")
    mape_scores.append(mape)
    median_ape_scores.append(med_ape)
    rmse_scores.append(rmse)
    fold += 1

print("\n--- FINAL RESULTS ---")
print(f"Mean MAPE (on amounts >= Rs1,000): {np.mean(mape_scores):.4f}")
print(f"Mean Median APE: {np.mean(median_ape_scores):.4f}")
print(f"Mean RMSE: {np.mean(rmse_scores):,.0f}")

df['predicted_sanction_amount'] = oof_predictions
df['cost_deviation_amount'] = df['sanction_amount'] - df['predicted_sanction_amount']

# *** FIX: keep BOTH a signed and an absolute deviation percentage.
# Previously only an abs() version was saved as 'cost_deviation_pct',
# which made every work look like an "overrun" even when it actually
# came in UNDER budget (Model 5's evidence text was saying "Cost X%
# above" on works that were really below). Signed is now the source of
# truth for direction; abs is only used for ranking severity. ***
df['cost_deviation_pct_signed'] = (df['cost_deviation_amount'] / df['predicted_sanction_amount']) * 100
df['cost_deviation_pct_abs'] = df['cost_deviation_pct_signed'].abs()

out_cols = [
    'work_id', 'state', 'district_name', 'work_category', 'work_subcategory', 'sanction_amount',
    'predicted_sanction_amount', 'cost_deviation_amount',
    'cost_deviation_pct_signed', 'cost_deviation_pct_abs'
]
results_df = df[[c for c in out_cols if c in df.columns]]

output_file = os.path.join(OUTPUT_DIR, "cost_deviations.csv")
results_df.to_csv(output_file, index=False)
print(f"\nSaved {len(results_df)} predictions to {output_file}")

# *** FIX: only genuine OVERRUNS (positive signed deviation) are flagged
# as "top cost deviations" — a huge UNDERSPEND is a different situation
# (economical execution, or possibly incomplete reporting) and should not
# be mislabeled as a cost-overrun anomaly. ***
overruns_only = results_df[results_df['cost_deviation_pct_signed'] > 0]
perc_95 = overruns_only['cost_deviation_pct_signed'].quantile(0.95)
top_deviations = overruns_only[overruns_only['cost_deviation_pct_signed'] > perc_95] \
    .sort_values(by='cost_deviation_pct_signed', ascending=False)

print(f"Flagged {len(top_deviations)} genuine cost-OVERRUN works (Top 5% of overruns, cutoff > {perc_95:.2f}%).")
top_deviations.to_csv(os.path.join(OUTPUT_DIR, "top_cost_deviations.csv"), index=False)
print("\nModel 2 script execution complete.")
