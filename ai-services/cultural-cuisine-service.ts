import type { PantryItem } from "@shared/schema";
import { CulturalCuisine, CulturalRecipe, CulturalTechnique } from "@shared/schema";
import { model, safeJsonParse } from "./gemini-client";

// Queue management for rate limiting
let requestQueue: Promise<any>[] = [];
const MIN_DELAY_BETWEEN_REQUESTS = 1000; // 1 second delay between requests
let lastRequestTime = 0;

async function enqueueRequest<T>(requestFn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const timeToWait = Math.max(0, MIN_DELAY_BETWEEN_REQUESTS - (now - lastRequestTime));
  
  if (timeToWait > 0) {
    await new Promise(resolve => setTimeout(resolve, timeToWait));
  }

  // Remove completed requests from the queue
  requestQueue = requestQueue.filter(p => !isPromiseSettled(p));
  
  const request = requestFn();
  requestQueue.push(request);
  lastRequestTime = Date.now();
  
  try {
    return await request;
  } finally {
    requestQueue = requestQueue.filter(p => p !== request);
  }
}

// Helper to check if a promise is settled
async function isPromiseSettled(p: Promise<any>): Promise<boolean> {
  const temp = {};
  return Promise.race([p, temp]).then(
    result => result === temp,
    () => true
  );
}

export interface CulturalInsights {
  historicalContext: string;
  culturalSignificance: string[];
  traditionalOccasions: string[];
  modernAdaptations: string[];
  regionalVariations: {
    region: string;
    description: string;
    uniqueIngredients: string[];
  }[];
}

export interface RecipeAuthenticityAnalysis {
  authenticityScore: number;
  feedback: string[];
  traditionalElements: string[];
  modernAdaptations: string[];
  culturalAccuracy: string;
  suggestions: string[];
}

export interface TechniqueTip {
  technique: string;
  traditionalMethod: string;
  modernAdaptation: string;
  commonMistakes: string[];
  tips: string[];
}

export async function analyzeCulturalCuisine(cuisine: CulturalCuisine): Promise<CulturalInsights> {
  const prompt = `Analyze this cultural cuisine and provide detailed cultural insights:
    ${JSON.stringify(cuisine)}
    
    Provide a comprehensive analysis in JSON format including:
    - Historical context
    - Cultural significance
    - Traditional occasions
    - Modern adaptations
    - Regional variations`;

  const result = await model.generateContent(prompt);
  const response = await result.response.text();
  return await safeJsonParse(response);
}

export async function getRecipeAuthenticityScore(recipe: CulturalRecipe, substitutions: any[]): Promise<RecipeAuthenticityAnalysis> {
  const ingredients = Array.isArray(recipe.authenticIngredients) 
    ? recipe.authenticIngredients 
    : [];

  return {
    authenticityScore: 100 - (substitutions.filter(s => s.flavorImpact === 'significant').length * 20),
    feedback: ['Based on ingredient substitutions'],
    traditionalElements: ingredients,
    modernAdaptations: substitutions.map(s => s.substitute),
    culturalAccuracy: 'moderate',
    suggestions: ['Consider using traditional ingredients when possible']
  };
}

export async function getTechniqueTips(technique: CulturalTechnique, cuisine: CulturalCuisine): Promise<TechniqueTip> {
  const prompt = `Provide detailed tips for this cultural cooking technique:
    Technique: ${JSON.stringify(technique)}
    Cuisine: ${JSON.stringify(cuisine)}
    
    Format your response as a JSON object with these fields:
    {
      "technique": string,
      "traditionalMethod": string,
      "modernAdaptation": string,
      "commonMistakes": string[],
      "tips": string[]
    }`;

  const result = await model.generateContent(prompt);
  const response = await result.response.text();
  return await safeJsonParse(response);
}

