import pandas as pd
import numpy as np
import os
import joblib
import xgboost as xgb
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
import category_encoders as ce
import re
from pathlib import Path

# 1. Setup Directories
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_FILE = BASE_DIR / "data" / "features" / "model_features.csv"
WORK_FEATURES_FILE = BASE_DIR / "data" / "features" / "work_features.csv"
OUTPUT_DIR = BASE_DIR / "model_outputs" / "serialized_models"
os.makedirs(OUTPUT_DIR, exist_ok=True)

print("="*70)
print("SERIALIZING MODELS 1 AND 2 FOR PRODUCTION (ENSEMBLE MODEL 5)")
print("="*70)

# 2. Load Data
df = pd.read_csv(DATA_FILE)
work_df = pd.read_csv(WORK_FEATURES_FILE)

if 'completed_flag' not in df.columns:
    df = df.merge(work_df[['work_id', 'completed_flag']], on='work_id', how='left')

# -------------------------------------------------------------------------
# SERIALIZE MODEL 1: ISOLATION FOREST
# -------------------------------------------------------------------------
print("\nSerializing Model 1 (Isolation Forest)...")

numeric_cols = df.select_dtypes(include='number').columns.tolist()
cols_to_drop = ['work_id', 'mp_code', 'district_name', 'vendor_name', 'baseline_risk_score', 'baseline_risk_band']
flag_cols = [c for c in numeric_cols if c.endswith('_flag') or c.endswith('_signal')]
numeric_cols = [c for c in numeric_cols if c not in cols_to_drop and c not in flag_cols]

zero_var_cols = [c for c in numeric_cols if df[c].var() == 0]
numeric_cols = [c for c in numeric_cols if c not in zero_var_cols]

corr_matrix = df[numeric_cols].corr().abs()
upper = corr_matrix.where(np.triu(np.ones(corr_matrix.shape), k=1).astype(bool))
to_drop_corr = [column for column in upper.columns if any(upper[column] > 0.95)]
numeric_cols = [c for c in numeric_cols if c not in to_drop_corr]

def serialize_iforest(data, subset_name):
    X = data[numeric_cols].copy()
    imputer = SimpleImputer(strategy='median')
    X_imputed = imputer.fit_transform(X)
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_imputed)
    
    iso = IsolationForest(contamination=0.05, random_state=42, n_jobs=-1)
    iso.fit(X_scaled)
    
    # Save objects
    joblib.dump(imputer, os.path.join(OUTPUT_DIR, f"iforest_{subset_name}_imputer.pkl"))
    joblib.dump(scaler, os.path.join(OUTPUT_DIR, f"iforest_{subset_name}_scaler.pkl"))
    joblib.dump(iso, os.path.join(OUTPUT_DIR, f"iforest_{subset_name}_model.pkl"))
    joblib.dump(numeric_cols, os.path.join(OUTPUT_DIR, f"iforest_{subset_name}_features.pkl"))
    
    print(f" -> Saved Isolation Forest ({subset_name}) successfully.")

df_completed = df[df['completed_flag'] == True].copy()
df_ongoing = df[df['completed_flag'] == False].copy()

serialize_iforest(df_completed, "completed")
serialize_iforest(df_ongoing, "ongoing")

# -------------------------------------------------------------------------
# SERIALIZE MODEL 2: XGBOOST REGRESSOR
# -------------------------------------------------------------------------
print("\nSerializing Model 2 (XGBoost Regressor)...")

