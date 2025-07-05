"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import styles from "../../page.module.css";

const OMDB_API_KEY = "thewdb"; // Demo key, replace with your own for production
const OMDB_API_URL = "https://www.omdbapi.com/";

interface Movie {
  imdbID: string;
  Title: string;
  Year: string;
  Poster: string;
  Type: string;
}

export default function GenrePage({ params }: { params: { genre: string } }) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMoviesByGenre(params.genre);
  }, [params.genre]);

  const fetchMoviesByGenre = async (genre: string) => {
    setLoading(true);
    setError("");
    
    try {
      // Since OMDB API doesn't have direct genre search, we'll use popular movies
      // and filter by genre in the frontend, or use genre-related search terms
      const searchTerms = {
        action: "action movie",
        adventure: "adventure movie", 
        animation: "animated movie",
        biography: "biography movie",
        comedy: "comedy movie",
        crime: "crime movie",
        documentary: "documentary",
        drama: "drama movie",
        family: "family movie",
        fantasy: "fantasy movie",
        "film-noir": "film noir",
        history: "historical movie",
        horror: "horror movie",
        music: "musical movie",
        musical: "musical movie",
        mystery: "mystery movie",
        romance: "romance movie",
        "sci-fi": "science fiction movie",
        sport: "sports movie",
        thriller: "thriller movie",
        war: "war movie",
        western: "western movie"
      };

      const searchTerm = searchTerms[genre as keyof typeof searchTerms] || genre;
      const res = await fetch(`${OMDB_API_URL}?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(searchTerm)}`);
      const data = await res.json();
      
      if (data.Response === "True") {
        setMovies(data.Search || []);
      } else {
        setMovies([]);
        setError(data.Error || "No movies found for this genre.");
      }
    } catch (err) {
      setError("Failed to fetch movies.");
      setMovies([]);
    }
    
    setLoading(false);
  };

  const MovieCard = ({ movie }: { movie: Movie }) => (
    <Link href={`/${movie.imdbID}`} className={styles.movieCard}>
      <img
        src={movie.Poster !== "N/A" ? movie.Poster : "/no-poster.png"}
        alt={movie.Title}
        className={styles.moviePoster}
      />
      <div className={styles.movieInfo}>
        <h3>{movie.Title}</h3>
        <p>{movie.Year}</p>
      </div>
    </Link>
  );

  const genreName = params.genre.charAt(0).toUpperCase() + params.genre.slice(1).replace('-', ' ');

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <Link href="/" className={styles.backButton}>
            ← Back to Home
          </Link>
          <h1 className={styles.title}>{genreName} Movies</h1>
        </div>
        
        {error && <p className={styles.error}>{error}</p>}
        
        {loading ? (
          <div className={styles.loadingGrid}>
            {[...Array(12)].map((_, i) => (
              <div key={i} className={styles.loadingCard}></div>
            ))}
          </div>
        ) : (
          <div className={styles.movieGrid}>
            {movies.map(movie => (
              <MovieCard key={movie.imdbID} movie={movie} />
            ))}
          </div>
        )}
      </main>
      
      <footer className={styles.footer}>
        <p>Powered by OMDB API</p>
      </footer>
    </div>
  );
} 