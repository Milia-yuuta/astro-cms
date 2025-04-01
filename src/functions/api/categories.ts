import { initializeDatabase } from "../../db/migrations"
import * as CategoryAPI from "../../api/categories"

export interface Env {
  DB: D1Database
}

export const onRequest = async (context) => {
  const { request, env } = context

  // Initialize database if needed
  await initializeDatabase(env.DB)

  try {
    const url = new URL(request.url)
    const path = url.pathname.replace("/api/categories", "")
    const id = path.match(/\/(\d+)/)?.[1]

    // Handle different HTTP methods
    switch (request.method) {
      case "GET":
        if (id) {
          // Get a specific category
          const category = await CategoryAPI.getCategoryById(env.DB, Number.parseInt(id))

          if (!category) {
            return new Response(JSON.stringify({ error: "Category not found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            })
          }

          return new Response(JSON.stringify(category), {
            headers: { "Content-Type": "application/json" },
          })
        } else {
          // List all categories
          const categories = await CategoryAPI.getAllCategories(env.DB)

          return new Response(JSON.stringify(categories), {
            headers: { "Content-Type": "application/json" },
          })
        }

      case "POST":
        // Create a new category
        const createData = await request.json()

        // Validate required fields
        if (!createData.name) {
          return new Response(JSON.stringify({ error: "Name is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          })
        }

        const newCategory = await CategoryAPI.createCategory(env.DB, createData)

        return new Response(JSON.stringify(newCategory), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        })

      case "PUT":
      case "PATCH":
        // Update an existing category
        if (!id) {
          return new Response(JSON.stringify({ error: "Category ID is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          })
        }

        const updateData = await request.json()
        const updated = await CategoryAPI.updateCategory(env.DB, Number.parseInt(id), updateData)

        return new Response(JSON.stringify({ success: updated }), {
          headers: { "Content-Type": "application/json" },
        })

      case "DELETE":
        // Delete a category
        if (!id) {
          return new Response(JSON.stringify({ error: "Category ID is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          })
        }

        try {
          const deleted = await CategoryAPI.deleteCategory(env.DB, Number.parseInt(id))

          return new Response(JSON.stringify({ success: deleted }), {
            headers: { "Content-Type": "application/json" },
          })
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          })
        }

      default:
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
          status: 405,
          headers: { "Content-Type": "application/json" },
        })
    }
  } catch (error) {
    console.error("API error:", error)

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

