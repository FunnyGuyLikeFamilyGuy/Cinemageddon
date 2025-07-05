"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import Settings from "./components/Settings";

const TMDB_API_KEY = "a9d117d81bba364d4c85cbaabc941853";
const TMDB_API_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_URL = "https://image.tmdb.org/t/p/w500";
const TMDB_IMAGE_THUMB = "https://image.tmdb.org/t/p/w92";

interface Movie {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
  vote_average: number;
  overview: string;
}

const sectionConfigs = [
  {
    title: "Trending Now",
    endpoint: `/trending/movie/week`,
    showMore: "/trending"
  },
  {
    title: "Now Playing in Theaters",
    endpoint: `/movie/now_playing`,
    showMore: "/now-playing"
  },
  {
    title: "Top Rated Movies",
    endpoint: `/movie/top_rated`,
    showMore: "/top-rated"
  },
  {
    title: "Upcoming Releases",
    endpoint: `/movie/upcoming`,
    showMore: "/upcoming"
  },
  {
    title: "Popular Right Now",
    endpoint: `/movie/popular`,
    showMore: "/popular"
  }
];

export default function Home() {
  const [sections, setSections] = useState<{ [key: string]: Movie[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Search state
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  let debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchAllSections();
    // eslint-disable-next-line
  }, []);

  // Debounced search
  useEffect(() => {
    if (!search) {
      setSearchResults([]);
      setShowDropdown(false);
      setHighlighted(-1);
      return;
    }
    setSearchLoading(true);
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      fetch(
        `${TMDB_API_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(search)}&language=en-US&page=1&include_adult=false`,
        { cache: "no-store" }
      )
        .then(res => res.json())
        .then(data => {
          setSearchResults(data.results ? data.results.slice(0, 7) : []);
          setShowDropdown(true);
          setHighlighted(-1);
        })
        .catch(() => setSearchResults([]))
        .finally(() => setSearchLoading(false));
    }, 300);
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [search]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        searchRef.current &&
        !searchRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleSuggestionClick = (movie: Movie) => {
    setShowDropdown(false);
    setSearch("");
    router.push(`/search?query=${encodeURIComponent(movie.title)}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowDropdown(false);
    if (search.trim()) {
      router.push(`/search?query=${encodeURIComponent(search.trim())}`);
      setSearch("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || searchResults.length === 0) return;
    if (e.key === "ArrowDown") {
      setHighlighted(h => (h < searchResults.length - 1 ? h + 1 : 0));
    } else if (e.key === "ArrowUp") {
      setHighlighted(h => (h > 0 ? h - 1 : searchResults.length - 1));
    } else if (e.key === "Enter") {
      if (highlighted >= 0 && highlighted < searchResults.length) {
        handleSuggestionClick(searchResults[highlighted]);
      } else {
        handleSearchSubmit(e);
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  const fetchAllSections = async () => {
    setLoading(true);
    setError("");
    try {
      const results: { [key: string]: Movie[] } = {};
      await Promise.all(
        sectionConfigs.map(async (section) => {
          const res = await fetch(
            `${TMDB_API_URL}${section.endpoint}?api_key=${TMDB_API_KEY}&language=en-US&page=1`,
            { cache: "no-store" }
          );
          const data = await res.json();
          results[section.title] = data.results ? data.results.slice(0, 12) : [];
        })
      );
      setSections(results);
    } catch (err) {
      setError("Failed to fetch movies from TMDB.");
    }
    setLoading(false);
  };

  const MovieCard = ({ movie, showAddButton, onAddToFavorites }: { movie: Movie; showAddButton: boolean; onAddToFavorites: (movie: Movie) => void }) => (
    <Link href={`/${movie.id}`} className={styles.movieCard}>
      <img
        src={movie.poster_path ? `${TMDB_IMAGE_URL}${movie.poster_path}` : "/no-poster.png"}
        alt={movie.title}
        className={styles.moviePoster}
      />
      <div className={styles.movieInfo}>
        <h3>{movie.title}</h3>
        <p>{movie.release_date ? movie.release_date.slice(0, 4) : ""}</p>
      </div>
      {showAddButton && (
        <button
          className={styles.addButton}
          onClick={(e) => {
            e.preventDefault();
            onAddToFavorites(movie);
          }}
        >
          +
        </button>
      )}
    </Link>
  );

  // Add movie to favorites
  const addToFavorites = (movie: Movie) => {
    const savedFavorites = localStorage.getItem("userFavorites");
    const favorites: any[] = savedFavorites ? JSON.parse(savedFavorites) : [];
    if (favorites.some(fav => fav.id === movie.id)) {
      setToast({ message: "Movie is already in your list!", type: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    if (favorites.length >= 10) {
      setToast({ message: "List is full — remove a movie to add another", type: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    const newFavorite = { ...movie, rank: favorites.length + 1 };
    const updatedFavorites = [...favorites, newFavorite];
    localStorage.setItem("userFavorites", JSON.stringify(updatedFavorites));
    setToast({ message: `Added \"${movie.title}\" to your list!`, type: "success" });
    setTimeout(() => setToast(null), 3000);
  };

  function MovieSection({ title, movies, loading, showMore }: { title: string; movies: Movie[]; loading: boolean; showMore: string }) {
    const rowRef = useRef<HTMLDivElement>(null);
    const scrollBy = (dir: "left" | "right") => {
      if (rowRef.current) {
        const scrollAmount = rowRef.current.offsetWidth * 0.7;
        rowRef.current.scrollBy({
          left: dir === "left" ? -scrollAmount : scrollAmount,
          behavior: "smooth"
        });
      }
    };
    return (
      <section className={styles.movieSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{title}</h2>
          <div className={styles.carouselArrows}>
            <button
              className={styles.carouselArrow}
              aria-label="Scroll left"
              onClick={() => scrollBy("left")}
              tabIndex={0}
            >
              <span className={styles.chevron}>&#8592;</span>
            </button>
            <button
              className={styles.carouselArrow}
              aria-label="Scroll right"
              onClick={() => scrollBy("right")}
              tabIndex={0}
            >
              <span className={styles.chevron}>&#8594;</span>
            </button>
            <Link href={showMore} className={styles.showMoreBtn} style={{ marginLeft: 16 }}>
              Show More
            </Link>
          </div>
        </div>
        {loading ? (
          <div className={styles.loadingGrid} ref={rowRef}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className={styles.loadingCard}></div>
            ))}
          </div>
        ) : (
          <div className={styles.movieGrid} ref={rowRef}>
            {movies.map(movie => (
              <MovieCard key={movie.id} movie={movie} showAddButton={false} onAddToFavorites={addToFavorites} />
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {/* Header with Profile and Settings */}
        <div className={styles.header}>
          <Link href="/profile" className={styles.profileButton}>
            👤 Profile
          </Link>
          <Settings />
        </div>
        
        {/* Search Bar */}
        <form className={styles.searchForm} onSubmit={handleSearchSubmit} autoComplete="off">
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={handleSearchChange}
            onFocus={() => search && setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search movies..."
            className={styles.searchInput}
            aria-label="Search movies"
            autoComplete="off"
          />
          <button type="submit" className={styles.searchButton} aria-label="Search">
            🔍
          </button>
          {showDropdown && searchResults.length > 0 && (
            <div className={styles.searchDropdown} ref={dropdownRef}>
              {searchResults.map((movie, idx) => (
                <div
                  key={movie.id}
                  className={
                    styles.suggestion + (highlighted === idx ? " " + styles.suggestionActive : "")
                  }
                  onMouseDown={() => handleSuggestionClick(movie)}
                  tabIndex={-1}
                >
                  <img
                    src={movie.poster_path ? `${TMDB_IMAGE_THUMB}${movie.poster_path}` : "/no-poster.png"}
                    alt={movie.title}
                    className={styles.suggestionThumb}
                  />
                  <span className={styles.suggestionTitle}>{movie.title}</span>
                  {movie.release_date && (
                    <span className={styles.suggestionYear}>{movie.release_date.slice(0, 4)}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </form>
        <h1 className={styles.title}>Cinemageddon</h1>
        {error && <p className={styles.error}>{error}</p>}
        {sectionConfigs.map(section => (
          <MovieSection
            key={section.title}
            title={section.title}
            movies={sections[section.title] || []}
            loading={loading}
            showMore={section.showMore}
          />
        ))}
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
