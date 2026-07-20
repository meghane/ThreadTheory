# ThreadTheory

Wardrobe management and outfit recommendation web app.

**Technology Stack:** React 18 + Vite · React Router v6 · Supabase (auth, database, image storage) · Open-Meteo (free weather API)

---

## Setup

### 1. Install dependencies
```
npm install
```

### 2. Add environment variables
```
cp .env.example .env.local
```
Fill in your Supabase URL and anon key — get them from your Supabase project under Settings → API.

### 3. Run the database schema
Open `supabase_schema.sql` in the Supabase SQL Editor and run it. Then go to Storage and create a public bucket called `clothing-images`.

### 4. Start the dev server
```
npm run dev
```

---

## Project structure

```

database/
└── supabase_schema.sql        // All SQL tables + schema for Supabase

docs/
└── info doc.pdf               // Project documentation

node_modules/

src/
├── components/
│   ├── ClothingCard.jsx       // Single wardrobe item card
│   ├── Navbar.jsx             // Top navigation bar
│   └── OutfitCard.jsx         // Outfit suggestion card (save outfit button)
│
├── context/
│   └── AuthContext.jsx        // Authentication state + useAuth hook
│
├── hooks/
│   └── useWeather.js          // Weather API hook (Open-Meteo)
│
├── pages/
│   ├── AddItemPage.jsx        // Add new clothing item
│   ├── AuthPage.jsx           // Login / signup
│   ├── EditItemPage.jsx       // Edit clothing item
│   ├── LandingPage.jsx        // Homepage / landing screen
│   ├── OutfitsPage.jsx        // Outfit generator (weather + rules)
│   ├── ProfilePage.jsx        // User preferences + stats
│   ├── SavedOutfitsPage.jsx   // Saved outfits from Supabase
│   └── WardrobePage.jsx       // Clothing grid + filters
│
├── services/
│   ├── gemini.js              // Google AI Implementation
│   ├── outfitEngine.js        // Outfit generation logic (rule-based)
│   └── supabase.js            // Supabase client + database functions
│
├── index.css                  // Global styles + design system tokens
└── main.jsx                   // React app entry point

.env.local                     // Environment variables (Supabase keys)

index.html                     // Vite root HTML file

package.json
package-lock.json
README.md
vite.config.js
```
---
## Dataset

ThreadTheory uses the **Fashion Product Images Dataset** from Kaggle as its primary dataset. This dataset is supplemented with clothing images uploaded by the developers to test wardrobe management, outfit generation, and AI recommendations.

---

## Deployment

The application is deployed using Netlify and can be accessed at:

**https://threadtheoryapp.netlify.app**

