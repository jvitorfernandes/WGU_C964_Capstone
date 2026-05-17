"""k-means clustering on user genre-preference vectors."""
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score, davies_bouldin_score
from sklearn.preprocessing import MultiLabelBinarizer, normalize

DATA_DIR = Path(__file__).parent.parent / "data"


def build_user_vectors(movies_df: pd.DataFrame, ratings_df: pd.DataFrame, movie_features: np.ndarray) -> np.ndarray:
    """weighted average of full movie feature vectors per user, weighted by rating. used by recommend.py."""
    n_users = ratings_df["user_id"].nunique()
    n_features = movie_features.shape[1]
    user_vectors = np.zeros((n_users, n_features))

    movie_id_to_idx = {mid: i for i, mid in enumerate(movies_df["movie_id"])}

    for user_id, group in ratings_df.groupby("user_id"):
        idxs = [movie_id_to_idx[m] for m in group["movie_id"] if m in movie_id_to_idx]
        weights = group.loc[group["movie_id"].isin(movie_id_to_idx), "rating"].values
        if len(idxs) == 0:
            continue
        user_vectors[user_id] = np.average(movie_features[idxs], axis=0, weights=weights)

    return user_vectors


def build_user_genre_vectors(movies_df: pd.DataFrame, ratings_df: pd.DataFrame) -> np.ndarray:
    """
    build genre-preference vectors for clustering.
    each dimension = sum of ratings for movies in that genre, normalized per user.
    genre signal is way cleaner for k-means than the full 30-d feature matrix.
    """
    genres = movies_df["Genre"].str.split(r",\s*")
    mlb = MultiLabelBinarizer()
    genre_matrix = mlb.fit_transform(genres)  # (n_movies, n_genres)
    movie_id_to_idx = dict(zip(movies_df["movie_id"], range(len(movies_df))))

    n_users = ratings_df["user_id"].nunique()
    n_genres = genre_matrix.shape[1]
    genre_vectors = np.zeros((n_users, n_genres))

    for user_id, group in ratings_df.groupby("user_id"):
        for _, row in group.iterrows():
            idx = movie_id_to_idx.get(row["movie_id"])
            if idx is not None:
                genre_vectors[user_id] += genre_matrix[idx] * row["rating"]

    # l2-normalize so k-means cares about taste direction, not how many movies someone watched
    return normalize(genre_vectors, norm="l2")


def tune_k(user_vectors: np.ndarray, k_range=range(2, 16), seed: int = 42):
    """return dict of k -> (inertia, silhouette, davies_bouldin)."""
    results = {}
    for k in k_range:
        km = KMeans(n_clusters=k, init="k-means++", n_init=10, random_state=seed)
        labels = km.fit_predict(user_vectors)
        sil = silhouette_score(user_vectors, labels)
        db = davies_bouldin_score(user_vectors, labels)
        results[k] = {"inertia": km.inertia_, "silhouette": sil, "davies_bouldin": db}
        print(f"k={k:2d}  inertia={km.inertia_:.1f}  silhouette={sil:.4f}  DB={db:.4f}")
    return results


def fit_kmeans(user_vectors: np.ndarray, k: int, seed: int = 42) -> KMeans:
    km = KMeans(n_clusters=k, init="k-means++", n_init=20, random_state=seed)
    km.fit(user_vectors)
    return km


def run():
    movies_df = pd.read_csv(DATA_DIR / "movies_clean.csv")
    ratings_df = pd.read_csv(DATA_DIR / "synthetic_users.csv")
    movie_features = np.load(DATA_DIR / "movie_features.npy")

    # full feature vectors, saved so recommend.py can reuse them
    user_vectors = build_user_vectors(movies_df, ratings_df, movie_features)
    np.save(DATA_DIR / "user_vectors.npy", user_vectors)

    # genre-only l2-normalized vectors, this is what we actually cluster on
    genre_vectors = build_user_genre_vectors(movies_df, ratings_df)
    np.save(DATA_DIR / "user_genre_vectors.npy", genre_vectors)

    print("Tuning k on genre vectors...")
    results = tune_k(genre_vectors)

    # just go with whatever k gave the best silhouette
    best_k = max(results, key=lambda k: results[k]["silhouette"])
    print(f"\nBest k={best_k} (silhouette={results[best_k]['silhouette']:.4f})")

    km = fit_kmeans(genre_vectors, best_k)
    labels = km.labels_

    ratings_df["cluster_id"] = ratings_df["user_id"].map(
        dict(enumerate(labels))
    )
    ratings_df.to_csv(DATA_DIR / "synthetic_users.csv", index=False)

    np.save(DATA_DIR / "cluster_labels.npy", labels)
    print("Clustering complete.")
    return km, user_vectors, labels


if __name__ == "__main__":
    run()
