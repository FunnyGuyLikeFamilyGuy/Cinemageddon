"use client";
import React, { useEffect, useState } from "react";
import styles from "../page.module.css";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Settings from "../components/Settings";

const TMDB_API_KEY = "a9d117d81bba364d4c85cbaabc941853";
const TMDB_API_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_URL = "https://image.tmdb.org/t/p/w500";
const TMDB_IMAGE_CAST = "https://image.tmdb.org/t/p/w185";

interface MovieDetail {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  credits?: {
    cast: Array<{ id: number; name: string; character: string; profile_path: string | null }>;
    crew: Array<{ job: string; name: string }>;
  };
  vote_average?: number;
}

export default function MovieDetailPage() {
  const params = useParams();
  const router = useRouter();
  const movieId = params?.imdbID;
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!movieId) return;
    setLoading(true);
    setError("");
    fetch(
      `${TMDB_API_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&append_to_response=credits&language=en-US`,
      { cache: "no-store" }
    )
      .then(res => res.json())
      .then(data => {
        if (data && !data.status_code) {
          setMovie(data);
        } else {
          setError("Movie not found.");
        }
      })
      .catch(() => setError("Failed to fetch movie details."))
      .finally(() => setLoading(false));
  }, [movieId]);

  if (loading) {
    return (
      <div className={styles.detailContainer}>
        <p>Loading...</p>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className={styles.detailContainer}>
        <p>{error || "Movie not found."}</p>
        <Link href="/" className={styles.backButton}>← Back to Home</Link>
      </div>
    );
  }

  // Get director(s)
  const directors = movie.credits?.crew.filter(c => c.job === "Director").map(d => d.name).join(", ") || "N/A";
  // Get top 12 cast
  const cast = movie.credits?.cast.slice(0, 12) || [];

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.header}>
          <Link href="/" className={styles.backButton}>← Back to Home</Link>
          <Settings />
        </div>
        <div className={styles.detailFlexRow}>
          <img
            src={movie.poster_path ? `${TMDB_IMAGE_URL}${movie.poster_path}` : "/no-poster.png"}
            alt={movie.title}
            className={styles.detailPosterSmall}
          />
          <div className={styles.detailInfoCol}>
            <h1 className={styles.detailTitle}>{movie.title}</h1>
            <div className={styles.movieRating}>
              <span role="img" aria-label="star">⭐</span> {movie.vote_average?.toFixed(1)} / 10
            </div>
            <div className={styles.detailMeta}>
              <span>{movie.release_date ? movie.release_date.slice(0, 4) : ""}</span>
            </div>
            <div className={styles.detailPlot}>{movie.overview}</div>
            <div><span className={styles.detailLabel}>Director:</span> {directors}</div>
          </div>
        </div>
        <div className={styles.castSection}>
          <div className={styles.castTitle}>Cast</div>
          <div className={styles.castList}>
            {cast.map(actor => (
              <div
                key={actor.id}
                className={styles.castCard}
                tabIndex={0}
                title={actor.name}
                onClick={() => actor.profile_path && window.open(`https://www.themoviedb.org/person/${actor.id}`, "_blank")}
                onKeyDown={e => {
                  if (e.key === "Enter" && actor.profile_path) window.open(`https://www.themoviedb.org/person/${actor.id}`, "_blank");
                }}
              >
                <img
                  src={actor.profile_path ? `${TMDB_IMAGE_CAST}${actor.profile_path}` : "/no-poster.png"}
                  alt={actor.name}
                  className={styles.castImg}
                />
                <div className={styles.castName}>{actor.name}</div>
                <div className={styles.castChar}>{actor.character ? `as ${actor.character}` : ""}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
} 