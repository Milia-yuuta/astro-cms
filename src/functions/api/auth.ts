import { authenticateUser, generateAuthToken } from "../../api/auth"

export const onRequest = async (context) => {
  const { request } = context

  try {
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      })
    }

    const { email, password } = await request.json()

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const user = await authenticateUser(email, password)

    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    const token = generateAuthToken(user)

    return new Response(JSON.stringify({ user, token }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Auth API error:", error)

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

