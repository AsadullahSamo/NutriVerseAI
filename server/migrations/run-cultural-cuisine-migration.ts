import { db } from "../server/db";
import { culturalCuisines } from "../shared/schema";
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runCulturalCuisineMigration() {
  try {
    console.log('Starting cultural cuisine migration...');
    
    const cuisines = [
      {
        name: 'Japanese',
        region: 'East Asia',
        description: 'Japanese cuisine emphasizes seasonal ingredients, meticulous preparation, and beautiful presentation. Known for its delicate flavors, artistic plating, and respect for natural ingredients.',
        keyIngredients: ['rice', 'nori', 'miso', 'dashi', 'soy sauce'],
        cookingTechniques: ['grilling', 'steaming', 'simmering', 'raw preparation'],
        culturalContext: {
          history: 'Japanese cuisine has evolved over centuries of social and political changes',
          significance: 'Food plays a central role in Japanese culture and social life'
        },
        servingEtiquette: {
          chopsticks: 'Never stick chopsticks vertically in rice',
          sharing: 'It\'s common to share dishes family-style',
          order: 'Meals typically follow a specific order and arrangement'
        },
        bannerUrl: 'https://images.unsplash.com/photo-1580822184713-fc5400e7fe10',
        color: '#FF6B6B',
        tags: ['traditional', 'healthy', 'seafood', 'rice'],
        visual: {
          primaryColor: '#FF6B6B',
          textColor: '#2D3748',
          accentColor: '#4FD1C5'
        }
      },
      {
        name: 'Italian',
        region: 'Southern Europe',
        description: 'Italian cuisine celebrates simplicity and quality ingredients. Each region has its unique specialties, but all share a passion for fresh, seasonal produce and time-honored cooking methods.',
        keyIngredients: ['olive oil', 'tomatoes', 'pasta', 'basil', 'parmesan'],
        cookingTechniques: ['al dente', 'sautéing', 'braising', 'grilling'],
        culturalContext: {
          history: 'Italian cuisine has developed over many centuries',
          significance: 'Food is central to Italian family and social life'
        },
        servingEtiquette: {
          courses: 'Meals are typically served in multiple courses',
          wine: 'Wine pairing is an important aspect',
          timing: 'Lunch and dinner are social occasions'
        },
        bannerUrl: 'https://images.unsplash.com/photo-1498579150354-977475b7ea0b',
        color: '#38A169',
        tags: ['pasta', 'mediterranean', 'wine', 'family'],
        visual: {
          primaryColor: '#38A169',
          textColor: '#1A202C',
          accentColor: '#F6AD55'
        }
      },
      {
        name: 'Thai',
        region: 'Southeast Asia',
        description: 'Thai cuisine is a harmonious blend of sweet, sour, salty, and spicy flavors. Each dish is carefully crafted to create a balance that awakens all the senses.',
        keyIngredients: ['lemongrass', 'fish sauce', 'coconut milk', 'thai basil', 'chilies'],
        cookingTechniques: ['stir-frying', 'pounding', 'grilling', 'steaming'],
        culturalContext: {
          history: 'Thai cuisine reflects the country\'s geographical and cultural diversity',
          significance: 'Food is a way of bringing people together'
        },
        servingEtiquette: {
          spoon: 'Use spoon as primary utensil with fork to push food',
          sharing: 'Dishes are meant to be shared',
          rice: 'Rice is served with most meals'
        },
        bannerUrl: 'https://images.unsplash.com/photo-1559314809-0d155014e29e',
        color: '#D69E2E',
        tags: ['spicy', 'aromatic', 'fresh', 'tropical'],
        visual: {
          primaryColor: '#D69E2E',
          textColor: '#2D3748',
          accentColor: '#48BB78'
        }
      }
    ];

    // Clear existing data
    await db.delete(culturalCuisines);

    // Insert each cuisine
    for (const cuisine of cuisines) {
      await db.insert(culturalCuisines).values(cuisine);
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

runCulturalCuisineMigration().catch(console.error);