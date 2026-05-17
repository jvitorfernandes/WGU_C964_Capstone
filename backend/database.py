"""SQLite schema creation and query helpers."""
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "data" / "capstone.db"


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    cur = conn.cursor()
    cur.executescript("""
        CREATE TABLE IF NOT EXISTS movies (
            movie_id    INTEGER PRIMARY KEY,
            title       TEXT NOT NULL,
            year        INTEGER,
            runtime     INTEGER,
            genre       TEXT,
            imdb_rating REAL,
            meta_score  REAL,
            director    TEXT,
            star1 TEXT, star2 TEXT, star3 TEXT, star4 TEXT,
            votes       INTEGER,
            gross_log   REAL,
            poster_link TEXT
        );

        CREATE TABLE IF NOT EXISTS users (
            user_id     INTEGER PRIMARY KEY,
            cluster_id  INTEGER
        );

        CREATE TABLE IF NOT EXISTS ratings (
            user_id     INTEGER REFERENCES users(user_id),
            movie_id    INTEGER REFERENCES movies(movie_id),
            rating      REAL,
            watched_at  TEXT,
            split       TEXT CHECK(split IN ('train', 'test')),
            PRIMARY KEY (user_id, movie_id)
        );

        CREATE TABLE IF NOT EXISTS recommendations (
            user_id     INTEGER REFERENCES users(user_id),
            movie_id    INTEGER REFERENCES movies(movie_id),
            score       REAL,
            method      TEXT,
            rank        INTEGER,
            PRIMARY KEY (user_id, movie_id)
        );

        CREATE TABLE IF NOT EXISTS user_similarity (
            user_a  INTEGER REFERENCES users(user_id),
            user_b  INTEGER REFERENCES users(user_id),
            sim     REAL,
            PRIMARY KEY (user_a, user_b)
        );
    """)
    conn.commit()
    conn.close()


def seed_db():
    import pandas as pd

    DATA_DIR = DB_PATH.parent
    conn = get_connection()

    movies = pd.read_csv(DATA_DIR / "movies_clean.csv")
    movies_db = movies[[
        "movie_id", "Series_Title", "Released_Year", "Runtime", "Genre",
        "IMDB_Rating", "Meta_score", "Director",
        "Star1", "Star2", "Star3", "Star4", "No_of_Votes", "Gross_log", "Poster_Link",
    ]].copy()
    movies_db.columns = [
        "movie_id", "title", "year", "runtime", "genre",
        "imdb_rating", "meta_score", "director",
        "star1", "star2", "star3", "star4", "votes", "gross_log", "poster_link",
    ]
    movies_db.to_sql("movies", conn, if_exists="replace", index=False)

    ratings = pd.read_csv(DATA_DIR / "synthetic_users.csv")
    ratings[["user_id", "cluster_id"]].drop_duplicates("user_id").to_sql(
        "users", conn, if_exists="replace", index=False
    )
    ratings[["user_id", "movie_id", "rating", "watched_at"]].assign(split="train").to_sql(
        "ratings", conn, if_exists="replace", index=False
    )

    pd.read_csv(DATA_DIR / "recommendations.csv").to_sql(
        "recommendations", conn, if_exists="replace", index=False
    )
    pd.read_csv(DATA_DIR / "user_similarity.csv").to_sql(
        "user_similarity", conn, if_exists="replace", index=False
    )

    conn.commit()
    conn.close()
    print(f"Seeded {len(movies_db)} movies, {ratings['user_id'].nunique()} users into {DB_PATH}")


if __name__ == "__main__":
    init_db()
    seed_db()
