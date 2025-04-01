import { initializeDatabase } from "../../db/migrations"
import * as MarketAPI from "../../api/markets"

export interface Env {
  DB: D1Database
}

export const onRequest = async (context) => {
  const { request, env } = context

  // Initialize database if needed
  await initializeDatabase(env.DB)

  try {
    const url = new URL(request.url)
    const path = url.pathname.replace("/api/markets", "")
    const id = path.match(/\/(\d+)/)?.[1]

    // Handle different HTTP methods
    switch (request.method) {
      case "GET":
        if (id) {
          // Get a specific market
          const market = await MarketAPI.getMarketById(env.DB, Number.parseInt(id))

          if (!market) {
            return new Response(JSON.stringify({ error: "Market not found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            })
          }

          return new Response(JSON.stringify(market), {
            headers: { "Content-Type": "application/json" },
          })
        } else {
          // List all markets
          const markets = await MarketAPI.getAllMarkets(env.DB)

          return new Response(JSON.stringify(markets), {
            headers: { "Content-Type": "application/json" },
          })
        }

      case "POST":
        // Create a new market
        const createData = await request.json()

        // Validate required fields
        if (!createData.name || !createData.website) {
          return new Response(JSON.stringify({ error: "Name and website are required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          })
        }

        const newMarket = await MarketAPI.createMarket(env.DB, createData)

        return new Response(JSON.stringify(newMarket), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        })

      case "PUT":
      case "PATCH":
        // Update an existing market
        if (!id) {
          return new Response(JSON.stringify({ error: "Market ID is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          })
        }

        const updateData = await request.json()
        const updated = await MarketAPI.updateMarket(env.DB, Number.parseInt(id), updateData)

        return new Response(JSON.stringify({ success: updated }), {
          headers: { "Content-Type": "application/json" },
        })

      case "DELETE":
        // Delete a market
        if (!id) {
          return new Response(JSON.stringify({ error: "Market ID is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          })
        }

        try {
          const deleted = await MarketAPI.deleteMarket(env.DB, Number.parseInt(id))

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

