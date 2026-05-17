"""generate synthetic users with genre/director preference biases."""
import datetime
import numpy as np
import pandas as pd
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"
N_USERS = 500
SEED = 42


def generate_users(movies_df: pd.DataFrame, seed: int = SEED) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    genres_available = (
        movies_df["Genre"].str.split(r",\s*").explode().str.strip().unique().tolist()
    )

    records = []
    for user_id in range(N_USERS):
        n_watched = int(rng.integers(20, 101))

        # give each user 1-2 favorite genres/directors, keeps the clusters separable later
        preferred_genres = rng.choice(genres_available, size=rng.integers(1, 3), replace=False)
        preferred_directors = rng.choice(movies_df["Director"].unique(), size=rng.integers(1, 3), replace=False)

        # bump up the odds of watching stuff that matches their taste
        weights = np.ones(len(movies_df)) * 0.05  # everything else starts at a low baseline
        for g in preferred_genres:
            weights[movies_df["Genre"].str.contains(g, regex=False)] *= 20.0
        for d in preferred_directors:
            weights[movies_df["Director"] == d] *= 5.0
        weights /= weights.sum()

        movie_idxs = rng.choice(len(movies_df), size=n_watched, replace=False, p=weights)

        # spread their watch history over a random 1-year window in the last 2 years
        today = datetime.date.today()
        window_start_offset = int(rng.integers(0, 365))        # how far back the window starts
        day_offsets = sorted(rng.choice(365, size=n_watched, replace=False).tolist())
        base_date = today - datetime.timedelta(days=window_start_offset + 365)

        for i, idx in enumerate(movie_idxs):
            # rate it higher if it matches their taste, lower if not
            base = 3.7
            bonus = 1.2 if any(g in movies_df.iloc[idx]["Genre"] for g in preferred_genres) else -0.5
            rating = float(np.clip(rng.normal(base + bonus, 0.7), 1, 5))
            watched_at = (base_date + datetime.timedelta(days=day_offsets[i])).isoformat()
            records.append({
                "user_id": user_id,
                "movie_id": int(movies_df.iloc[idx]["movie_id"]),
                "rating": round(rating, 1),
                "watched_at": watched_at,
            })

    return pd.DataFrame(records)


def run():
    movies_df = pd.read_csv(DATA_DIR / "movies_clean.csv")
    ratings_df = generate_users(movies_df)
    ratings_df.to_csv(DATA_DIR / "synthetic_users.csv", index=False)
    print(f"Generated {ratings_df['user_id'].nunique()} users, {len(ratings_df)} ratings")
    return ratings_df


if __name__ == "__main__":
    run()
