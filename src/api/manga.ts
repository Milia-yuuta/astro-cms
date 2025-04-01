import type { Manga } from "../db/schema"

export async function getAllManga(db: D1Database, page = 1, limit = 10, search = "") {
  const offset = (page - 1) * limit

  try {
    let query = `
      SELECT 
        m.*, 
        GROUP_CONCAT(DISTINCT c.name) as categories,
        COUNT(DISTINCT mm.market_id) as market_count
      FROM mangas m
      LEFT JOIN manga_categories mc ON m.id = mc.manga_id
      LEFT JOIN categories c ON mc.category_id = c.id
      LEFT JOIN manga_markets mm ON m.id = mm.manga_id
    `

    const params = []

    if (search) {
      query += ` WHERE m.title LIKE ? OR m.author LIKE ? `
      params.push(`%${search}%`, `%${search}%`)
    }

    query += `
      GROUP BY m.id
      ORDER BY m.updated_at DESC
      LIMIT ? OFFSET ?
    `

    params.push(limit, offset)

    const mangaList = await db
      .prepare(query)
      .bind(...params)
      .all()

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as total FROM mangas ${search ? `WHERE title LIKE ? OR author LIKE ?` : ""}`
    const countParams = search ? [`%${search}%`, `%${search}%`] : []
    const countResult = await db
      .prepare(countQuery)
      .bind(...countParams)
      .first<{ total: number }>()

    return {
      data: mangaList.results,
      pagination: {
        total: countResult?.total || 0,
        page,
        limit,
        totalPages: Math.ceil((countResult?.total || 0) / limit),
      },
    }
  } catch (error) {
    console.error("Error fetching manga:", error)
    throw new Error(`Failed to fetch manga: ${error.message}`)
  }
}

export async function getMangaById(db: D1Database, id: number) {
  try {
    // Get manga details
    const manga = await db
      .prepare(`
      SELECT * FROM mangas WHERE id = ?
    `)
      .bind(id)
      .first<Manga>()

    if (!manga) {
      return null
    }

    // Get categories
    const categories = await db
      .prepare(`
      SELECT c.id, c.name 
      FROM categories c
      JOIN manga_categories mc ON c.id = mc.category_id
      WHERE mc.manga_id = ?
    `)
      .bind(id)
      .all()

    // Get markets
    const markets = await db
      .prepare(`
      SELECT m.id, m.name, mm.url
      FROM markets m
      JOIN manga_markets mm ON m.id = mm.market_id
      WHERE mm.manga_id = ?
    `)
      .bind(id)
      .all()

    return {
      ...manga,
      categories: categories.results,
      markets: markets.results,
    }
  } catch (error) {
    console.error(`Error fetching manga with ID ${id}:`, error)
    throw new Error(`Failed to fetch manga: ${error.message}`)
  }
}

export async function createManga(
  db: D1Database,
  mangaData: Omit<Manga, "id" | "created_at" | "updated_at">,
  categories: number[],
  markets: { id: number; url: string }[],
) {
  const now = new Date().toISOString()

  try {
    // Start a transaction
    await db.exec("BEGIN TRANSACTION")

    // Insert manga
    const result = await db
      .prepare(`
      INSERT INTO mangas (
        title, author, publisher, description, cover_image_url, release_date,
        overall_rating, story_rating, art_rating, characters_rating,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
      .bind(
        mangaData.title,
        mangaData.author,
        mangaData.publisher || null,
        mangaData.description || null,
        mangaData.cover_image_url || null,
        mangaData.release_date || null,
        mangaData.overall_rating,
        mangaData.story_rating || null,
        mangaData.art_rating || null,
        mangaData.characters_rating || null,
        now,
        now,
      )
      .run()

    const mangaId = result.meta?.last_row_id

    if (!mangaId) {
      throw new Error("Failed to insert manga")
    }

    // Insert categories
    for (const categoryId of categories) {
      await db
        .prepare(`
        INSERT INTO manga_categories (manga_id, category_id)
        VALUES (?, ?)
      `)
        .bind(mangaId, categoryId)
        .run()
    }

    // Insert markets
    for (const market of markets) {
      await db
        .prepare(`
        INSERT INTO manga_markets (manga_id, market_id, url)
        VALUES (?, ?, ?)
      `)
        .bind(mangaId, market.id, market.url)
        .run()
    }

    // Commit transaction
    await db.exec("COMMIT")

    return {
      id: mangaId,
      ...mangaData,
      created_at: now,
      updated_at: now,
    }
  } catch (error) {
    // Rollback transaction on error
    await db.exec("ROLLBACK")
    console.error("Error creating manga:", error)
    throw new Error(`Failed to create manga: ${error.message}`)
  }
}

export async function updateManga(
  db: D1Database,
  id: number,
  mangaData: Partial<Manga>,
  categories?: number[],
  markets?: { id: number; url: string }[],
) {
  const now = new Date().toISOString()

  try {
    // Start a transaction
    await db.exec("BEGIN TRANSACTION")

    // Build update query dynamically based on provided fields
    const fields: string[] = []
    const values: any[] = []

    Object.entries(mangaData).forEach(([key, value]) => {
      if (key !== "id" && key !== "created_at" && key !== "updated_at") {
        fields.push(`${key} = ?`)
        values.push(value === undefined ? null : value)
      }
    })

    // Always update the updated_at timestamp
    fields.push("updated_at = ?")
    values.push(now)

    // Add the ID for the WHERE clause
    values.push(id)

    // Update manga
    await db
      .prepare(`
      UPDATE mangas SET ${fields.join(", ")} WHERE id = ?
    `)
      .bind(...values)
      .run()

    // Update categories if provided
    if (categories) {
      // Delete existing categories
      await db
        .prepare(`
        DELETE FROM manga_categories WHERE manga_id = ?
      `)
        .bind(id)
        .run()

      // Insert new categories
      for (const categoryId of categories) {
        await db
          .prepare(`
          INSERT INTO manga_categories (manga_id, category_id)
          VALUES (?, ?)
        `)
          .bind(id, categoryId)
          .run()
      }
    }

    // Update markets if provided
    if (markets) {
      // Delete existing markets
      await db
        .prepare(`
        DELETE FROM manga_markets WHERE manga_id = ?
      `)
        .bind(id)
        .run()

      // Insert new markets
      for (const market of markets) {
        await db
          .prepare(`
          INSERT INTO manga_markets (manga_id, market_id, url)
          VALUES (?, ?, ?)
        `)
          .bind(id, market.id, market.url)
          .run()
      }
    }

    // Commit transaction
    await db.exec("COMMIT")

    return { id, ...mangaData, updated_at: now }
  } catch (error) {
    // Rollback transaction on error
    await db.exec("ROLLBACK")
    console.error(`Error updating manga with ID ${id}:`, error)
    throw new Error(`Failed to update manga: ${error.message}`)
  }
}

export async function deleteManga(db: D1Database, id: number) {
  try {
    // The foreign key constraints will automatically delete related records
    const result = await db
      .prepare(`
      DELETE FROM mangas WHERE id = ?
    `)
      .bind(id)
      .run()

    return result.meta?.changes > 0
  } catch (error) {
    console.error(`Error deleting manga with ID ${id}:`, error)
    throw new Error(`Failed to delete manga: ${error.message}`)
  }
}