export async function generateCulturalDetails(cuisine: CulturalCuisine): Promise<{
  culturalContext: {
    history: string;
    traditions: string;
    festivals: string;
    influences: string;
  };
  servingEtiquette: {
    tableSetting: string;
    diningCustoms: string;
    servingOrder: string;
    taboos: string;
    general: string;
  };
}> {
  return enqueueRequest(async () => {
    const prompt = `You are a JSON API endpoint. Return ONLY valid JSON with no additional text or markdown.
    Generate detailed cultural context and serving etiquette information for ${cuisine.name} cuisine from ${cuisine.region}.

    Base the response on:
    Description: ${cuisine.description}
    Key Ingredients: ${JSON.stringify(cuisine.keyIngredients)}
    Cooking Techniques: ${JSON.stringify(cuisine.cookingTechniques)}

    Return this exact structure:
    {
      "culturalContext": {
        "history": "string describing historical background",
        "traditions": "string describing key culinary traditions",
        "festivals": "string describing important celebrations and their food significance",
        "influences": "string describing cultural and historical influences"
      },
      "servingEtiquette": {
        "tableSetting": "bullet-pointed traditional table arrangement guidelines",
        "diningCustoms": "bullet-pointed dining rules and customs",
        "servingOrder": "bullet-pointed traditional course sequence",
        "taboos": "bullet-pointed things to avoid",
        "general": "string describing overall dining etiquette"
      }
    }`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response.text();
      console.log('Raw AI response:', response); // Add logging to help debug
      const parsed = await safeJsonParse(response);

      // Validate the response structure
      if (!parsed?.culturalContext || !parsed?.servingEtiquette) {
        throw new Error('Invalid response structure - missing required sections');
      }

      const requiredContextFields = ['history', 'traditions', 'festivals', 'influences'];
      const requiredEtiquetteFields = ['tableSetting', 'diningCustoms', 'servingOrder', 'taboos', 'general'];

      const missingContextFields = requiredContextFields.filter(field => !parsed.culturalContext[field]);
      const missingEtiquetteFields = requiredEtiquetteFields.filter(field => !parsed.servingEtiquette[field]);

      if (missingContextFields.length > 0 || missingEtiquetteFields.length > 0) {
        throw new Error('Invalid response structure - missing required fields: ' + 
          [...missingContextFields, ...missingEtiquetteFields].join(', '));
      }

      // Process bullet-pointed sections
      const bulletSections = ['tableSetting', 'diningCustoms', 'servingOrder', 'taboos'];
      bulletSections.forEach(section => {
        if (typeof parsed.servingEtiquette[section] === 'string') {
          const points = parsed.servingEtiquette[section]
            .split(/(?:\\n|\n|\.(?=\s|$))/)
            .map(point => point.trim())
            .filter(Boolean)
            .map(point => point.replace(/^[•\-]\s*/, ''));

          parsed.servingEtiquette[section] = points
            .map(point => `• ${point}`)
            .join('\n');
        }
      });

      return parsed;
    } catch (err) {
      const error = err as Error;
      console.error('Error generating cultural details:', error);
      throw new Error('Failed to generate cultural details: ' + (error?.message || 'Unknown error'));
    }
  });
}

export async function getPairings(recipe: CulturalRecipe, cuisine: CulturalCuisine) {
  return enqueueRequest(async () => {
    console.log('Fetching pairings for:', { recipeName: recipe.name, cuisine: cuisine.name });

    const traditionalPairings = getTraditionalPairings(cuisine.region.toLowerCase());
    
    const prompt = `Suggest specific food pairings for this ${cuisine.name} recipe:
      Recipe: ${JSON.stringify({
        name: recipe.name,
        ingredients: recipe.authenticIngredients
      })}
      
      Return JSON with these categories:
      {
        "mainDishes": string[] (dishes that complement this recipe),
        "sideDishes": string[] (appropriate side dishes),
        "desserts": string[] (dessert pairings),
        "beverages": string[] (drink pairings)
      }`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response.text();
      console.log('Pairings response:', response);
      
      const aiPairings = await safeJsonParse(response);
      
      return {
        mainDishes: Array.from(new Set([...traditionalPairings.mainDishes, ...(aiPairings.mainDishes || [])])),
        sideDishes: Array.from(new Set([...traditionalPairings.sideDishes, ...(aiPairings.sideDishes || [])])),
        desserts: Array.from(new Set([...traditionalPairings.desserts, ...(aiPairings.desserts || [])])),
        beverages: Array.from(new Set([...traditionalPairings.beverages, ...(aiPairings.beverages || [])]))
      };
    } catch (error) {
      console.error('Error generating pairings:', error);
      return traditionalPairings;
    }
  });
}

