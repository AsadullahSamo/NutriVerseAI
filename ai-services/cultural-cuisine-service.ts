import type { PantryItem } from "@shared/schema";
import { CulturalCuisine, CulturalRecipe, CulturalTechnique } from "@shared/schema";

import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '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',
  dangerouslyAllowBrowser: true
});

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

  const response = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are an expert in global cuisines and food anthropology. Provide detailed cultural analysis in JSON format."
      },
      { role: "user", content: prompt }
    ],
    model: "mixtral-8x7b-32768",
    temperature: 0.4,
    max_tokens: 2000
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('No response from cultural analysis API');

  try {
    return JSON.parse(content.trim().replace(/```json\n?|\n?```/g, ''));
  } catch (error) {
    console.error('Failed to parse cultural insights:', error);
    throw new Error('Invalid cultural insights format received');
  }
}

export async function getRecipeAuthenticityScore(recipe: CulturalRecipe, cuisine: CulturalCuisine): Promise<RecipeAuthenticityAnalysis> {
  const prompt = `Analyze this recipe's authenticity within its cultural context:
    Recipe: ${JSON.stringify(recipe)}
    Cuisine: ${JSON.stringify(cuisine)}
    
    Provide a detailed authenticity analysis including:
    - Authenticity score (0-100)
    - Feedback points
    - Traditional elements identified
    - Modern adaptations noted
    - Cultural accuracy assessment
    - Suggestions for improving authenticity`;

  const response = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are an expert in traditional cooking techniques and cultural authenticity. Provide detailed authenticity analysis in JSON format."
      },
      { role: "user", content: prompt }
    ],
    model: "mixtral-8x7b-32768",
    temperature: 0.3,
    max_tokens: 1500
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('No response from authenticity analysis API');

  try {
    return JSON.parse(content.trim().replace(/```json\n?|\n?```/g, ''));
  } catch (error) {
    console.error('Failed to parse authenticity analysis:', error);
    throw new Error('Invalid authenticity analysis format received');
  }
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
    }
    
    Do not include video references, focus on providing detailed, actionable cooking guidance.`;

  const response = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are a master chef specializing in traditional cooking techniques. Provide clear, practical guidance without referencing external resources."
      },
      { role: "user", content: prompt }
    ],
    model: "mixtral-8x7b-32768",
    temperature: 0.4,
    max_tokens: 1500
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('No response from technique tips API');

  try {
    // First try to parse the content directly
    try {
      return JSON.parse(content);
    } catch {
      // If that fails, try to extract JSON from markdown
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/```\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1].trim());
      }
      // If no markdown, try to extract anything that looks like JSON
      const possibleJson = content.match(/\{[\s\S]*\}/);
      if (possibleJson) {
        return JSON.parse(possibleJson[0]);
      }
      throw new Error('Could not find valid JSON in response');
    }
  } catch (error) {
    console.error('Failed to parse technique tips:', error, content);
    throw new Error('Invalid technique tips format received');
  }
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
  const prompt = `As a cultural cuisine expert, generate detailed cultural context and serving etiquette information for ${cuisine.name} cuisine from ${cuisine.region}.

  For narrative sections, provide flowing text:
  - History: Background and origins
  - Traditions: Key culinary traditions
  - Festivals: Important celebrations
  - Influences: Cultural influences
  - General Etiquette: Overall guidelines

  For bullet-pointed sections, format each point starting with "• " and separate with "\\n":
  - Table Setting: List traditional table arrangements
  - Dining Customs: List specific dining rules
  - Serving Order: List course sequence
  - Taboos: List things to avoid

  Return response in this exact JSON format:
  {
    "culturalContext": {
      "history": "Flowing narrative text...",
      "traditions": "Flowing narrative text...",
      "festivals": "Flowing narrative text...",
      "influences": "Flowing narrative text..."
    },
    "servingEtiquette": {
      "tableSetting": "• Point 1\\n• Point 2\\n• Point 3",
      "diningCustoms": "• Point 1\\n• Point 2\\n• Point 3",
      "servingOrder": "• Point 1\\n• Point 2\\n• Point 3",
      "taboos": "• Point 1\\n• Point 2\\n• Point 3",
      "general": "Flowing narrative text..."
    }
  }`;

  const response = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are an expert in global cuisines and cultural food traditions. For bullet-pointed sections (tableSetting, diningCustoms, servingOrder, taboos), format each item with '• ' prefix and '\\n' separator. Use flowing narrative text for other sections."
      },
      { role: "user", content: prompt }
    ],
    model: "mixtral-8x7b-32768",
    temperature: 0.4,
    max_tokens: 2000
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('No response from cultural details generation API');

  try {
    const cleanedContent = content
      .trim()
      .replace(/```json\n?|\n?```/g, '')
      .replace(/^[^{]*({[\s\S]*})[^}]*$/, '$1')
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      .replace(/\n/g, '\\n')
      .replace(/\\\\n/g, '\\n')
      .replace(/,(\s*[}\]])/g, '$1');

    const parsed = JSON.parse(cleanedContent);

    // Process bullet-pointed sections
    const bulletSections = ['tableSetting', 'diningCustoms', 'servingOrder', 'taboos'];
    bulletSections.forEach(section => {
      if (typeof parsed.servingEtiquette[section] === 'string') {
        // Split content into points and ensure proper bullet point format
        const points = parsed.servingEtiquette[section]
          .split(/(?:\\n|\n|\.(?=\s|$))/)
          .map(point => point.trim())
          .filter(point => point.length > 0)
          .map(point => point.replace(/^[•\-]\s*/, '')); // Remove existing bullets

        // Reconstruct with proper bullet point format
        parsed.servingEtiquette[section] = points
          .map(point => `• ${point}`)
          .join('\n');
      }
    });

    return parsed;
  } catch (error) {
    console.error('Failed to parse cultural details:', error);
    throw new Error('Invalid cultural details format received');
  }
}

