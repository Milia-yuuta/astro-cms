// This file defines the database schema for the D1 database

export interface Manga {
  id: number
  title: string
  author: string
  publisher?: string
  description?: string
  cover_image_url?: string
  release_date?: string
  overall_rating: number
  story_rating?: number
  art_rating?: number
  characters_rating?: number
  created_at: string
  updated_at: string
}

export interface Category {
  id: number
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface MangaCategory {
  manga_id: number
  category_id: number
}

export interface Market {
  id: number
  name: string
  website: string
  created_at: string
  updated_at: string
}

export interface MangaMarket {
  manga_id: number
  market_id: number
  url: string
}

// SQL to create the tables
export const createTablesSql = `
-- Manga table
CREATE TABLE IF NOT EXISTS mangas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  publisher TEXT,
  description TEXT,
  cover_image_url TEXT,
  release_date TEXT,
  overall_rating REAL NOT NULL DEFAULT 0,
  story_rating REAL,
  art_rating REAL,
  characters_rating REAL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Manga-Category junction table
CREATE TABLE IF NOT EXISTS manga_categories (
  manga_id INTEGER NOT NULL,
  category_id INTEGER NOT NULL,
  PRIMARY KEY (manga_id, category_id),
  FOREIGN KEY (manga_id) REFERENCES mangas (id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
);

-- Markets table
CREATE TABLE IF NOT EXISTS markets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  website TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Manga-Market junction table
CREATE TABLE IF NOT EXISTS manga_markets (
  manga_id INTEGER NOT NULL,
  market_id INTEGER NOT NULL,
  url TEXT NOT NULL,
  PRIMARY KEY (manga_id, market_id),
  FOREIGN KEY (manga_id) REFERENCES mangas (id) ON DELETE CASCADE,
  FOREIGN KEY (market_id) REFERENCES markets (id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mangas_title ON mangas (title);
CREATE INDEX IF NOT EXISTS idx_mangas_author ON mangas (author);
CREATE INDEX IF NOT EXISTS idx_mangas_overall_rating ON mangas (overall_rating);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories (name);
CREATE INDEX IF NOT EXISTS idx_markets_name ON markets (name);
CREATE INDEX IF NOT EXISTS idx_manga_categories_manga_id ON manga_categories (manga_id);
CREATE INDEX IF NOT EXISTS idx_manga_categories_category_id ON manga_categories (category_id);
CREATE INDEX IF NOT EXISTS idx_manga_markets_manga_id ON manga_markets (manga_id);
CREATE INDEX IF NOT EXISTS idx_manga_markets_market_id ON manga_markets (market_id);
`

