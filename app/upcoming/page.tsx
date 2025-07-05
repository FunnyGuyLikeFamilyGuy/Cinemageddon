"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import MovieCard from "../components/MovieCard";
import styles from "../page.module.css";

const TMDB_API_KEY = "a9d117d81bba364d4c85cbaabc941853";
const TMDB_API_URL = "https://api.themoviedb.org/3";
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

export default function UpcomingPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchUpcoming();
  }, []);

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Add movie to favorites
  const addToFavorites = (movie: Movie) => {
    const savedFavorites = localStorage.getItem("userFavorites");
    const favorites: FavoriteMovie[] = savedFavorites ? JSON.parse(savedFavorites) : [];
    if (favorites.some(fav => fav.id === movie.id)) {
      showToast("Movie is already in your list!", "error");
      return;
    }
    // Insert at the top, push others down, remove last if full
    const newFavorite: FavoriteMovie = { ...movie, rank: 1 };
    const updatedFavorites = [newFavorite, ...favorites.map(fav => ({ ...fav, rank: fav.rank + 1 }))];
    const finalFavorites = updatedFavorites.slice(0, 10);
    localStorage.setItem("userFavorites", JSON.stringify(finalFavorites));
    showToast(`Added "${movie.title}" to the top of your list!`, "success");
  };

  const fetchUpcoming = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${TMDB_API_URL}/movie/upcoming?api_key=${TMDB_API_KEY}&language=en-US&page=1`, { cache: "no-store" });
      const data = await res.json();
      if (data.results) {
        setMovies(data.results);
      } else {
        setMovies([]);
        setError("No movies found.");
      }
    } catch (err) {
      setError("Failed to fetch movies.");
      setMovies([]);
    }
    setLoading(false);
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <Link href="/" className={styles.backButton}>
            ← Back to Home
          </Link>
          <h1 className={styles.title}>Upcoming Releases</h1>
        </div>
        {error && <p className={styles.error}>{error}</p>}
        {loading ? (
          <div className={styles.loadingGrid}>
            {[...Array(12)].map((_, i) => (
              <div key={i} className={styles.loadingCard}></div>
            ))}
          </div>
        ) : (
          <div className={styles.movieGrid} style={{ flexWrap: 'wrap' }}>
            {movies.map(movie => (
              <MovieCard 
                key={movie.id} 
                movie={movie} 
                showAddButton={true}
                onAddToFavorites={addToFavorites}
              />
            ))}
          </div>
        )}
      </main>
      <footer className={styles.footer}>
        <p>Powered by TMDB API</p>
      </footer>
      
      {/* Toast Notification */}
      {toast && (
        <div className={`${styles.toast} ${styles[`toast${toast.type}`]}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
} 