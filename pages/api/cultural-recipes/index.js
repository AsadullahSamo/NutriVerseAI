import { getAuth } from "@/server/lib/auth"
import { db } from "@/server/db"
import { culturalRecipes } from "@shared/schema"
import { isContentVisibleForUser } from "@/server/lib/content-visibility"

export default async function handler(req, res) {
  try {
    const user = await getAuth(req)
    const userId = user?.id

    let recipes = await db
      .select()
      .from(culturalRecipes)
      .orderBy(culturalRecipes.name)

    // If user is logged in, filter out hidden recipes
    if (userId) {
      recipes = recipes.filter(
        async recipe =>
          await isContentVisibleForUser(userId, "recipe", recipe.id)
      )
    }

    res.status(200).json(recipes)
  } catch (error) {
    console.error("Error fetching recipes:", error)
    res.status(500).json({ message: "Failed to fetch recipes" })
  }
}
