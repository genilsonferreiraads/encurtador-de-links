# URL Shortener System

A URL shortening system built with React, Netlify serverless functions, and Supabase.

## Features

- Create short links with custom slugs
- Redirect users to destination URLs
- Edit destination URLs while maintaining the same short link
- Admin panel to manage links

## Tech Stack

- Frontend: React + TypeScript
- UI Framework: Material-UI
- Backend: Netlify Serverless Functions
- Database: Supabase
- Hosting: Netlify

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a Supabase project and get your credentials
4. Create a `.env` file with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
5. Run the development server:
   ```bash
   npm run dev
   ```

## Database Schema

Table: `links`
- `id` (auto increment)
- `slug` (string, unique)
- `destination_url` (string)
- `created_at` (timestamp)
- `updated_at` (timestamp)

## Project Structure

```
/
├── src/
│   ├── components/      # React components
│   ├── pages/          # Page components
│   ├── services/       # API and Supabase services
│   └── types/          # TypeScript types
├── netlify/
│   └── functions/      # Serverless functions
└── public/            # Static assets
``` 