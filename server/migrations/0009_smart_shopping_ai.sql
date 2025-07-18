-- Add new fields to stores table
ALTER TABLE stores
ADD COLUMN business_hours JSONB,
ADD COLUMN popular_times JSONB,
ADD COLUMN crowd_level TEXT,
ADD COLUMN store_layout JSONB,
ADD COLUMN special_features JSONB;

-- Add new fields to price_history table
ALTER TABLE price_history
ADD COLUMN price_type TEXT,
ADD COLUMN competitive_pricing JSONB,
ADD COLUMN price_trend JSONB,
ADD COLUMN ai_predicted_price DECIMAL(10,2),
ADD COLUMN best_time_to_buy TIMESTAMP;

-- Add new fields to store_specific_lists table
ALTER TABLE store_specific_lists
ADD COLUMN optimized_route JSONB,
ADD COLUMN nutrition_alignment JSONB,
ADD COLUMN sustainability_score INTEGER,
ADD COLUMN budget_optimization JSONB,
ADD COLUMN alternative_items JSONB,
ADD COLUMN meal_plan_alignment JSONB,
ADD COLUMN ai_suggestions JSONB;

-- Create smart_shopping_insights table
CREATE TABLE smart_shopping_insights (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    insights JSONB NOT NULL,
    shopping_patterns JSONB NOT NULL,
    recommended_stores JSONB NOT NULL,
    personalized_deals JSONB NOT NULL,
    budget_analysis JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- Create shopping_preferences table
CREATE TABLE shopping_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    preferred_stores JSONB[],
    budget_limits JSONB,
    dietary_restrictions JSONB,
    sustainability_preferences JSONB,
    shopping_schedule JSONB,
    ai_personalization JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);