// In a real implementation, you would use proper authentication
// This is a simplified example for demonstration purposes

export interface User {
  id: number
  email: string
  name: string
  role: "admin"
}

// In a real implementation, this would be stored in a database with proper password hashing
const ADMIN_USERS = [
  {
    id: 1,
    email: "admin@example.com",
    password: "admin123", // In a real app, this would be hashed
    name: "Admin User",
    role: "admin" as const,
  },
]

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  // In a real implementation, you would query the database and verify the password hash
  const user = ADMIN_USERS.find((u) => u.email === email && u.password === password)

  if (!user) {
    return null
  }

  // Don't return the password
  const { password: _, ...userWithoutPassword } = user
  return userWithoutPassword
}

export function generateAuthToken(user: User): string {
  // In a real implementation, you would use JWT or another token system
  // This is a simplified example
  return btoa(JSON.stringify(user))
}

export function verifyAuthToken(token: string): User | null {
  try {
    // In a real implementation, you would verify the JWT signature
    return JSON.parse(atob(token))
  } catch (error) {
    return null
  }
}

