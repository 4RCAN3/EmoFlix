import pandas as pd
import pickle
import torch
from sentence_transformers import SentenceTransformer

# Paths
MODEL_PATH = 'emotion_embedding_model'
CSV_PATH = 'wiki_movie_plots_deduped.csv'
OUTPUT_PATH = 'embeddings.pkl'

# Check CUDA availability
device = 'cuda' if torch.cuda.is_available() else 'cpu'
print(f"[INFO] Using device: {device.upper()}")

# Load model and move to CUDA
model = SentenceTransformer(MODEL_PATH, device=device)

# Load and clean data
print("[INFO] Loading movie dataset...")
df = pd.read_csv(CSV_PATH)
df = df.rename(columns=lambda x: x.strip().lower().replace(" ", "_"))
assert 'plot' in df.columns, "'plot' column not found."

plots = df['plot'].astype(str).tolist()

# Compute embeddings on GPU
print(f"[INFO] Encoding {len(plots)} plots with CUDA...")
embeddings = model.encode(
    plots,
    batch_size=32,
    show_progress_bar=True,
    convert_to_numpy=True,
    device=device  # Ensure GPU usage
)

# Save embeddings
print(f"[INFO] Saving embeddings to {OUTPUT_PATH}...")
with open(OUTPUT_PATH, 'wb') as f:
    pickle.dump(embeddings, f)

print("[DONE] Embedding generation complete.")
