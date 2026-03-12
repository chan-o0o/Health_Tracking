# Health Trak PWA

A mobile-first health tracking application for fasting, workouts, and weight.

**I completed it using only gemini CLI**

## Features
- **Fasting:** Single-toggle "Ate" button with real-time timer and history.
- **Workout:** Start/End recording with muscle group selection and duration tracking.
- **Weight:** Daily weight logging with progress photo support (up to 3 photos).
- **Offline:** Works fully offline using IndexedDB and Service Workers.
- **UI:** Minimal, dark-mode, mobile-optimized design with large buttons.

## Local Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run dev server:**
   ```bash
   npm run dev
   ```

3. **Build and Preview PWA:**
   ```bash
   npm run build
   ```
   To test the PWA functionality, you need to serve the `dist` folder.
   ```bash
   npx vite preview
   ```

## Tech Stack
- React + TypeScript + Vite
- Tailwind CSS
- Dexie.js (IndexedDB)
- Lucide React (Icons)
- vite-plugin-pwa

## Mobile Installation
1. Open the URL in Safari on iPhone.
2. Tap the **Share** button.
3. Select **Add to Home Screen**.


