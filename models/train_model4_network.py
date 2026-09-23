import pandas as pd
import numpy as np
import os
import networkx as nx
import warnings
import re
from pathlib import Path

warnings.filterwarnings('ignore')

# 1. Setup Directories
BASE_DIR = Path(__file__).resolve().parent.parent
PAYMENT_FILE = BASE_DIR / "data" / "processed" / "fact_payment.csv"
WORK_FILE = BASE_DIR / "data" / "processed" / "fact_work.csv"
VENDOR_FEAT_FILE = BASE_DIR / "data" / "features" / "vendor_features.csv"
OUTPUT_DIR = BASE_DIR / "model_outputs" / "graph_analytics"
os.makedirs(OUTPUT_DIR, exist_ok=True)

print("="*70)
print("MODEL 4: VENDOR / NETWORK GRAPH ANOMALY")
print("="*70)

# 2. Load Data
print(f"Loading data...")
payments = pd.read_csv(PAYMENT_FILE)
works = pd.read_csv(WORK_FILE)[['work_id', 'mp_code', 'district_name']]
vendor_features = pd.read_csv(VENDOR_FEAT_FILE)

# 3. Vendor Name Normalization Sanity Check
def normalize_vendor_name(name):
    if pd.isna(name):
        return 'UNKNOWN'
    name = str(name).upper().strip()
    # Remove common suffixes and extra spaces
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

print("Normalizing vendor names...")
payments['vendor_name_clean'] = payments['vendor_name'].apply(normalize_vendor_name)
vendor_features['vendor_name_clean'] = vendor_features['vendor_name_clean'].apply(normalize_vendor_name)

# Group vendor features by clean name
clean_vendor_features = vendor_features.groupby('vendor_name_clean', as_index=False).agg({
    'work_count': 'sum',
    'total_disbursed': 'sum'
})

# Merge to get MP Code
merged = payments.merge(works, on='work_id', how='left')

# Drop missing vendor or MP
merged = merged.dropna(subset=['vendor_name_clean', 'mp_code'])
merged = merged[merged['vendor_name_clean'] != 'UNKNOWN']

# Aggregate edges: vendor -> mp_code
edge_df = merged.groupby(['vendor_name_clean', 'mp_code'], as_index=False).agg(
    total_amount=('fund_disbursed_amount', 'sum'),
    payment_count=('fund_disbursed_amount', 'count')
)

print(f"Constructing graph with {len(edge_df)} edges...")
G = nx.Graph()

# Add nodes with types
vendors = edge_df['vendor_name_clean'].unique()
mps = edge_df['mp_code'].unique()

G.add_nodes_from(vendors, bipartite=0, type='vendor')
G.add_nodes_from(mps, bipartite=1, type='mp')

# Add edges
for _, row in edge_df.iterrows():
    G.add_edge(row['vendor_name_clean'], row['mp_code'], 
               weight=row['total_amount'], 
               count=row['payment_count'])

# 4. Compute Metrics per Vendor Node
print("Computing network metrics...")
degree_dict = dict(G.degree()) # Number of distinct MPs
# NetworkX betweenness centrality can be slow for huge graphs, but bipartite with ~15k nodes should be okay
# We'll compute it for the whole graph, then extract vendors. Using k=100 to speed it up significantly.
bc_dict = nx.betweenness_centrality(G, weight='weight', k=100, seed=42) 

vendor_metrics = []
for v in vendors:
    deg = degree_dict[v]
    bc = bc_dict[v]
    # Sum total amount across edges
    tot_amt = sum(d['weight'] for u, v_edge, d in G.edges(v, data=True))
    vendor_metrics.append({
        'vendor_name_clean': v,
        'degree': deg,
        'betweenness_centrality': bc,
        'total_payment_amount': tot_amt
    })

vm_df = pd.DataFrame(vendor_metrics)
vm_df = vm_df.merge(clean_vendor_features, on='vendor_name_clean', how='left')
vm_df['work_count'] = vm_df['work_count'].fillna(1) # Default to 1 if not found

# 5. Flagging Logic
print("\n--- DEGREE DISTRIBUTION ---")
print(vm_df['degree'].describe())

degree_95 = vm_df['degree'].quantile(0.95)
# Ensure the 95th percentile is meaningful (at least > 1)
degree_thresh = max(degree_95, 2)

amt_90 = vm_df['total_payment_amount'].quantile(0.90)
bc_95 = vm_df['betweenness_centrality'].quantile(0.95)
bc_thresh = max(bc_95, 0.0001) # Avoid flagging everyone if 95th is 0

vm_df['high_reach_flag'] = vm_df['degree'] >= degree_thresh
# High concentration: gets top 10% of total payment amount but across 3 or fewer works
vm_df['high_concentration_flag'] = (vm_df['work_count'] <= 3) & (vm_df['total_payment_amount'] >= amt_90)
vm_df['bridge_flag'] = vm_df['betweenness_centrality'] >= bc_thresh

vm_df['total_flags'] = vm_df['high_reach_flag'].astype(int) + vm_df['high_concentration_flag'].astype(int) + vm_df['bridge_flag'].astype(int)

# Sort by flags
vm_df = vm_df.sort_values(by=['total_flags', 'total_payment_amount'], ascending=[False, False])

# 6. Outputs
flags_file = os.path.join(OUTPUT_DIR, "vendor_network_flags.csv")
edges_file = os.path.join(OUTPUT_DIR, "vendor_mp_edges.csv")

vm_df.to_csv(flags_file, index=False)
edge_df.to_csv(edges_file, index=False)

print("\n--- SUMMARY STATS ---")
print(f"Total Vendors: {len(vendors)}")
print(f"Total MPs: {len(mps)}")
print(f"High Reach Flagged (>={degree_thresh} MPs): {vm_df['high_reach_flag'].sum()}")
print(f"High Concentration Flagged (WorkCount<=3 & Amt>=Rs{amt_90:,.0f}): {vm_df['high_concentration_flag'].sum()}")
print(f"Bridge Flagged (Centrality>={bc_thresh:.4f}): {vm_df['bridge_flag'].sum()}")
print(f"Vendors with 1+ flags: {(vm_df['total_flags'] > 0).sum()}")

print(f"\nSaved {len(vm_df)} vendor flags to {flags_file}")
print(f"Saved {len(edge_df)} edges to {edges_file}")

print("\nModel 4 script execution complete.")
