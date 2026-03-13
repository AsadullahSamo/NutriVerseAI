# NutriVerseAI

A smart nutrition and grocery management platform that helps users make healthy eating choices, reduce food waste, and maintain a sustainable kitchen. Features a responsive design that works seamlessly across all devices.

## Features

- 📅 **Smart Meal Planning**
  - Create personalized meal plans
  - AI-powered meal suggestions
  - Track daily calorie targets
  - Handle dietary restrictions
  - Nutritional summaries
  - Interactive calendar view
  - Flexible planning periods

- 🍳 **Smart Recipe Management**
  - Create and share personalized recipes
  - Track nutrition information
  - Fork and customize existing recipes
  - Like and interact with community recipes
  - Sustainability scoring for recipes
  - AI-powered recipe recommendations

- 🎯 **Advanced Nutrition Tracking**
  - Set personalized daily nutrition goals
  - Track calories, protein, carbs, and fat intake
  - Real-time progress visualization
  - Smart meal logging with portion control
  - Nutrition warnings for goal exceedance
  - Visual progress bars and percentage indicators
  - Weekly/Monthly nutrition trends analysis
  - AI-powered nutrition insights
  - Meal-type based consumption tracking
  - Historical nutrition data visualization

- 🛒 **Intelligent Grocery Lists**
  - Create and manage shopping lists
  - Smart substitutions suggestions
  - Track item expiry dates
  - Mark items as completed
  - Mobile-friendly shopping experience

- 🏠 **Smart Pantry**
  - Track ingredients and their expiry dates
  - Categorize items
  - Monitor nutrition information
  - Get alerts for items expiring soon
  - Sustainability tracking
  - Easy inventory management
  - Pantry Analysis

- 🔧 **Kitchen Equipment Management**
  - 📝 Track kitchen equipment inventory
  - 🔔 Monitor equipment condition and maintenance status
  - 📅 AI-powered maintenance schedules
  - ✨ Personalized equipment recommendations 
  - 🍽️ Find recipe matches based on available equipment
  - 🛠️ Get maintenance tips for specific equipment
  - 📊 Equipment usage analysis
  - 🛍️ Shopping suggestions for new kitchen tools

- 👥 **Community Features**
  - Share recipes and cooking experiences
  - Post food rescue tips
  - Share cooking tips

- 🎯 **Mood & Cooking Experience Tracking**
  - 📝 Track how cooking experiences affect your mood
  - 📔 Personal cooking journal for each recipe
  - 🤖 AI-powered mood analysis
  - 🧠 Emotional pattern insights
  - 📈 Track cooking progress and confidence
  - 💫 Recipe-specific mood trends
  - 🔍 View cooking journey insights
  - ⭐ Identify recipes that bring most joy

- 🌎 **Cultural Cuisine**
  - 📖 Deep dive into traditional recipes
  - ✅ Authenticity scoring and analysis
  - 🏺 Cultural context and history
  - 🔄 Traditional ingredient substitutions
  - 🍽️ Serving etiquette and customs
  - 🗺️ Regional variations insights
  - 🤝 Traditional food pairings
  - ⚠️ Cultural taboos awareness
  - 🎨 Presentation guidelines
  - 📋 Proper serving order

- 🔒 **User Account Management**
  - 🛡️ Strict authentication with username/password
  - 🎨 Customizable user profiles with name and avatar
  - 🌈 Personalized accent color themes
  - 🔑 Secure password reset using secret key system
  - 🔄 No email required for password recovery
  - ⚙️ Comprehensive profile settings
  - 📱 Mobile-friendly account management
  - 🚪 Easy login/logout functionality
  - 🗑️ Account deletion with data cleanup
  - 🔐 Strong password validation

## Tech Stack

- **Frontend**:
  - React with TypeScript
  - Shadcn/ui components (based on Radix UI)
  - TailwindCSS for styling
  - React Query for state management
  - React Hook Form for form handling
  - Zod for schema validation
  - Responsive design with mobile-first approach
  - Wouter for lightweight routing

- **Backend**:
  - Node.js with Express
  - PostgreSQL with Drizzle ORM
  - Passport.js for authentication
  - Session-based auth with express-session
  - AI services integration

## Getting Started

1. Clone the repository and navigate to the project directory:
```bash
git clone https://github.com/AsadullahSamo/NutriVerseAI.git
cd NutriVerseAI
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file with:
```
SESSION_SECRET=your_secret_key
BACKEND_PORT=8000
DATABASE_URL=your_neon_db_url (connection string)
VITE_API_BASE_URL=http://localhost:8000
VITE_API_URL=http://localhost:8000
NODE_ENV=development

```

4. Initialize the database:
```bash
npx tsx server/setup-database.ts
```

5. Start the development server:
```bash
npm run dev
```

## Development Scripts

- `npm run dev` - Start development server (client + server)
- `npm run dev:client` - Start client development server
- `npm run dev:server` - Start server development server
- `npm run build` - Build for production
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema changes to database
- `npm run lint` - Run linting
- `npm run check` - Type check TypeScript

## Features by Device

### Desktop
- Full-featured experience
- Side-by-side recipe viewing and editing
- Advanced data visualization
- Comprehensive pantry management

### Tablet
- Optimized touch interface
- Collapsible navigation
- Adaptive layouts for forms and lists
- Touch-friendly recipe interactions

### Mobile
- Hamburger menu navigation
- Simplified recipe views
- Quick access to essential features
- Touch-optimized controls
- Compact lists and forms

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License
