# AIndroCode - Project Setup Guide

## Overview

AIndroCode is a mobile-first, AI-powered IDE that runs entirely in the browser. It combines the power of Monaco Editor (VSCode's core), AI assistance via Claude 3.7 Sonnet, and code execution through e2b sandboxes.

## Architecture

### Frontend
- **React** with TypeScript
- **Monaco Editor** for code editing
- **TailwindCSS** with custom design system
- **Framer Motion** for animations
- **IndexedDB** for local project storage
- **PWA** support for installability

### Authentication
- **Firebase Auth** (Email/Password to start, can extend to Google/GitHub/Microsoft)

### Storage
- **Local**: IndexedDB for offline project persistence
- **Cloud**: Firestore for optional cloud sync (to be implemented)

### AI Integration
- **Claude 3.7 Sonnet** via user-provided API key
- API keys stored locally in browser (localStorage)
- AI Mode is opt-in

### Code Execution
- **e2b Sandbox API** (to be integrated)
- Backend endpoint at `/api/run`

## Current Status (v1)

### ✅ Implemented
- Beautiful dark theme with Aurora gradient background
- Monaco Editor integration
- File explorer with CRUD operations
- Terminal UI with execution structure
- AI Chat sidebar (UI ready)
- Firebase Authentication (Email/Password)
- Settings page with AI Mode toggle
- PWA manifest for installability
- Mobile-responsive layout
- Design system with semantic tokens

### 🚧 To Be Implemented
- e2b sandbox integration for actual code execution
- Claude API integration for AI features
- Multiple language support (Python, C, C++, Go, Rust, etc.)
- Cloud sync via Firestore
- OAuth providers (Google, GitHub, Microsoft)
- Advanced terminal features
- Code collaboration
- Project templates

## Setup Instructions

### 1. Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Fill in your Firebase credentials:
- Create a project at https://console.firebase.google.com
- Enable Authentication (Email/Password)
- Copy your config values to `.env`

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:8080`

### 4. User Flow

1. **Sign Up**: Users create an account at `/auth`
2. **IDE**: Main coding interface at `/`
3. **Settings**: Configure AI Mode at `/settings`
4. **AI Setup**: Users paste their own Anthropic API key (get from https://console.anthropic.com)

### 5. PWA Installation

To test PWA features:
1. Build the project: `npm run build`
2. Serve the build: `npm run preview` or use a static server
3. Open in Chrome/Edge on mobile
4. Use "Add to Home Screen" option

## Firebase Setup

1. Go to https://console.firebase.google.com
2. Create a new project
3. Enable Authentication → Email/Password
4. (Optional) Add Firestore for cloud sync
5. Copy config to `.env`

## AI Mode Setup (For Users)

Users need their own Anthropic API key:
1. Go to https://console.anthropic.com
2. Create an account and get API key
3. In AIndroCode Settings → AI Mode
4. Toggle ON and paste API key
5. API key is stored locally in browser only

## e2b Integration (To Be Implemented)

For code execution:
1. Sign up at https://e2b.dev
2. Get API key
3. Add to backend `.env` as `E2B_API_KEY`
4. Implement `/api/run` endpoint

## Security Notes

- User API keys are **never** sent to your backend
- User API keys are stored in browser localStorage
- Firebase credentials are in `.env` (keep secret)
- e2b API key is backend-only (never exposed to client)

## Deployment

### Vercel
```bash
npm run build
vercel --prod
```

### Netlify
```bash
npm run build
netlify deploy --prod
```

### Firebase Hosting
```bash
npm run build
firebase deploy
```

## Development Roadmap

### Phase 1: Core IDE (Current)
- ✅ Editor, File Explorer, Terminal UI
- ✅ Auth and Settings
- ✅ PWA Setup

### Phase 2: Execution
- 🚧 e2b sandbox integration
- 🚧 Multi-language support
- 🚧 Real terminal output

### Phase 3: AI Features
- 🚧 Claude API integration
- 🚧 AI code generation
- 🚧 AI debugging loop
- 🚧 Smart suggestions

### Phase 4: Collaboration
- 🚧 Cloud sync
- 🚧 Project sharing
- 🚧 Real-time collaboration

## Tech Stack Details

- **React 18** with hooks
- **TypeScript** for type safety
- **Monaco Editor** (VSCode engine)
- **TailwindCSS** with design system
- **Firebase** for auth and storage
- **Framer Motion** for animations
- **e2b** for code execution
- **Anthropic Claude** for AI

## Contributing

This is a foundation. You can extend it with:
- More language support
- Advanced editor features
- Debugging tools
- Git integration
- Extensions/plugins

## License

MIT License - Feel free to use and modify!
