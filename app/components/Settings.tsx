"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import styles from '../page.module.css';

export default function Settings() {
  const { theme, toggleTheme, isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    toggleTheme();
    setIsOpen(false);
  };

  return (
    <div className={styles.settingsContainer} ref={dropdownRef}>
      <button
        className={styles.settingsButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Settings"
        aria-expanded={isOpen}
      >
        ⚙️
      </button>
      
      {isOpen && (
        <div className={styles.settingsDropdown}>
          <div className={styles.settingsItem}>
            <span className={styles.settingsLabel}>Theme</span>
            <button
              className={styles.themeToggle}
              onClick={handleToggle}
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              <span className={styles.themeToggleText}>
                {isDark ? '☀️' : '🌙'} {isDark ? 'Light Mode' : 'Dark Mode'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 