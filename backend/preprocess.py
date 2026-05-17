"""load, clean, and feature-engineer the imdb top 1000 dataset."""
import re
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.preprocessing import MultiLabelBinarizer, StandardScaler

DATA_DIR = Path(__file__).parent.parent / "data"
RAW_CSV = DATA_DIR / "imdb_top_1000.csv"


def load_raw() -> pd.DataFrame:
    return pd.read_csv(RAW_CSV)


def clean(df: pd.DataFrame) -> pd.DataFrame:
    # drop tv series, they don't have a numeric Released_Year
    df = df[pd.to_numeric(df["Released_Year"], errors="coerce").notna()].copy()
    df["Released_Year"] = df["Released_Year"].astype(int)

    # drop rows missing the stuff we actually need
    df = df.dropna(subset=["Series_Title", "Genre", "IMDB_Rating"])

    # "142 min" -> 142
    df["Runtime"] = df["Runtime"].str.extract(r"(\d+)").astype(int)

    # gross comes in as "$123,456" strings, clean it up then log1p (it's heavily skewed)
    df["Gross"] = (
        df["Gross"]
        .str.replace(r"[$,]", "", regex=True)
        .pipe(pd.to_numeric, errors="coerce")
    )
    # fill missing gross with the genre/decade median
    df["decade"] = (df["Released_Year"] // 10) * 10
    df["primary_genre"] = df["Genre"].str.split(",").str[0].str.strip()
    gross_median = df.groupby(["primary_genre", "decade"])["Gross"].transform("median")
    df["Gross"] = df["Gross"].fillna(gross_median).fillna(df["Gross"].median())
    df["Gross_log"] = np.log1p(df["Gross"])

    # same idea for meta score, fill with the median for that genre
    meta_median = df.groupby("primary_genre")["Meta_score"].transform("median")
    df["Meta_score"] = df["Meta_score"].fillna(meta_median).fillna(df["Meta_score"].median())

    df = df.drop(columns=["decade", "Gross"])
    df = df.reset_index(drop=True)
    df["movie_id"] = df.index
    return df


def _frequency_encode(df: pd.DataFrame, col: str) -> pd.Series:
    freq = df[col].value_counts(normalize=True)
    return df[col].map(freq)


def build_feature_matrix(df: pd.DataFrame):
    """returns (feature_matrix, feature_names, scaler, mlb)."""
    # multi-hot encode genre (movies can have multiple)
    genres = df["Genre"].str.split(r",\s*")
    mlb = MultiLabelBinarizer()
    genre_matrix = mlb.fit_transform(genres)
    genre_df = pd.DataFrame(genre_matrix, columns=[f"genre_{g}" for g in mlb.classes_])

    # frequency-encode director and cast - how common is this person overall
    for col in ["Director", "Star1", "Star2", "Star3", "Star4"]:
        df[f"fe_{col}"] = _frequency_encode(df, col)

    numeric_cols = [
        "IMDB_Rating", "Meta_score", "Runtime", "Gross_log",
        "fe_Director", "fe_Star1", "fe_Star2", "fe_Star3", "fe_Star4",
    ]
    numeric_df = df[numeric_cols].reset_index(drop=True)
    combined = pd.concat([numeric_df, genre_df.reset_index(drop=True)], axis=1)

    scaler = StandardScaler()
    feature_matrix = scaler.fit_transform(combined)
    return feature_matrix, list(combined.columns), scaler, mlb


def run():
    df = load_raw()
    df = clean(df)
    feature_matrix, feature_names, scaler, mlb = build_feature_matrix(df)
    df.to_csv(DATA_DIR / "movies_clean.csv", index=False)
    np.save(DATA_DIR / "movie_features.npy", feature_matrix)
    print(f"Preprocessed {len(df)} movies, {feature_matrix.shape[1]} features")
    return df, feature_matrix, feature_names, scaler, mlb


if __name__ == "__main__":
    run()