export async function getEtiquette(recipe: CulturalRecipe, cuisine: CulturalCuisine) {
  return enqueueRequest(async () => {
    console.log('Fetching etiquette for:', { recipeName: recipe.name, cuisine: cuisine.name });

    const regionalEtiquette = getRegionalEtiquette(cuisine.region.toLowerCase());
    
    const prompt = `Provide specific serving etiquette for this ${cuisine.name} dish:
      Recipe: ${JSON.stringify({
        name: recipe.name,
        culturalNotes: recipe.culturalNotes,
        servingSuggestions: recipe.servingSuggestions
      })}
      
      Return JSON with these categories:
      {
        "presentation": string[] (visual presentation guidelines),
        "customs": string[] (dining customs to observe),
        "taboos": string[] (practices to avoid),
        "servingOrder": string[] (proper serving sequence)
      }`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response.text();
      const aiEtiquette = await safeJsonParse(response);
      
      return {
        presentation: Array.from(new Set([...regionalEtiquette.presentation, ...(aiEtiquette.presentation || [])])),
        customs: Array.from(new Set([...regionalEtiquette.customs, ...(aiEtiquette.customs || [])])),
        taboos: Array.from(new Set([...regionalEtiquette.taboos, ...(aiEtiquette.taboos || [])])),
        servingOrder: Array.from(new Set([...regionalEtiquette.servingOrder, ...(aiEtiquette.servingOrder || [])]))
      };
    } catch (error) {
      console.error('Error generating etiquette:', error);
      return regionalEtiquette;
    }
  });
}

export async function getSubstitutions(recipe: CulturalRecipe, pantryItems: PantryItem[], region: string) {
  return enqueueRequest(async () => {
    const ingredients = Array.isArray(recipe.authenticIngredients) 
      ? recipe.authenticIngredients 
      : Object.keys(recipe.authenticIngredients as Record<string, unknown> || {});

    const substitutionsPrompt = `You are a JSON API that must return a valid JSON array. For these ingredients, provide substitution options:
      Ingredients: ${JSON.stringify(ingredients)}
      Available pantry items: ${JSON.stringify(pantryItems)}
      Region: ${region}
      
      Return EXACTLY this JSON structure with no additional text or explanation:
      [
        {
          "original": "ingredient name",
          "substitute": "best substitute",
          "notes": "usage notes",
          "flavorImpact": "minimal/moderate/significant"
        }
      ]`;

    try {
      const result = await model.generateContent(substitutionsPrompt);
      const response = await result.response.text();
      
      let parsedContent = await safeJsonParse(response);
      if (!Array.isArray(parsedContent)) {
        parsedContent = [parsedContent];
      }

      // Merge AI suggestions with predefined rules
      const substitutions = ingredients.map(ingredient => {
        const rule = getSubstitutionRules()[ingredient.toLowerCase()];
        const aiSuggestion = parsedContent.find((s: { original?: string }) => 
          s.original?.toLowerCase() === ingredient.toLowerCase()
        );
        
        return {
          original: ingredient,
          substitute: rule?.substitutes[0] || aiSuggestion?.substitute || 'No direct substitute available',
          notes: rule?.notes || aiSuggestion?.notes || 'Use with caution as flavor profile may differ',
          flavorImpact: rule?.flavorImpact || aiSuggestion?.flavorImpact || 'significant'
        };
      });

      return {
        substitutions,
        authenticityScore: 100 - (substitutions.filter(s => s.flavorImpact === 'significant').length * 20),
        authenticityFeedback: ['Substitutions may affect the authentic taste of the dish']
      };
    } catch (error) {
      console.error('Error generating substitutions:', error);
      return {
        substitutions: [],
        authenticityScore: 0,
        authenticityFeedback: ['Error generating substitutions']
      };
    }
  });
}

