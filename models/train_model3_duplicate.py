import pandas as pd
import numpy as np
import os
import networkx as nx
from sentence_transformers import SentenceTransformer, util
import warnings
from scipy.stats import zscore
from pathlib import Path

warnings.filterwarnings('ignore')

# 1. Setup Directories
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_FILE = BASE_DIR / "data" / "processed" / "fact_work.csv"
OUTPUT_DIR = BASE_DIR / "model_outputs" / "duplicate_detection"
os.makedirs(OUTPUT_DIR, exist_ok=True)

print("="*70)
print("MODEL 3: DUPLICATE WORK DETECTION (Sentence-BERT)")
print("="*70)

# 2. Load Data and Sanity Checks
print(f"Loading data from {DATA_FILE}...")
df = pd.read_csv(DATA_FILE)
initial_count = len(df)

desc_col = 'parsed_work_description' if 'parsed_work_description' in df.columns else 'work_description'
if desc_col not in df.columns:
    raise ValueError("No description column found!")

print(f"Using description column: {desc_col}")

# Drop rows with null or short descriptions
df[desc_col] = df[desc_col].astype(str).fillna('')
df_valid = df[df[desc_col].str.len() >= 5].copy()
dropped_count = initial_count - len(df_valid)
print(f"Dropped {dropped_count} rows with missing or short descriptions (<5 chars). Remaining: {len(df_valid)}")

# Convert sanction_date to datetime
df_valid['sanction_date'] = pd.to_datetime(df_valid['sanction_date'], errors='coerce')

# 3. Model Initialization
print("\nLoading sentence-transformer model 'all-MiniLM-L6-v2'...")
model = SentenceTransformer('all-MiniLM-L6-v2')

# 4. District-wise Processing
districts = df_valid['district_name'].dropna().unique()
print(f"Processing {len(districts)} districts...")

all_pairs = []
clusters_data = []
outliers_data = []

total_districts_scanned = 0
cluster_id_counter = 1

