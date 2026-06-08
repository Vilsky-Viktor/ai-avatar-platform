# ui-app

React frontend for the Loom24 platform. Lets users create digital avatars, generate photos and videos, and browse their media library.

## Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Firebase (Authentication + Firebase Storage)
- React Router
- TanStack Virtual (virtualised media grids)
- Axios

## Features

- Google OAuth sign-in via Firebase Authentication
- Avatar creation wizard with multi-angle photo upload and cropping
- Avatar photo, video, and audio generation
- Paginated, virtualised media grid with thumbnails
- Media sharing

## Running locally

```bash
npm run dev
```

The dev server runs at `http://localhost:5173` with HMR.

## Building

```bash
npm run build
```

Output is in `dist/`.

## Environment

Configure Firebase in `src/firebase.ts`. No `.env` file is required for the frontend — all Firebase config is embedded in the source.