// Helper functions with embedded cultural knowledge data
function getSubstitutionRules(): Record<string, {
  substitutes: string[];
  notes: string;
  flavorImpact: 'minimal' | 'moderate' | 'significant';
}> {
  return {
    'kaffir lime leaves': {
      substitutes: ['lime zest', 'bay leaves with lime zest'],
      notes: 'Use lime zest for citrus notes, bay leaf adds aromatic element',
      flavorImpact: 'moderate'
    },
    'fish sauce': {
      substitutes: ['soy sauce with salt', 'worcestershire sauce'],
      notes: 'Add a pinch of salt and a drop of vinegar to better mimic umami flavor',
      flavorImpact: 'significant'
    },
    'gochujang': {
      substitutes: ['sriracha with miso paste', 'red pepper flakes with honey'],
      notes: 'Mix 2 parts sriracha with 1 part miso for similar fermented spicy flavor',
      flavorImpact: 'moderate'
    },
    'lemongrass': {
      substitutes: ['lemon zest with ginger', 'lemon verbena'],
      notes: 'Combine 1 tablespoon lemon zest with 1/4 teaspoon ginger powder',
      flavorImpact: 'moderate'
    },
    'tahini': {
      substitutes: ['smooth peanut butter', 'sunflower seed butter'],
      notes: 'Thin with sesame oil if available for closer flavor profile',
      flavorImpact: 'minimal'
    },
    'ghee': {
      substitutes: ['clarified butter', 'butter', 'coconut oil'],
      notes: 'Unsalted butter is your best alternative, coconut oil changes flavor profile',
      flavorImpact: 'minimal'
    },
    'sumac': {
      substitutes: ['lemon zest', 'amchoor powder', 'tamarind'],
      notes: 'Add a touch of salt to lemon zest for similar tanginess',
      flavorImpact: 'moderate'
    },
    'oyster sauce': {
      substitutes: ['hoisin sauce', 'soy sauce with sugar'],
      notes: 'Mix 1 tablespoon soy sauce with 1/2 teaspoon sugar and 1/2 teaspoon Worcestershire sauce',
      flavorImpact: 'moderate'
    },
    'galangal': {
      substitutes: ['ginger', 'ginger with lemon zest'],
      notes: 'True galangal has a sharper, citrusy flavor than ginger',
      flavorImpact: 'moderate'
    },
    'tamarind paste': {
      substitutes: ['lime juice with brown sugar', 'pomegranate molasses', 'vinegar with dates'],
      notes: 'Mix 1 part lime juice with 1 part brown sugar for similar sweet-sour profile',
      flavorImpact: 'moderate'
    },
    'shiso leaves': {
      substitutes: ['mint with basil', 'thai basil'],
      notes: 'Equal parts mint and basil can approximate the complex flavor',
      flavorImpact: 'moderate'
    },
    'miso paste': {
      substitutes: ['tahini with soy sauce', 'vegetable bouillon'],
      notes: 'Lacks fermented quality but provides umami base',
      flavorImpact: 'significant'
    },
    'za\'atar': {
      substitutes: ['thyme with sesame seeds and sumac', 'thyme with lemon zest'],
      notes: 'Mix 1 tbsp thyme, 1 tsp sesame seeds, pinch of salt and lemon zest',
      flavorImpact: 'moderate'
    },
    'plantains': {
      substitutes: ['green bananas', 'potatoes for savory dishes'],
      notes: 'Texture will differ; use less cooking time',
      flavorImpact: 'significant'
    },
    'paneer': {
      substitutes: ['firm tofu', 'halloumi', 'queso fresco'],
      notes: 'Drain tofu well and press before using',
      flavorImpact: 'moderate'
    }
  };
}