def extract_subcategory(desc):
    if pd.isna(desc): return 'UNKNOWN'
    desc = str(desc).upper()
    if any(k in desc for k in ['ROAD', 'PATHWAY', 'PCC', 'CC ROAD', 'STREET']): return 'ROAD'
    if any(k in desc for k in ['BOUNDARY WALL', 'COMPOUND WALL']): return 'BOUNDARY WALL'
    if any(k in desc for k in ['COMMUNITY HALL', 'COMMUNITY BHAVAN', 'CULTURAL']): return 'COMMUNITY HALL'
    if any(k in desc for k in ['HANDPUMP', 'TUBEWELL', 'WATER', 'BOREWELL', 'PIPELINE']): return 'WATER SUPPLY'
    if any(k in desc for k in ['DRAIN', 'SEWERAGE']): return 'DRAINAGE'
    if any(k in desc for k in ['SOLAR', 'LIGHT', 'HIGH MAST', 'MAST', 'LED']): return 'LIGHTING'
    if any(k in desc for k in ['SCHOOL', 'CLASSROOM', 'COLLEGE']): return 'SCHOOL/CLASSROOM'
    if any(k in desc for k in ['HOSPITAL', 'CLINIC', 'HEALTH', 'AMBULANCE', 'MEDICAL']): return 'HEALTH'
    if any(k in desc for k in ['BUS STAND', 'SHELTER', 'SHED']): return 'SHELTER'
    if any(k in desc for k in ['TOILET', 'SANITATION', 'LAVATORY']): return 'SANITATION'
    if any(k in desc for k in ['PARK', 'GARDEN', 'PLAYGROUND', 'GYM']): return 'PARK/RECREATION'
    if any(k in desc for k in ['CREMATORIUM', 'GRAVEYARD', 'BURIAL', 'CEMETERY']): return 'CREMATORIUM'
    if any(k in desc for k in ['LIBRARY']): return 'LIBRARY'
    if any(k in desc for k in ['PANCHAYAT', 'OFFICE']): return 'PUBLIC OFFICE'
    return 'OTHER'

work_df_xgb = work_df.copy()
work_df_xgb = work_df_xgb[work_df_xgb['sanction_amount'] > 0].copy()

if 'work_description' in work_df_xgb.columns:
    work_df_xgb['work_subcategory'] = work_df_xgb['work_description'].apply(extract_subcategory)
else:
    work_df_xgb['work_subcategory'] = 'UNKNOWN'

work_df_xgb['has_recommended_amount'] = work_df_xgb['recommended_amount'].notna().astype(int)
rec_median = work_df_xgb['recommended_amount'].median()
work_df_xgb['recommended_amount_imputed'] = work_df_xgb['recommended_amount'].fillna(rec_median)

y_raw = work_df_xgb['sanction_amount']
y_log = np.log1p(y_raw)

features_xgb = [
    'work_category', 'state', 'district_name', 'financial_year', 'reservation_type',
    'work_subcategory', 'has_recommended_amount', 'recommended_amount_imputed'
]

X_xgb = work_df_xgb[features_xgb].copy()

cat_cols = ['work_category', 'state', 'district_name', 'financial_year', 'reservation_type', 'work_subcategory']
for col in cat_cols:
    X_xgb[col] = X_xgb[col].fillna('UNKNOWN').astype(str)

target_cols = ['district_name', 'state']
onehot_cols = [c for c in cat_cols if c not in target_cols]

# Encoders
te = ce.TargetEncoder(cols=target_cols)
X_xgb[target_cols] = te.fit_transform(X_xgb[target_cols], y_log)

ohe = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
ohe_df = pd.DataFrame(ohe.fit_transform(X_xgb[onehot_cols]), index=X_xgb.index)
ohe_df.columns = [f"OHE_{i}" for i in range(ohe_df.shape[1])]

X_xgb_final = pd.concat([X_xgb.drop(columns=onehot_cols), ohe_df], axis=1)
final_feature_names = X_xgb_final.columns.tolist()

# Train on full data
model = xgb.XGBRegressor(
    n_estimators=100, # using optimal ~80-200 iterations found in CV
    max_depth=5,
    min_child_weight=7,
    subsample=0.8,
    colsample_bytree=0.8,
    learning_rate=0.05,
    random_state=42,
    n_jobs=-1
)
model.fit(X_xgb_final, y_log, verbose=False)

joblib.dump(te, os.path.join(OUTPUT_DIR, "xgboost_target_encoder.pkl"))
joblib.dump(ohe, os.path.join(OUTPUT_DIR, "xgboost_onehot_encoder.pkl"))
joblib.dump({'rec_median': rec_median}, os.path.join(OUTPUT_DIR, "xgboost_impute_params.pkl"))
joblib.dump(model, os.path.join(OUTPUT_DIR, "xgboost_model.pkl"))
joblib.dump(features_xgb, os.path.join(OUTPUT_DIR, "xgboost_raw_features.pkl"))
joblib.dump(final_feature_names, os.path.join(OUTPUT_DIR, "xgboost_final_features.pkl"))

print(f" -> Saved XGBoost successfully (trained on {len(X_xgb_final)} rows).")

print("\nAll models serialized. Ready for Models 3-5!")
