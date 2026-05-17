"""evaluation: precision@10, lift over popularity baseline, cold-start coverage."""
import numpy as np
import pandas as pd
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"


def train_test_split(ratings_df: pd.DataFrame, test_frac: float = 0.2, seed: int = 42) -> tuple[pd.DataFrame, pd.DataFrame]:
    rng = np.random.default_rng(seed)
    train_rows, test_rows = [], []
    for _, group in ratings_df.groupby("user_id"):
        idxs = group.index.tolist()
        n_test = max(1, int(len(idxs) * test_frac))
        test_idx = rng.choice(idxs, size=n_test, replace=False)
        mask = group.index.isin(test_idx)
        test_rows.append(group[mask])
        train_rows.append(group[~mask])
    return pd.concat(train_rows).reset_index(drop=True), pd.concat(test_rows).reset_index(drop=True)


def _recommend_for_eval(user_id: int, train_df: pd.DataFrame, movies_df: pd.DataFrame,
                        user_vectors: np.ndarray, k: int = 10) -> list[int]:
    """recs using only the training data, so we don't leak the held-out movies."""
    from recommend import recommend
    return [r["movie_id"] for r in recommend(user_id, train_df, movies_df, user_vectors)][:k]


def precision_at_k(train_df: pd.DataFrame, test_df: pd.DataFrame,
                   movies_df: pd.DataFrame, movie_features: np.ndarray,
                   user_vectors: np.ndarray, k: int = 10) -> float:
    """
    for each user, get top-k recs (excluding stuff they've already watched)
    and check how many of those show up in their held-out test set.
    """
    test_set = test_df.groupby("user_id")["movie_id"].apply(set)
    hits = 0
    total = 0
    for user_id in test_set.index:
        recs = _recommend_for_eval(user_id, train_df, movies_df, user_vectors, k)
        hits += len(set(recs) & test_set[user_id])
        total += k
    return hits / total if total else 0.0


def popularity_baseline_precision(movies_df: pd.DataFrame, train_df: pd.DataFrame,
                                  test_df: pd.DataFrame, k: int = 10) -> float:
    """dumb baseline: just recommend the globally top-rated movies the user hasn't seen."""
    top_global = movies_df.nlargest(k * 5, "IMDB_Rating")["movie_id"].tolist()
    test_set = test_df.groupby("user_id")["movie_id"].apply(set)
    train_watched = train_df.groupby("user_id")["movie_id"].apply(set)
    hits = 0
    total = 0
    for user_id in test_set.index:
        watched = train_watched.get(user_id, set())
        baseline_recs = [m for m in top_global if m not in watched][:k]
        hits += len(set(baseline_recs) & test_set[user_id])
        total += k
    return hits / total if total else 0.0


def cold_start_coverage(train_df: pd.DataFrame, movies_df: pd.DataFrame,
                        movie_features: np.ndarray, user_vectors: np.ndarray) -> float:
    all_users = set(train_df["user_id"].unique())
    covered = set()
    for user_id in all_users:
        recs = _recommend_for_eval(user_id, train_df, movies_df, user_vectors)
        if recs:
            covered.add(user_id)
    return len(covered) / len(all_users)


def run():
    movies_df = pd.read_csv(DATA_DIR / "movies_clean.csv")
    ratings_df = pd.read_csv(DATA_DIR / "synthetic_users.csv")
    movie_features = np.load(DATA_DIR / "movie_features.npy")
    user_vectors = np.load(DATA_DIR / "user_vectors.npy")

    print("Splitting train/test (80/20 per user)...")
    train_df, test_df = train_test_split(ratings_df)

    print("Computing Precision@10 (this may take a minute)...")
    p10 = precision_at_k(train_df, test_df, movies_df, movie_features, user_vectors)
    baseline_p10 = popularity_baseline_precision(movies_df, train_df, test_df)
    coverage = cold_start_coverage(train_df, movies_df, movie_features, user_vectors)

    print(f"\nPrecision@10 (model):    {p10:.4f}  (target ≥ 0.30)")
    print(f"Precision@10 (baseline): {baseline_p10:.4f}")
    print(f"Lift:                    {p10 - baseline_p10:+.4f}  (target ≥ 0.10)")
    print(f"Cold-start coverage:     {coverage:.2%}  (target 100%)")
    return {"precision_at_10": p10, "baseline_p10": baseline_p10, "coverage": coverage}


if __name__ == "__main__":
    run()
