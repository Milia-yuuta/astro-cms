import type { Market } from "../db/schema"

export async function getAllMarkets(db: D1Database) {
  try {
    const markets = await db
      .prepare(`
      SELECT m.*, COUNT(mm.manga_id) as manga_count
      FROM markets m
      LEFT JOIN manga_markets mm ON m.id = mm.market_id
      GROUP BY m.id
      ORDER BY m.name
    `)
      .all()

    return markets.results
  } catch (error) {
    console.error("Error fetching markets:", error)
    throw new Error(`Failed to fetch markets: ${error.message}`)
  }
}

export async function getMarketById(db: D1Database, id: number) {
  try {
    const market = await db
      .prepare(`
      SELECT m.*, COUNT(mm.manga_id) as manga_count
      FROM markets m
      LEFT JOIN manga_markets mm ON m.id = mm.market_id
      WHERE m.id = ?
      GROUP BY m.id
    `)
      .bind(id)
      .first<Market & { manga_count: number }>()

    return market
  } catch (error) {
    console.error(`Error fetching market with ID ${id}:`, error)
    throw new Error(`Failed to fetch market: ${error.message}`)
  }
}

export async function createMarket(db: D1Database, marketData: Omit<Market, "id" | "created_at" | "updated_at">) {
  const now = new Date().toISOString()

  try {
    const result = await db
      .prepare(`
      INSERT INTO markets (name, website, created_at, updated_at)
      VALUES (?, ?, ?, ?)
    `)
      .bind(marketData.name, marketData.website, now, now)
      .run()

    const marketId = result.meta?.last_row_id

    if (!marketId) {
      throw new Error("Failed to insert market")
    }

    return {
      id: marketId,
      ...marketData,
      created_at: now,
      updated_at: now,
    }
  } catch (error) {
    console.error("Error creating market:", error)
    throw new Error(`Failed to create market: ${error.message}`)
  }
}

export async function updateMarket(db: D1Database, id: number, marketData: Partial<Market>) {
  const now = new Date().toISOString()

  try {
    // Build update query dynamically based on provided fields
    const fields: string[] = []
    const values: any[] = []

    Object.entries(marketData).forEach(([key, value]) => {
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

    const result = await db
      .prepare(`
      UPDATE markets SET ${fields.join(", ")} WHERE id = ?
    `)
      .bind(...values)
      .run()

    return result.meta?.changes > 0
  } catch (error) {
    console.error(`Error updating market with ID ${id}:`, error)
    throw new Error(`Failed to update market: ${error.message}`)
  }
}

export async function deleteMarket(db: D1Database, id: number) {
  try {
    // Check if market is in use
    const inUseCheck = await db
      .prepare(`
      SELECT COUNT(*) as count FROM manga_markets WHERE market_id = ?
    `)
      .bind(id)
      .first<{ count: number }>()

    if (inUseCheck && inUseCheck.count > 0) {
      throw new Error(`Cannot delete market: it is used by ${inUseCheck.count} manga`)
    }

    const result = await db
      .prepare(`
      DELETE FROM markets WHERE id = ?
    `)
      .bind(id)
      .run()

    return result.meta?.changes > 0
  } catch (error) {
    console.error(`Error deleting market with ID ${id}:`, error)
    throw new Error(`Failed to delete market: ${error.message}`)
  }
}

