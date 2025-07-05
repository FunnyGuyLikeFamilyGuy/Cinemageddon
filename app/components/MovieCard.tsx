"use client";
import React, { useState } from "react";
import Link from "next/link";
import styles from "../page.module.css";

const TMDB_IMAGE_URL = "https://image.tmdb.org/t/p/w500";

interface Movie {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
  vote_average: number;
  overview: string;
}

interface FavoriteMovie {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
  rank: number;
}

interface MovieCardProps {
  movie: Movie;
  showAddButton?: boolean;
  onAddToFavorites?: (movie: Movie) => void;
}

export default function MovieCard({ movie, showAddButton = false, onAddToFavorites }: MovieCardProps) {
  const handleAddToFavorites = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToFavorites) {
      onAddToFavorites(movie);
    }
  };

  if (showAddButton) {
    return (
      <div className={styles.movieCard}>
        <Link href={`/${movie.id}`} className={styles.movieLink}>
          <img
            src={movie.poster_path ? `${TMDB_IMAGE_URL}${movie.poster_path}` : "/no-poster.png"}
            alt={movie.title}
            className={styles.moviePoster}
          />
          <div className={styles.movieInfo}>
            <h3>{movie.title}</h3>
            <div className={styles.movieRating}>
              <span role="img" aria-label="star">⭐</span> {movie.vote_average?.toFixed(1)} / 10
            </div>
            <p>{movie.release_date ? movie.release_date.slice(0, 4) : ""}</p>
          </div>
        </Link>
        <button
          onClick={handleAddToFavorites}
          className={styles.addToFavoritesButton}
          aria-label={`Add ${movie.title} to favorites`}
        >
          +
        </button>
      </div>
    );
  }

  return (
    <Link href={`/${movie.id}`} className={styles.movieCard}>
      <img
        src={movie.poster_path ? `${TMDB_IMAGE_URL}${movie.poster_path}` : "/no-poster.png"}
        alt={movie.title}
        className={styles.moviePoster}
      />
      <div className={styles.movieInfo}>
        <h3>{movie.title}</h3>
        <div className={styles.movieRating}>
          <span role="img" aria-label="star">⭐</span> {movie.vote_average?.toFixed(1)} / 10
        </div>
        <p>{movie.release_date ? movie.release_date.slice(0, 4) : ""}</p>
      </div>
    </Link>
  );
} 