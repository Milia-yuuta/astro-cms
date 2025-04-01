import type { Category } from "../db/schema"

export async function getAllCategories(db: D1Database) {
  try {
    const categories = await db
      .prepare(`
      SELECT c.*, COUNT(mc.manga_id) as manga_count
      FROM categories c
      LEFT JOIN manga_categories mc ON c.id = mc.category_id
      GROUP BY c.id
      ORDER BY c.name
    `)
      .all()

    return categories.results
  } catch (error) {
    console.error("Error fetching categories:", error)
    throw new Error(`Failed to fetch categories: ${error.message}`)
  }
}

export async function getCategoryById(db: D1Database, id: number) {
  try {
    const category = await db
      .prepare(`
      SELECT c.*, COUNT(mc.manga_id) as manga_count
      FROM categories c
      LEFT JOIN manga_categories mc ON c.id = mc.category_id
      WHERE c.id = ?
      GROUP BY c.id
    `)
      .bind(id)
      .first<Category & { manga_count: number }>()

    return category
  } catch (error) {
    console.error(`Error fetching category with ID ${id}:`, error)
    throw new Error(`Failed to fetch category: ${error.message}`)
  }
}

export async function createCategory(db: D1Database, categoryData: Omit<Category, "id" | "created_at" | "updated_at">) {
  const now = new Date().toISOString()

  try {
    const result = await db
      .prepare(`
      INSERT INTO categories (name, description, created_at, updated_at)
      VALUES (?, ?, ?, ?)
    `)
      .bind(categoryData.name, categoryData.description || null, now, now)
      .run()

    const categoryId = result.meta?.last_row_id

    if (!categoryId) {
      throw new Error("Failed to insert category")
    }

    return {
      id: categoryId,
      ...categoryData,
      created_at: now,
      updated_at: now,
    }
  } catch (error) {
    console.error("Error creating category:", error)
    throw new Error(`Failed to create category: ${error.message}`)
  }
}

export async function updateCategory(db: D1Database, id: number, categoryData: Partial<Category>) {
  const now = new Date().toISOString()

  try {
    // Build update query dynamically based on provided fields
    const fields: string[] = []
    const values: any[] = []

    Object.entries(categoryData).forEach(([key, value]) => {
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
      UPDATE categories SET ${fields.join(", ")} WHERE id = ?
    `)
      .bind(...values)
      .run()

    return result.meta?.changes > 0
  } catch (error) {
    console.error(`Error updating category with ID ${id}:`, error)
    throw new Error(`Failed to update category: ${error.message}`)
  }
}

export async function deleteCategory(db: D1Database, id: number) {
  try {
    // Check if category is in use
    const inUseCheck = await db
      .prepare(`
      SELECT COUNT(*) as count FROM manga_categories WHERE category_id = ?
    `)
      .bind(id)
      .first<{ count: number }>()

    if (inUseCheck && inUseCheck.count > 0) {
      throw new Error(`Cannot delete category: it is used by ${inUseCheck.count} manga`)
    }

    const result = await db
      .prepare(`
      DELETE FROM categories WHERE id = ?
    `)
      .bind(id)
      .run()

    return result.meta?.changes > 0
  } catch (error) {
    console.error(`Error deleting category with ID ${id}:`, error)
    throw new Error(`Failed to delete category: ${error.message}`)
  }
}

