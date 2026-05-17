"""compute and store pairwise cosine similarity between users."""
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.metrics.pairwise import cosine_similarity

DATA_DIR = Path(__file__).parent.parent / "data"
TOP_K_SIMILAR = 20  # only keep the top 20 per user, otherwise the table gets huge


def build_rating_matrix(movies_df: pd.DataFrame, ratings_df: pd.DataFrame) -> np.ndarray:
    n_users = ratings_df["user_id"].nunique()
    n_movies = len(movies_df)
    movie_id_to_col = dict(zip(movies_df["movie_id"], range(n_movies)))

    matrix = np.zeros((n_users, n_movies))
    for _, row in ratings_df.iterrows():
        col = movie_id_to_col.get(row["movie_id"])
        if col is not None:
            matrix[int(row["user_id"]), col] = row["rating"]
    return matrix


def compute_similarity(rating_matrix: np.ndarray) -> np.ndarray:
    return cosine_similarity(rating_matrix)


def top_k_similar_users(sim_matrix: np.ndarray, k: int = TOP_K_SIMILAR) -> pd.DataFrame:
    records = []
    n = sim_matrix.shape[0]
    for user_a in range(n):
        row = sim_matrix[user_a].copy()
        row[user_a] = -1  # don't recommend yourself to yourself
        top_k = np.argsort(row)[-k:][::-1]
        for user_b in top_k:
            records.append({"user_a": user_a, "user_b": int(user_b), "sim": float(row[user_b])})
    return pd.DataFrame(records)


def run():
    movies_df = pd.read_csv(DATA_DIR / "movies_clean.csv")
    ratings_df = pd.read_csv(DATA_DIR / "synthetic_users.csv")

    rating_matrix = build_rating_matrix(movies_df, ratings_df)
    np.save(DATA_DIR / "rating_matrix.npy", rating_matrix)

    sim_matrix = compute_similarity(rating_matrix)
    sim_df = top_k_similar_users(sim_matrix)
    sim_df.to_csv(DATA_DIR / "user_similarity.csv", index=False)
    print(f"Stored {len(sim_df)} user-similarity pairs")
    return sim_df


if __name__ == "__main__":
    run()
