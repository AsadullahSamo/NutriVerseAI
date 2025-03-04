import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '../db';
import { users, stores, priceHistory, storeSpecificLists, smartShoppingInsights, shoppingPreferences } from '../../shared/schema';
import { eq } from 'drizzle-orm';

describe('Smart Shopping AI Features', () => {
  let userId: number;
  let storeId: number;

  beforeAll(async () => {
    // Create test user
    const [user] = await db.insert(users).values({
      username: 'testuser',
      password: 'testpass',
      preferences: {}
    }).returning({ id: users.id });
    userId = user.id;

    // Create test store
    const [store] = await db.insert(stores).values({
      name: 'Test Store',
      location: { lat: 40.7128, lng: -74.0060 },
      businessHours: {
        monday: { open: '09:00', close: '21:00' },
        tuesday: { open: '09:00', close: '21:00' },
        wednesday: { open: '09:00', close: '21:00' },
        thursday: { open: '09:00', close: '21:00' },
        friday: { open: '09:00', close: '21:00' },
        saturday: { open: '10:00', close: '20:00' },
        sunday: { open: '10:00', close: '20:00' }
      },
      popularTimes: {
        monday: [10, 20, 30, 50, 70, 90, 80, 60, 40, 20, 10, 5],
        tuesday: [10, 20, 30, 50, 70, 90, 80, 60, 40, 20, 10, 5]
      },
      currentCrowdLevel: 'medium',
      storeLayout: {
        sections: [
          { name: 'Produce', location: 'front' },
          { name: 'Dairy', location: 'back' }
        ]
      },
      specialFeatures: {
        selfCheckout: true,
        curbsidePickup: true
      }
    }).returning({ id: stores.id });
    storeId = store.id;
  });

  it('should create and retrieve shopping preferences', async () => {
    const preferences = {
      preferredStores: [{ id: storeId, name: 'Test Store' }],
      budgetLimits: { weekly: 200, monthly: 800 },
      dietaryRestrictions: ['vegetarian', 'no-nuts'],
      sustainabilityPreferences: { localProduce: true, organicPreferred: true },
      shoppingSchedule: { preferredDays: ['saturday', 'wednesday'] },
      aiPersonalization: { priceAlerts: true, crowdAvoidance: true }
    };

    await db.insert(shoppingPreferences).values({
      userId,
      preferredStores: [preferences.preferredStores],
      budgetLimits: preferences.budgetLimits,
      dietaryRestrictions: preferences.dietaryRestrictions,
      sustainabilityPreferences: preferences.sustainabilityPreferences,
      shoppingSchedule: preferences.shoppingSchedule,
      aiPersonalization: preferences.aiPersonalization
    });

    const result = await db.query.shoppingPreferences.findFirst({
      where: eq(shoppingPreferences.userId, userId)
    });

    expect(result).toBeDefined();
    expect(result?.budgetLimits).toEqual(preferences.budgetLimits);
  });

  it('should track price history with AI predictions', async () => {
    const priceData = {
      storeId,
      productName: 'Organic Bananas',
      price: 2.99,
      unit: 'lb',
      priceType: 'regular',
      competitivePricing: {
        averagePrice: 3.25,
        lowestPrice: 2.75,
        trend: 'stable'
      },
      priceTrend: {
        last30Days: [2.89, 2.99, 3.09, 2.99],
        prediction: 'slight_increase'
      },
      aiPredictedPrice: 3.15
    };

    await db.insert(priceHistory).values(priceData);

    const result = await db.query.priceHistory.findFirst({
      where: eq(priceHistory.productName, 'Organic Bananas')
    });

    expect(result).toBeDefined();
    expect(result?.aiPredictedPrice).toBe(3.15);
  });

  it('should create store-specific shopping list with AI optimizations', async () => {
    const shoppingList = {
      userId,
      storeId,
      name: 'Weekly Groceries',
      items: [
        { name: 'Organic Bananas', quantity: 2, unit: 'lb' },
        { name: 'Almond Milk', quantity: 1, unit: 'gallon' }
      ],
      optimizedRoute: {
        path: ['Produce', 'Dairy'],
        estimatedTime: '15 minutes'
      },
      nutritionAlignment: {
        proteinRich: true,
        lowCarb: false
      },
      sustainabilityScore: 85,
      budgetOptimization: {
        originalTotal: 45.99,
        optimizedTotal: 42.50,
        savings: 3.49
      },
      alternativeItems: [
        {
          original: 'Organic Bananas',
          alternatives: ['Regular Bananas', 'Organic Plantains']
        }
      ],
      mealPlanAlignment: {
        matchesWeeklyPlan: true,
        missingIngredients: []
      },
      aiSuggestions: {
        addItems: ['Spinach', 'Sweet Potatoes'],
        reasoning: 'Based on your meal plan and nutritional goals'
      }
    };

    await db.insert(storeSpecificLists).values(shoppingList);

    const result = await db.query.storeSpecificLists.findFirst({
      where: eq(storeSpecificLists.userId, userId)
    });

    expect(result).toBeDefined();
    expect(result?.sustainabilityScore).toBe(85);
    expect(result?.optimizedRoute).toEqual(shoppingList.optimizedRoute);
  });

  it('should generate and store shopping insights', async () => {
    const insights = {
      userId,
      insights: {
        spendingPatterns: {
          weeklyAverage: 150,
          topCategories: ['Produce', 'Dairy']
        },
        healthScore: 85,
        sustainabilityImpact: 'positive'
      },
      shoppingPatterns: {
        preferredDays: ['saturday', 'wednesday'],
        averageBasketSize: 15,
        frequentItems: ['bananas', 'milk', 'eggs']
      },
      recommendedStores: [
        {
          id: storeId,
          name: 'Test Store',
          matchScore: 0.92,
          reasons: ['price_match', 'organic_selection']
        }
      ],
      personalizedDeals: [
        {
          item: 'Organic Bananas',
          regularPrice: 2.99,
          dealPrice: 2.49,
          expiresAt: new Date().toISOString()
        }
      ],
      budgetAnalysis: {
        monthlyBudget: 800,
        currentSpend: 650,
        projectedSavings: 45,
        recommendations: ['bulk_buying', 'seasonal_shopping']
      }
    };

    await db.insert(smartShoppingInsights).values(insights);

    const result = await db.query.smartShoppingInsights.findFirst({
      where: eq(smartShoppingInsights.userId, userId)
    });

    expect(result).toBeDefined();
    expect(result?.insights).toEqual(insights.insights);
    expect(result?.budgetAnalysis).toEqual(insights.budgetAnalysis);
  });
});