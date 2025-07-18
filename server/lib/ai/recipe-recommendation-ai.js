async function storeRecommendations(userId, recommendations) {
  const db = await getDB();
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    // Store each recommendation
    for (const rec of recommendations) {
      await client.query(
        `INSERT INTO recipe_recommendations 
         (user_id, recipe_id, match_score, reason_for_recommendation, 
          seasonal_relevance, expires_at, recommendation_group, priority, recipe_data)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          userId,
          rec.recipeId,
          rec.matchScore,
          rec.reasonForRecommendation,
          rec.seasonalRelevance,
          rec.expiresAt,
          rec.recommendationGroup,
          rec.priority,
          JSON.stringify(rec.recipeData) // Store the complete recipe data
        ]
      );
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function generateRecommendations(userId) {
  const db = await getDB();
  const client = await db.connect();
  
  try {
    // Get user preferences and history
    const userPrefs = await getUserPreferences(userId);
    const userHistory = await getUserHistory(userId);
    
    // Get available recipes
    const recipes = await client.query('SELECT * FROM recipes WHERE is_active = true');
    
    // Score and rank recipes
    const scoredRecipes = recipes.rows.map(recipe => {
      const score = calculateRecipeScore(recipe, userPrefs, userHistory);
      return {
        ...recipe,
        matchScore: score
      };
    });
    
    // Sort by score and take top recommendations
    const topRecipes = scoredRecipes
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);
    
    // Format recommendations
    const recommendations = topRecipes.map(recipe => ({
      recipeId: recipe.id,
      matchScore: recipe.matchScore,
      reasonForRecommendation: generateRecommendationReason(recipe, userPrefs),
      seasonalRelevance: calculateSeasonalRelevance(recipe),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      recommendationGroup: 'personalized',
      priority: recipe.matchScore > 0.8 ? 'high' : 'medium',
      recipeData: recipe // Include the complete recipe data
    }));
    
    // Store recommendations
    await storeRecommendations(userId, recommendations);
    
    return recommendations;
  } finally {
    client.release();
  }
} 