function getTraditionalPairings(region: string): {
  mainDishes: string[];
  sideDishes: string[];
  desserts: string[];
  beverages: string[];
} {
  const pairings: Record<string, any> = {
    'east_asia': {
      mainDishes: ['Steamed Fish', 'Stir-fried Vegetables', 'Clay Pot Rice'],
      sideDishes: ['Pickled Vegetables', 'Cold Salad', 'Steamed Eggs'],
      desserts: ['Red Bean Soup', 'Mango Pudding', 'Egg Tarts'],
      beverages: ['Jasmine Tea', 'Oolong Tea', 'Rice Wine']
    },
    'southeast_asia': {
      mainDishes: ['Green Curry', 'Pad Thai', 'Beef Rendang'],
      sideDishes: ['Som Tam', 'Sticky Rice', 'Roti Canai'],
      desserts: ['Mango Sticky Rice', 'Thai Tea Ice Cream', 'Kuih'],
      beverages: ['Thai Iced Tea', 'Coconut Water', 'Sugarcane Juice']
    },
    'south_asia': {
      mainDishes: ['Butter Chicken', 'Biryani', 'Dal Makhani'],
      sideDishes: ['Naan', 'Raita', 'Chutney'],
      desserts: ['Gulab Jamun', 'Kheer', 'Jalebi'],
      beverages: ['Lassi', 'Masala Chai', 'Rooh Afza']
    },
    'middle_east': {
      mainDishes: ['Lamb Shawarma', 'Falafel', 'Kebabs'],
      sideDishes: ['Hummus', 'Tabbouleh', 'Baba Ganoush'],
      desserts: ['Baklava', 'Kunafa', 'Turkish Delight'],
      beverages: ['Mint Tea', 'Turkish Coffee', 'Ayran']
    },
    'mediterranean': {
      mainDishes: ['Paella', 'Moussaka', 'Risotto'],
      sideDishes: ['Greek Salad', 'Bruschetta', 'Dolmas'],
      desserts: ['Tiramisu', 'Baklava', 'Panna Cotta'],
      beverages: ['Wine', 'Limoncello', 'Ouzo']
    },
    'latin_america': {
      mainDishes: ['Tacos', 'Mole Poblano', 'Feijoada'],
      sideDishes: ['Guacamole', 'Elote', 'Black Beans'],
      desserts: ['Tres Leches Cake', 'Churros', 'Flan'],
      beverages: ['Horchata', 'Margarita', 'Agua Fresca']
    },
    'caribbean': {
      mainDishes: ['Jerk Chicken', 'Curry Goat', 'Ackee and Saltfish'],
      sideDishes: ['Rice and Peas', 'Festival', 'Plantains'],
      desserts: ['Rum Cake', 'Sweet Potato Pudding', 'Coconut Drops'],
      beverages: ['Rum Punch', 'Sorrel Drink', 'Ginger Beer']
    },
    'west_africa': {
      mainDishes: ['Jollof Rice', 'Egusi Soup', 'Peanut Stew'],
      sideDishes: ['Fufu', 'Fried Plantains', 'Moin Moin'],
      desserts: ['Chin Chin', 'Puff Puff', 'Coconut Candy'],
      beverages: ['Palm Wine', 'Bissap', 'Ginger Drink']
    },
    'east_africa': {
      mainDishes: ['Injera with Wat', 'Nyama Choma', 'Pilau Rice'],
      sideDishes: ['Chapati', 'Sukuma Wiki', 'Ugali'],
      desserts: ['Mandazi', 'Kashata', 'Maandazi'],
      beverages: ['Ethiopian Coffee', 'Tangawizi', 'Urwaga']
    },
    'north_africa': {
      mainDishes: ['Couscous', 'Tagine', 'Shakshuka'],
      sideDishes: ['Harissa', 'Zaalouk', 'Batbout'],
      desserts: ['Makroud', 'Msemen', 'Basbousa'],
      beverages: ['Mint Tea', 'Almond Milk', 'Hibiscus Tea']
    }
  };
  
  return pairings[region] || {
    mainDishes: [],
    sideDishes: [],
    desserts: [],
    beverages: []
  };
}

