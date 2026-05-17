"""cluster-mean collaborative filtering recommendation pipeline."""
import numpy as np
import pandas as pd
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"
TOP_N = 10


def _user_top_genres(user_id: int, ratings_df: pd.DataFrame, movies_df: pd.DataFrame,
                     top_n: int = 3) -> set[str]:
    """guess the user's favorite genres from whatever they rated highest."""
    user_ratings = ratings_df[ratings_df["user_id"] == user_id]
    if user_ratings.empty:
        return set()
    threshold = user_ratings["rating"].quantile(0.6)
    liked = user_ratings[user_ratings["rating"] >= threshold]["movie_id"]
    genres = (
        movies_df[movies_df["movie_id"].isin(liked)]["Genre"]
        .str.split(r",\s*")
        .explode()
        .str.strip()
        .value_counts()
        .head(top_n)
        .index.tolist()
    )
    return set(genres)


def _collaborative(user_id: int, cluster_id: int, ratings_df: pd.DataFrame,
                   movies_df: pd.DataFrame, user_vectors: np.ndarray) -> list[int]:
    """
    cluster-mean cf with a genre filter on top (cascade hybrid).

    sticking to the user's cluster keeps the neighbor pool genre-coherent,
    and the genre filter narrows candidates further so the top 10 actually
    match what the user likes instead of just whatever their cluster watched.
    """
    cluster_users = ratings_df[ratings_df["cluster_id"] == cluster_id]["user_id"].unique()
    peers = [p for p in cluster_users if p != user_id]
    if not peers:
        return []

    watched = set(ratings_df[ratings_df["user_id"] == user_id]["movie_id"])

    preferred_genres = _user_top_genres(user_id, ratings_df, movies_df)
    if preferred_genres:
        genre_mask = movies_df["Genre"].apply(
            lambda g: any(pg in g for pg in preferred_genres)
        )
        genre_movie_ids = set(movies_df[genre_mask]["movie_id"])
    else:
        genre_movie_ids = set(movies_df["movie_id"])

    cluster_ratings = ratings_df[
        (ratings_df["user_id"].isin(peers))
        & (~ratings_df["movie_id"].isin(watched))
        & (ratings_df["movie_id"].isin(genre_movie_ids))
    ]

    if cluster_ratings.empty:
        return []

    candidates = (
        cluster_ratings.groupby("movie_id")["rating"]
        .agg(["mean", "count"])
        .query("count >= 2")
    )
    if candidates.empty:
        candidates = cluster_ratings.groupby("movie_id")["rating"].agg(["mean", "count"])

    candidates["score"] = candidates["mean"] + 0.01 * np.log1p(candidates["count"])
    return candidates.nlargest(TOP_N, "score").index.tolist()


def recommend(user_id: int, ratings_df: pd.DataFrame, movies_df: pd.DataFrame,
              user_vectors: np.ndarray | None = None) -> list[dict]:
    if user_vectors is None:
        user_vectors = np.load(DATA_DIR / "user_vectors.npy")

    cluster_id = ratings_df[ratings_df["user_id"] == user_id]["cluster_id"].iloc[0]
    movie_ids = _collaborative(user_id, cluster_id, ratings_df, movies_df, user_vectors)

    if not movie_ids:
        # cluster was too sparse to recommend anything, fall back to top-rated unseen movies
        watched = set(ratings_df[ratings_df["user_id"] == user_id]["movie_id"])
        movie_ids = (
            movies_df[~movies_df["movie_id"].isin(watched)]
            .nlargest(TOP_N, "IMDB_Rating")["movie_id"].tolist()
        )
        method = "popularity-fallback"
    else:
        method = "collaborative"

    recs = movies_df[movies_df["movie_id"].isin(movie_ids)][
        ["movie_id", "Series_Title", "Genre", "IMDB_Rating", "Poster_Link"]
    ].to_dict(orient="records")
    for r in recs:
        r["method"] = method
    return recs


def precompute_all(ratings_df: pd.DataFrame, movies_df: pd.DataFrame,
                   user_vectors: np.ndarray) -> pd.DataFrame:
    records = []
    for user_id in ratings_df["user_id"].unique():
        for rank, rec in enumerate(recommend(user_id, ratings_df, movies_df, user_vectors), start=1):
            records.append({
                "user_id": user_id,
                "movie_id": rec["movie_id"],
                "rank": rank,
                "method": rec["method"],
            })
    return pd.DataFrame(records)


if __name__ == "__main__":
    movies_df = pd.read_csv(DATA_DIR / "movies_clean.csv")
    ratings_df = pd.read_csv(DATA_DIR / "synthetic_users.csv")
    user_vectors = np.load(DATA_DIR / "user_vectors.npy")

    recs_df = precompute_all(ratings_df, movies_df, user_vectors)
    recs_df.to_csv(DATA_DIR / "recommendations.csv", index=False)
    print(f"Precomputed {len(recs_df)} recommendations for {recs_df['user_id'].nunique()} users")
