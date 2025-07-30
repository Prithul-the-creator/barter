# Barter.com - Peer-to-Peer Trading Platform

A modern web application for bartering items between users, built with React, TypeScript, and Supabase.

## Features

- 🔐 **User Authentication** - Secure login/signup with Supabase
- 📱 **Responsive Design** - Works on desktop and mobile
- 🛡️ **Protected Routes** - Only logged-in users can list items
- 💬 **Messaging System** - Chat with other traders
- 👤 **User Profiles** - Manage your trades and settings
- 🔍 **Search & Filter** - Find items to trade

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Routing**: React Router DOM

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd barter
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   
   Create a new project at [supabase.com](https://supabase.com) and get your project URL and anon key.

   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## Supabase Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project
4. Wait for the project to be set up

### 2. Get Your Credentials

1. Go to your project dashboard
2. Navigate to Settings > API
3. Copy your Project URL and anon/public key
4. Add them to your `.env` file

### 3. Database Schema (Coming Soon)

The database tables will be set up automatically when you first run the application.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── Navbar.tsx      # Navigation bar
│   ├── TradeCard.tsx   # Trade item card
│   └── ...
├── pages/              # Page components
│   ├── Index.tsx       # Home page
│   ├── Browse.tsx      # Browse trades
│   ├── Login.tsx       # Authentication
│   └── ...
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication context
├── lib/                # Utility libraries
│   ├── supabase.ts     # Supabase client
│   └── utils.ts        # Helper functions
└── hooks/              # Custom React hooks
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