function getRegionalEtiquette(region: string): {
  presentation: string[];
  customs: string[];
  taboos: string[];
  servingOrder: string[];
} {
  const etiquette: Record<string, any> = {
    'east_asia': {
      presentation: [
        'Serve rice in individual bowls',
        'Place shared dishes in the center',
        'Arrange food to highlight colors and textures',
        'Use small plates for individual portions'
      ],
      customs: [
        'Hold rice bowl close to mouth',
        'Use chopsticks correctly',
        'Pour tea for others before yourself',
        'Tap fingers as thanks when someone pours tea for you'
      ],
      taboos: [
        'Don\'t stick chopsticks vertically in rice',
        'Don\'t pass food directly from chopsticks to chopsticks',
        'Don\'t point with chopsticks',
        'Don\'t flip fish over on the plate'
      ],
      servingOrder: [
        'Soup first',
        'Rice and main dishes together',
        'Fruit or light dessert last',
        'Tea throughout the meal'
      ]
    },
    'southeast_asia': {
      presentation: [
        'Serve food family-style on a raised platform',
        'Arrange dishes by spice level',
        'Include contrasting textures and flavors',
        'Garnish with fresh herbs and lime wedges'
      ],
      customs: [
        'Eat with right hand in some regions',
        'Use fork and spoon (fork to push, spoon to eat)',
        'Take small portions to sample everything',
        'Cool spicy dishes with plain rice'
      ],
      taboos: [
        'Don\'t use left hand for eating',
        'Don\'t place serving spoons in your mouth',
        'Don\'t leave chopsticks crossed',
        'Don\'t waste rice'
      ],
      servingOrder: [
        'All dishes served simultaneously',
        'Rice as the foundation',
        'Balance between spicy, sour, sweet and savory in one meal',
        'Fresh fruit for dessert'
      ]
    },
    'south_asia': {
      presentation: [
        'Serve on thali plates with small compartments',
        'Balance colors and textures across the plate',
        'Place bread and rice separately',
        'Arrange accompaniments in small bowls'
      ],
      customs: [
        'Traditionally eat with right hand fingers',
        'Tear bread with fingers, not cutlery',
        'Share food and offer to others first',
        'Mix rice with curry using fingertips'
      ],
      taboos: [
        'Don\'t use left hand for eating or passing food',
        'Don\'t waste food on your plate',
        'Don\'t start eating before elders or guests',
        'Don\'t lick fingers in formal settings'
      ],
      servingOrder: [
        'Begin with something sweet in some regions',
        'Serve bread and rice with main dishes',
        'Sweet dish or paan to conclude the meal',
        'Yogurt or raita to balance spice'
      ]
    },
    'middle_east': {
      presentation: [
        'Large central platters for sharing',
        'Multiple small mezze dishes',
        'Vibrant colors and garnishes',
        'Arrange bread in cloth-lined baskets'
      ],
      customs: [
        'Break bread with hands, never cut with knife',
        'Dip bread in shared dishes',
        'Serve elders and guests first',
        'Use right hand for eating'
      ],
      taboos: [
        'Don\'t refuse offered food (take at least a small portion)',
        'Don\'t eat with left hand',
        'Don\'t rush through meals',
        'Don\'t blow on hot food'
      ],
      servingOrder: [
        'Mezze (small appetizers) first',
        'Main dishes with bread',
        'Sweet tea and desserts after the meal',
        'Coffee to conclude'
      ]
    },
    'mediterranean': {
      presentation: [
        'Simple, rustic presentation',
        'Fresh herbs as garnish',
        'Olive oil drizzled as finishing touch',
        'Colorful vegetable arrangements'
      ],
      customs: [
        'Bread accompanies the entire meal',
        'Share multiple dishes family-style',
        'Use bread to soak up sauces',
        'Leisurely pace with conversation'
      ],
      taboos: [
        'Don\'t rush the meal',
        'Don\'t waste bread',
        'Don\'t add cheese to seafood pasta in Italy',
        'Don\'t ask for additional seasoning before tasting'
      ],
      servingOrder: [
        'Antipasti/appetizers',
        'Pasta or rice dish',
        'Main protein dish',
        'Salad course',
        'Cheese and fruit',
        'Dessert and coffee'
      ]
    },
    'latin_america': {
      presentation: [
        'Colorful arrangements',
        'Fresh garnishes like cilantro and lime',
        'Serve with traditional salsas on the side',
        'Family-style large platters'
      ],
      customs: [
        'Wait for eldest to begin eating',
        'Keep hands visible on table, not in lap',
        'Use tortillas or bread to scoop food',
        'Express appreciation for the food'
      ],
      taboos: [
        'Don\'t eat tacos with fork and knife',
        'Don\'t add hot sauce before tasting',
        'Don\'t refuse offered food in someone\'s home',
        'Don\'t leave the table until everyone is finished'
      ],
      servingOrder: [
        'Soup or light appetizer',
        'Main course with sides',
        'Dessert',
        'Coffee or digestif'
      ]
    }
  };
  
  return etiquette[region] || {
    presentation: [],
    customs: [],
    taboos: [],
    servingOrder: []
  };
}