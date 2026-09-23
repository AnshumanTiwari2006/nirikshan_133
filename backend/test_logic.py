import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
PROCESSED_DIR = BASE_DIR / "data" / "processed"
FEATURES_DIR = BASE_DIR / "data" / "features"

df = pd.read_csv(PROCESSED_DIR / "fact_work.csv")
risk_df = pd.read_csv(FEATURES_DIR / "risk_signals.csv")

merged = pd.merge(df, risk_df[['work_id', 'baseline_risk_score', 'baseline_risk_band', 'risk_reasons']], on='work_id', how='left')
print(merged['baseline_risk_band'].value_counts(dropna=False))
