"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import MovieCard from "../components/MovieCard";
import Settings from "../components/Settings";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styles from "../page.module.css";

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

interface FavoriteMovie {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
  rank: number;
}

// Sortable Favorite Movie Card Component
function SortableFavoriteCard({ movie, rank, onRemove }: { 
  movie: FavoriteMovie; 
  rank: number; 
  onRemove: (rank: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: movie.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={styles.favoriteCard}
    >
      <div className={styles.rankBadge}>{rank}</div>
      
      {/* Draggable area - everything except the remove button */}
      <div 
        className={styles.draggableArea}
        {...attributes}
        {...listeners}
      >
        <div className={styles.dragHandle}>⋮⋮</div>
        <img
          src={movie.poster_path ? `${TMDB_IMAGE_URL}${movie.poster_path}` : "/no-poster.png"}
          alt={movie.title}
          className={styles.favoritePoster}
        />
        <div className={styles.favoriteInfo}>
          <h3>{movie.title}</h3>
          <p>{movie.release_date ? movie.release_date.slice(0, 4) : ""}</p>
        </div>
      </div>
      
      {/* Remove button - outside draggable area */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove(rank);
        }}
        className={styles.removeButton}
        aria-label={`Remove ${movie.title} from favorites`}
      >
        ×
      </button>
    </div>
  );
}

export default function ProfilePage() {
  const [favorites, setFavorites] = useState<FavoriteMovie[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load favorites from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem("userFavorites");
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("userFavorites", JSON.stringify(favorites));
  }, [favorites]);

  // Search movies for the edit modal
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    const timeoutId = setTimeout(() => {
      fetch(
        `${TMDB_API_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchQuery)}&language=en-US&page=1&include_adult=false`,
        { cache: "no-store" }
      )
        .then(res => res.json())
        .then(data => {
          setSearchResults(data.results ? data.results.slice(0, 10) : []);
        })
        .catch(() => setSearchResults([]))
        .finally(() => setSearchLoading(false));
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Add movie to favorites at position 1
  const addToFavorites = (movie: Movie) => {
    // Check if movie is already in favorites
    if (favorites.some(fav => fav.id === movie.id)) {
      showToast("Movie is already in your list!", "error");
      return;
    }
    
    // Add movie to position 1 and shift existing movies down
    const newFavorite: FavoriteMovie = { ...movie, rank: 1 };
    const updatedFavorites = [newFavorite, ...favorites.map(fav => ({ ...fav, rank: fav.rank + 1 }))];
    
    // Keep only top 10 movies (remove the last one if list becomes longer than 10)
    const finalFavorites = updatedFavorites.slice(0, 10);
    
    setFavorites(finalFavorites);
    showToast(`Added "${movie.title}" to the top of your list!`, "success");
    
    // Clear search and close modal
    setSearchQuery("");
    setSearchResults([]);
    setShowEditModal(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setFavorites((items) => {
        const oldIndex = items.findIndex(item => item.id.toString() === active.id);
        const newIndex = items.findIndex(item => item.id.toString() === over?.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        // Update ranks based on new order
        return newItems.map((item, index) => ({ ...item, rank: index + 1 }));
      });
    }
  };

  const removeFromFavorites = (rank: number) => {
    setFavorites(prev => {
      const newFavorites = prev.filter(fav => fav.rank !== rank);
      // Re-rank the remaining movies
      return newFavorites.map((fav, index) => ({ ...fav, rank: index + 1 }));
    });
  };

  const EmptySlot = ({ rank }: { rank: number }) => (
    <div className={styles.emptySlot}>
      <div className={styles.rankBadge}>{rank}</div>
      <div className={styles.emptyPoster}>
        <span>+</span>
      </div>
      <div className={styles.favoriteInfo}>
        <h3>Add Movie</h3>
        <p>Click edit to add</p>
      </div>
    </div>
  );

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/" className={styles.backButton}>
              ← Back to Home
            </Link>
            <h1 className={styles.title}>My Profile</h1>
          </div>
          <Settings />
        </div>

        <div className={styles.profileSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>My Top 10 Movies</h2>
            <button
              onClick={() => setShowEditModal(true)}
              className={styles.editButton}
            >
              Edit List
            </button>
          </div>

          <div className={styles.favoritesContainer}>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={favorites.map(fav => fav.id.toString())}
                strategy={verticalListSortingStrategy}
              >
                <div className={styles.favoritesList}>
                  {Array.from({ length: 10 }, (_, i) => {
                    const rank = i + 1;
                    const movie = favorites.find(fav => fav.rank === rank);
                    return movie ? (
                      <SortableFavoriteCard
                        key={movie.id}
                        movie={movie}
                        rank={rank}
                        onRemove={removeFromFavorites}
                      />
                    ) : (
                      <EmptySlot key={rank} rank={rank} />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>

        {/* Edit Modal */}
        {showEditModal && (
          <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>Add to Your Top 10</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className={styles.closeButton}
                  aria-label="Close modal"
                >
                  ×
                </button>
              </div>
              
              <div className={styles.searchContainer}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for movies..."
                  className={styles.modalSearchInput}
                />
              </div>

              <div className={styles.searchResults}>
                {searchLoading ? (
                  <p>Searching...</p>
                ) : searchResults.length > 0 ? (
                  searchResults.map(movie => (
                    <div
                      key={movie.id}
                      className={styles.searchResult}
                      onClick={() => addToFavorites(movie)}
                    >
                      <img
                        src={movie.poster_path ? `${TMDB_IMAGE_THUMB}${movie.poster_path}` : "/no-poster.png"}
                        alt={movie.title}
                        className={styles.searchResultThumb}
                      />
                      <div className={styles.searchResultInfo}>
                        <h4>{movie.title}</h4>
                        <p>{movie.release_date ? movie.release_date.slice(0, 4) : ""}</p>
                      </div>
                    </div>
                  ))
                ) : searchQuery ? (
                  <p>No movies found.</p>
                ) : (
                  <p>Start typing to search for movies...</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Toast Notification */}
      {toast && (
        <div className={`${styles.toast} ${styles[`toast${toast.type}`]}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
} 