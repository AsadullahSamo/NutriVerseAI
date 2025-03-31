export async function generateCulturalRecipeDetails(recipeName, cuisineName) {
    try {
        console.log('[Client] Generating recipe details for:', { recipeName, cuisineName });
        const response = await fetch('/api/ai/generate-cultural-recipe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                recipeName,
                cuisineName
            }),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('[Client] Server error:', errorData);
            throw new Error(errorData.message || 'Failed to generate recipe details');
        }
        const data = await response.json();
        console.log('[Client] Received data from server:', data);
        return data;
    }
    catch (error) {
        console.error('[Client] Error generating recipe details:', error);
        throw error;
    }
}