interface IngredientSubstitution {
  original: string;
  substitute: string;
  notes: string;
  flavorImpact: 'minimal' | 'moderate' | 'significant';
}

export function findIngredientSubstitutes(
  recipe: CulturalRecipe,
  pantryItems: PantryItem[],
  userRegion: string
): IngredientSubstitution[] {
  const authenticIngredients = recipe.authenticIngredients as string[];
  const substitutions: IngredientSubstitution[] = [];
  
  // Use predefined substitution rules based on ingredient properties
  const substitutionRules = getSubstitutionRules();
  
  for (const ingredient of authenticIngredients) {
    const rule = substitutionRules[ingredient.toLowerCase()];
    if (rule) {
      // Check if user has any of the substitute ingredients in pantry
      const availableSubstitute = rule.substitutes.find(sub => 
        pantryItems.some(item => item.name.toLowerCase().includes(sub.toLowerCase()))
      );

      if (availableSubstitute) {
        substitutions.push({
          original: ingredient,
          substitute: availableSubstitute,
          notes: rule.notes,
          flavorImpact: rule.flavorImpact
        });
      } else {
        // Suggest the first substitute if none available in pantry
        substitutions.push({
          original: ingredient,
          substitute: rule.substitutes[0],
          notes: rule.notes,
          flavorImpact: rule.flavorImpact
        });
      }
    }
  }
  
  return substitutions;
}

export function analyzeAuthenticityScore(
  recipe: CulturalRecipe,
  usedSubstitutions: IngredientSubstitution[]
): {
  score: number;
  feedback: string[];
} {
  let score = 100;
  const feedback: string[] = [];
  
  // Calculate impact of substitutions
  for (const sub of usedSubstitutions) {
    switch (sub.flavorImpact) {
      case 'minimal':
        score -= 5;
        feedback.push(`Using ${sub.substitute} instead of ${sub.original} has minimal impact on authenticity`);
        break;
      case 'moderate':
        score -= 10;
        feedback.push(`Using ${sub.substitute} instead of ${sub.original} moderately affects the authentic flavor`);
        break;
      case 'significant':
        score -= 20;
        feedback.push(`Using ${sub.substitute} instead of ${sub.original} significantly changes the traditional taste`);
        break;
    }
  }
  
  return { score: Math.max(0, score), feedback };
}

export function findComplementaryDishes(
  recipe: CulturalRecipe,
  cuisine: { region: string; keyIngredients: string[] }
): {
  mainDishes: string[];
  sideDishes: string[];
  desserts: string[];
  beverages: string[];
} {
  // Use traditional pairing rules from cuisine's cultural context
  const pairings = getTraditionalPairings(cuisine.region.toLowerCase().replace(/\s+/g, '_'));
  return {
    mainDishes: pairings.mainDishes || [],
    sideDishes: pairings.sideDishes || [],
    desserts: pairings.desserts || [],
    beverages: pairings.beverages || [],
  };
}

export function getServingEtiquetteGuide(
  recipe: CulturalRecipe,
  region: string
): {
  presentation: string[];
  customs: string[];
  taboos: string[];
  servingOrder: string[];
} {
  // Fetch cultural etiquette rules for the region
  const etiquette = getRegionalEtiquette(region.toLowerCase().replace(/\s+/g, '_'));
  return {
    presentation: etiquette.presentation || [],
    customs: etiquette.customs || [],
    taboos: etiquette.taboos || [],
    servingOrder: etiquette.servingOrder || [],
  };
}

export async function getPairings(recipe: CulturalRecipe, cuisine: CulturalCuisine) {
  // Use the traditional pairings based on cuisine region
  return findComplementaryDishes(recipe, {
    region: cuisine.region,
    keyIngredients: Array.isArray(cuisine.keyIngredients) ? 
      cuisine.keyIngredients : 
      Object.keys(cuisine.keyIngredients || {})
  });
}

export async function getEtiquette(recipe: CulturalRecipe, cuisine: CulturalCuisine) {
  // Use the etiquette guide based on cuisine region
  return getServingEtiquetteGuide(recipe, cuisine.region);
}

export async function getSubstitutions(recipe: CulturalRecipe, cuisine: CulturalCuisine) {
  // Assuming we have access to user pantry and region from context
  // For now, providing empty pantry items as this would typically come from user data
  const substitutions = findIngredientSubstitutes(recipe, [], cuisine.region);
  const authenticityResults = analyzeAuthenticityScore(recipe, substitutions);

  return {
    substitutions,
    authenticityScore: authenticityResults.score,
    authenticityFeedback: authenticityResults.feedback
  };
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