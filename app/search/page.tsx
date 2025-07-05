"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import MovieCard from "../components/MovieCard";
import Settings from "../components/Settings";
import styles from "../page.module.css";

const TMDB_API_KEY = "a9d117d81bba364d4c85cbaabc941853";
const TMDB_API_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_THUMB = "https://image.tmdb.org/t/p/w92";

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

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("query") || "";
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    setError("");
    fetch(`${TMDB_API_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US&page=1&include_adult=false`, { cache: "no-store" })
      .then(res => res.json())
      .then(data => {
        setMovies(data.results || []);
      })
      .catch(() => setError("Failed to fetch search results."))
      .finally(() => setLoading(false));
  }, [query]);

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

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/" className={styles.backButton}>
              ← Back to Home
            </Link>
            <h1 className={styles.title}>
              Search Results{query ? ` for "${query}"` : ""}
            </h1>
          </div>
          <Settings />
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
            {movies.length === 0 && query && !loading ? (
              <p style={{ color: '#aaa', padding: '32px', textAlign: 'center', width: '100%' }}>
                No results found.
              </p>
            ) : (
              movies.map(movie => (
                <MovieCard 
                  key={movie.id} 
                  movie={movie} 
                  showAddButton={true}
                  onAddToFavorites={addToFavorites}
                />
              ))
            )}
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

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className={styles.page}>
        <main className={styles.main}>
          <div className={styles.header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Link href="/" className={styles.backButton}>
                ← Back to Home
              </Link>
              <h1 className={styles.title}>Search Results</h1>
            </div>
            <Settings />
          </div>
          <div className={styles.loadingGrid}>
            {[...Array(12)].map((_, i) => (
              <div key={i} className={styles.loadingCard}></div>
            ))}
          </div>
        </main>
        <footer className={styles.footer}>
          <p>Powered by TMDB API</p>
        </footer>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
} 