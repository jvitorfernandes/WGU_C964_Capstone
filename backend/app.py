"""flask api - serves precomputed recs, similarity, and analytics data to the frontend."""
import numpy as np
import pandas as pd
from pathlib import Path
from flask import Flask, jsonify, request
from flask_cors import CORS

from recommend import recommend
from similarity import top_k_similar_users, compute_similarity, build_rating_matrix

DATA_DIR = Path(__file__).parent.parent / "data"

app = Flask(__name__)
CORS(app)

# load everything we precomputed once at startup, keep it in memory
movies_df = pd.read_csv(DATA_DIR / "movies_clean.csv")
ratings_df = pd.read_csv(DATA_DIR / "synthetic_users.csv")
movie_features = np.load(DATA_DIR / "movie_features.npy")
recs_df = pd.read_csv(DATA_DIR / "recommendations.csv")
sim_df = pd.read_csv(DATA_DIR / "user_similarity.csv")

# crunch the analytics aggregates once here so requests stay fast
_genre_counts = (
    movies_df["Genre"].str.split(r",\s*").explode().str.strip()
    .value_counts()
    .reset_index()
    .rename(columns={"Genre": "genre", "count": "count"})
    .to_dict(orient="records")
)

_cluster_info = []
for cid, grp in ratings_df.groupby("cluster_id"):
    user_ids = grp["user_id"].unique().tolist()
    merged = grp.merge(movies_df[["movie_id", "Genre"]], on="movie_id", how="left")
    top_genres = (
        merged["Genre"].str.split(r",\s*").explode().str.strip()
        .value_counts().head(5).index.tolist()
    )
    _cluster_info.append({
        "cluster_id": int(cid),
        "n_users": len(user_ids),
        "top_genres": top_genres,
    })
_cluster_info.sort(key=lambda x: x["cluster_id"])

# k-means tuning numbers from the notebook run (k=2..20), just hardcoded here
_KMEANS_TUNING = [
    {"k": 2,  "inertia": 132.9, "silhouette": 0.2053, "db": 2.0020},
    {"k": 3,  "inertia": 115.3, "silhouette": 0.1915, "db": 1.8426},
    {"k": 4,  "inertia": 102.6, "silhouette": 0.2089, "db": 1.8035},
    {"k": 5,  "inertia": 91.9,  "silhouette": 0.2297, "db": 1.6323},
    {"k": 6,  "inertia": 84.6,  "silhouette": 0.2339, "db": 1.5161},
    {"k": 7,  "inertia": 78.0,  "silhouette": 0.2586, "db": 1.4005},
    {"k": 8,  "inertia": 70.8,  "silhouette": 0.2735, "db": 1.3453},
    {"k": 9,  "inertia": 65.2,  "silhouette": 0.3020, "db": 1.2536},
    {"k": 10, "inertia": 59.8,  "silhouette": 0.3187, "db": 1.2200},
    {"k": 11, "inertia": 52.7,  "silhouette": 0.3487, "db": 1.1701},
    {"k": 12, "inertia": 48.3,  "silhouette": 0.3636, "db": 1.1218},
    {"k": 13, "inertia": 44.3,  "silhouette": 0.3803, "db": 1.0697},
    {"k": 14, "inertia": 40.6,  "silhouette": 0.3913, "db": 1.0207},
    {"k": 15, "inertia": 37.2,  "silhouette": 0.4057, "db": 0.9919},
    {"k": 16, "inertia": 34.9,  "silhouette": 0.3992, "db": 0.9905},
    {"k": 17, "inertia": 33.8,  "silhouette": 0.4026, "db": 0.9797},
    {"k": 18, "inertia": 32.0,  "silhouette": 0.4012, "db": 1.0083},
    {"k": 19, "inertia": 30.9,  "silhouette": 0.4070, "db": 0.9678},
    {"k": 20, "inertia": 29.9,  "silhouette": 0.4071, "db": 0.9789},
]


@app.get("/api/users")
def list_users():
    users = ratings_df["user_id"].unique().tolist()
    return jsonify(users)


@app.get("/api/users/<int:user_id>/recommendations")
def get_recommendations(user_id: int):
    precomputed = recs_df[recs_df["user_id"] == user_id].sort_values("rank")
    if precomputed.empty:
        recs = recommend(user_id, ratings_df, movies_df)
    else:
        movie_ids = precomputed["movie_id"].tolist()
        method = precomputed["method"].iloc[0]
        recs = (
            movies_df[movies_df["movie_id"].isin(movie_ids)][
                ["movie_id", "Series_Title", "Genre", "IMDB_Rating", "Poster_Link"]
            ]
            .assign(method=method)
            .to_dict(orient="records")
        )
    return jsonify(recs)


@app.get("/api/users/<int:user_id>/similar")
def get_similar_users(user_id: int):
    similar = (
        sim_df[sim_df["user_a"] == user_id]
        .sort_values("sim", ascending=False)
        .head(10)
        .rename(columns={"user_b": "similar_user_id"})
        [["similar_user_id", "sim"]]
        .to_dict(orient="records")
    )
    return jsonify(similar)


@app.get("/api/users/<int:user_id>/watched")
def get_watched(user_id: int):
    user_ratings = ratings_df[ratings_df["user_id"] == user_id].sort_values(
        "watched_at", ascending=False
    )
    watched = (
        user_ratings.merge(
            movies_df[["movie_id", "Series_Title", "Genre", "IMDB_Rating", "Poster_Link"]],
            on="movie_id",
        )[["movie_id", "Series_Title", "Genre", "IMDB_Rating", "Poster_Link", "rating", "watched_at"]]
        .to_dict(orient="records")
    )
    return jsonify(watched)


@app.get("/api/movies/<int:movie_id>")
def get_movie(movie_id: int):
    row = movies_df[movies_df["movie_id"] == movie_id]
    if row.empty:
        return jsonify({"error": "Not found"}), 404
    return jsonify(row.iloc[0].to_dict())


# analytics endpoints

@app.get("/api/analytics/overview")
def analytics_overview():
    return jsonify({
        "n_movies": int(len(movies_df)),
        "n_users": int(ratings_df["user_id"].nunique()),
        "n_ratings": int(len(ratings_df)),
        "n_clusters": int(ratings_df["cluster_id"].nunique()),
        "genres": _genre_counts,
    })


@app.get("/api/analytics/kmeans")
def analytics_kmeans():
    return jsonify(_KMEANS_TUNING)


@app.get("/api/analytics/clusters")
def analytics_clusters():
    return jsonify(_cluster_info)


@app.get("/api/analytics/clusters/<int:cluster_id>")
def analytics_cluster_detail(cluster_id: int):
    cluster_ratings = ratings_df[ratings_df["cluster_id"] == cluster_id]
    if cluster_ratings.empty:
        return jsonify({"error": "Not found"}), 404

    users = [{"user_id": int(u)} for u in sorted(cluster_ratings["user_id"].unique())]

    top_movies = (
        cluster_ratings.groupby("movie_id")
        .agg(watch_count=("rating", "count"), avg_rating=("rating", "mean"))
        .reset_index()
        .sort_values("watch_count", ascending=False)
        .head(10)
        .merge(
            movies_df[["movie_id", "Series_Title", "Genre", "Poster_Link"]],
            on="movie_id",
        )
    )
    top_movies["avg_rating"] = top_movies["avg_rating"].round(2)
    top_movies_list = top_movies[
        ["movie_id", "Series_Title", "Genre", "Poster_Link", "watch_count", "avg_rating"]
    ].to_dict(orient="records")

    return jsonify({"users": users, "top_movies": top_movies_list})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
