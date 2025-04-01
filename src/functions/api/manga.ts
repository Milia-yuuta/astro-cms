import { initializeDatabase } from "../../db/migrations"
import * as MangaAPI from "../../api/manga"

export interface Env {
  DB: D1Database
}

export const onRequest = async (context) => {
  const { request, env } = context

  // Initialize database if needed
  await initializeDatabase(env.DB)

  try {
    const url = new URL(request.url)
    const path = url.pathname.replace("/api/manga", "")
    const id = path.match(/\/(\d+)/)?.[1]

    // Handle different HTTP methods
    switch (request.method) {
      case "GET":
        if (id) {
          // Get a specific manga
          const manga = await MangaAPI.getMangaById(env.DB, Number.parseInt(id))

          if (!manga) {
            return new Response(JSON.stringify({ error: "Manga not found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            })
          }

          return new Response(JSON.stringify(manga), {
            headers: { "Content-Type": "application/json" },
          })
        } else {
          // List all manga with pagination and search
          const searchParams = url.searchParams
          const page = Number.parseInt(searchParams.get("page") || "1")
          const limit = Number.parseInt(searchParams.get("limit") || "10")
          const search = searchParams.get("search") || ""

          const result = await MangaAPI.getAllManga(env.DB, page, limit, search)

          return new Response(JSON.stringify(result), {
            headers: { "Content-Type": "application/json" },
          })
        }

      case "POST":
        // Create a new manga
        const createData = await request.json()

        // Validate required fields
        if (!createData.title || !createData.author) {
          return new Response(JSON.stringify({ error: "Title and author are required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          })
        }

        const newManga = await MangaAPI.createManga(
          env.DB,
          createData.manga,
          createData.categories || [],
          createData.markets || [],
        )

        return new Response(JSON.stringify(newManga), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        })

      case "PUT":
      case "PATCH":
        // Update an existing manga
        if (!id) {
          return new Response(JSON.stringify({ error: "Manga ID is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          })
        }

        const updateData = await request.json()
        const updated = await MangaAPI.updateManga(
          env.DB,
          Number.parseInt(id),
          updateData.manga || {},
          updateData.categories,
          updateData.markets,
        )

        return new Response(JSON.stringify(updated), {
          headers: { "Content-Type": "application/json" },
        })

      case "DELETE":
        // Delete a manga
        if (!id) {
          return new Response(JSON.stringify({ error: "Manga ID is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          })
        }

        const deleted = await MangaAPI.deleteManga(env.DB, Number.parseInt(id))

        if (!deleted) {
          return new Response(JSON.stringify({ error: "Manga not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          })
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json" },
        })

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