for dist in districts:
    dist_df = df_valid[df_valid['district_name'] == dist].copy()
    if len(dist_df) < 2:
        continue
        
    total_districts_scanned += 1
    dist_df = dist_df.reset_index(drop=True)
    
    # Embeddings
    descriptions = dist_df[desc_col].tolist()
    embeddings = model.encode(descriptions, show_progress_bar=False, batch_size=64)
    
    # Pairwise Cosine Similarity
    cos_scores = util.cos_sim(embeddings, embeddings).numpy()
    
    # Find pairs
    # Extract upper triangular matrix without diagonal
    np.fill_diagonal(cos_scores, 0)
    indices = np.where(cos_scores >= 0.75)
    
    G = nx.Graph()
    G.add_nodes_from(dist_df['work_id'])
    
    for i, j in zip(*indices):
        if i >= j: continue # Only upper triangle
        
        sim = cos_scores[i, j]
        
        work_a = dist_df.iloc[i]
        work_b = dist_df.iloc[j]
        
        amt_a = work_a['sanction_amount']
        amt_b = work_b['sanction_amount']
        
        # Cost Diff Filter (<= 15%)
        if pd.isna(amt_a) or pd.isna(amt_b) or max(amt_a, amt_b) == 0:
            cost_diff_pct = 0.0
        else:
            cost_diff_pct = abs(amt_a - amt_b) / max(amt_a, amt_b)
            
        if cost_diff_pct > 0.15:
            continue
            
        # Date Diff Filter (<= 180 days)
        date_a = work_a['sanction_date']
        date_b = work_b['sanction_date']
        
        if pd.isna(date_a) or pd.isna(date_b):
            continue # If dates are missing, we can't reliably confirm proximity. Or we could assume they pass. Let's skip.
        
        date_diff_days = abs((date_a - date_b).days)
        if date_diff_days > 180:
            continue
            
        # Passed all filters!
        all_pairs.append({
            'work_id_A': work_a['work_id'],
            'work_id_B': work_b['work_id'],
            'district_name': dist,
            'similarity': sim,
            'cost_diff_pct': cost_diff_pct,
            'date_diff_days': date_diff_days,
            'desc_A': work_a[desc_col],
            'desc_B': work_b[desc_col]
        })
        
        G.add_edge(work_a['work_id'], work_b['work_id'])
        
    # Extract Clusters
    for comp in nx.connected_components(G):
        if len(comp) < 2: continue
        
        comp_works = dist_df[dist_df['work_id'].isin(comp)]
        cluster_size = len(comp_works)
        sample_desc = comp_works[desc_col].iloc[0]
        amounts = comp_works['sanction_amount'].dropna()
        
        total_val = amounts.sum()
        avg_val = amounts.mean() if len(amounts) > 0 else 0
        std_val = amounts.std() if len(amounts) > 1 else 0
        
        cluster_data = {
            'cluster_id': f"C_{cluster_id_counter:05d}",
            'district_name': dist,
            'state': comp_works['state'].iloc[0],
            'cluster_size': cluster_size,
            'sample_description': sample_desc,
            'total_sanctioned_value': total_val,
            'avg_sanctioned_value': avg_val,
            'std_sanctioned_value': std_val,
            'work_ids': ";".join(comp_works['work_id'].tolist())
        }
        
        # Classify cluster
        if cluster_size <= 3:
            cluster_data['duplicate_funding_candidate'] = True
            cluster_data['bulk_procurement_pattern'] = False
        elif cluster_size > 10:
            cluster_data['duplicate_funding_candidate'] = False
            cluster_data['bulk_procurement_pattern'] = True
            
            # Check for outliers
            if std_val > 0:
                comp_works = comp_works.copy()
                comp_works['z_score'] = (comp_works['sanction_amount'] - avg_val) / std_val
                outliers = comp_works[comp_works['z_score'].abs() > 2.5]
                for _, out in outliers.iterrows():
                    outliers_data.append({
                        'cluster_id': cluster_data['cluster_id'],
                        'work_id': out['work_id'],
                        'district_name': dist,
                        'sanction_amount': out['sanction_amount'],
                        'cluster_avg': avg_val,
                        'z_score': out['z_score'],
                        'description': out[desc_col]
                    })
        else:
            cluster_data['duplicate_funding_candidate'] = False
            cluster_data['bulk_procurement_pattern'] = False
            
        clusters_data.append(cluster_data)
        cluster_id_counter += 1
        
    if total_districts_scanned % 50 == 0:
        print(f"Processed {total_districts_scanned}/{len(districts)} districts...")

# 5. Output Results
pairs_df = pd.DataFrame(all_pairs)
clusters_df = pd.DataFrame(clusters_data)
outliers_df = pd.DataFrame(outliers_data)

# If empty, create empty dataframes with correct columns so the ensemble script doesn't crash
if len(clusters_df) == 0:
    clusters_df = pd.DataFrame(columns=['cluster_id', 'district_name', 'state', 'cluster_size', 'sample_description', 'total_sanctioned_value', 'avg_sanctioned_value', 'std_sanctioned_value', 'work_ids', 'duplicate_funding_candidate', 'bulk_procurement_pattern'])

pairs_file = os.path.join(OUTPUT_DIR, "fact_duplicate_pairs_raw.csv")
clusters_file = os.path.join(OUTPUT_DIR, "fact_duplicate_clusters.csv")
outliers_file = os.path.join(OUTPUT_DIR, "cluster_outliers.csv")

pairs_df.to_csv(pairs_file, index=False)
clusters_df.to_csv(clusters_file, index=False)
outliers_df.to_csv(outliers_file, index=False)

print("\n--- SUMMARY STATS ---")
print(f"Total districts scanned: {total_districts_scanned}")
print(f"Raw pairs found (passing all 3 filters): {len(pairs_df)}")
print(f"Number of clusters formed: {len(clusters_df)}")

if len(clusters_df) > 0:
    small_clusters = clusters_df['duplicate_funding_candidate'].sum()
    bulk_clusters = clusters_df['bulk_procurement_pattern'].sum()
    print(f" -> Duplicate funding candidates (<=3 works): {small_clusters}")
    print(f" -> Bulk procurement patterns (>10 works): {bulk_clusters}")
print(f"Number of cluster-outliers found in bulk procurements: {len(outliers_df)}")

print("\nModel 3 script execution complete.")
