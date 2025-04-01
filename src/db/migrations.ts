import { createTablesSql } from "./schema"
import type { D1Database } from "@cloudflare/workers-types"

export async function initializeDatabase(db: D1Database) {
  try {
    // Create tables
    await db.exec(createTablesSql)

    // Seed initial data if needed
    const categoriesCount = await db.prepare("SELECT COUNT(*) as count FROM categories").first<{ count: number }>()

    if (categoriesCount && categoriesCount.count === 0) {
      // Seed categories
      const categories = [
        "Shonen",
        "Shojo",
        "Seinen",
        "Josei",
        "Adventure",
        "Action",
        "Comedy",
        "Drama",
        "Fantasy",
        "Horror",
        "Mystery",
        "Romance",
        "Sci-Fi",
        "Slice of Life",
        "Sports",
        "Supernatural",
        "Thriller",
        "Historical",
        "Mecha",
        "Psychological",
      ]

      const now = new Date().toISOString()

      for (const category of categories) {
        await db
          .prepare("INSERT INTO categories (name, description, created_at, updated_at) VALUES (?, ?, ?, ?)")
          .bind(category, `${category} manga`, now, now)
          .run()
      }

      // Seed markets
      const markets = [
        { name: "Amazon", website: "https://amazon.com" },
        { name: "Viz Media", website: "https://viz.com" },
        { name: "Crunchyroll", website: "https://crunchyroll.com" },
        { name: "BookWalker", website: "https://bookwalker.jp" },
        { name: "Comixology", website: "https://comixology.com" },
        { name: "Kinokuniya", website: "https://kinokuniya.com" },
        { name: "Barnes & Noble", website: "https://barnesandnoble.com" },
        { name: "Right Stuf Anime", website: "https://rightstufanime.com" },
      ]

      for (const market of markets) {
        await db
          .prepare("INSERT INTO markets (name, website, created_at, updated_at) VALUES (?, ?, ?, ?)")
          .bind(market.name, market.website, now, now)
          .run()
      }
    }

    return { success: true, message: "Database initialized successfully" }
  } catch (error) {
    console.error("Error initializing database:", error)
    return { success: false, message: `Database initialization failed: ${error.message}` }
  }
}

