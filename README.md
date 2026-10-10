# Typing Diary — Frontend

Static HTML, CSS, and JavaScript client. It has no Vite, React, bundler, or build step.

## Deploy

1. Edit `config.js` and set `window.TYPING_DIARY_API_URL` to the deployed backend origin, such as `https://diary-api.example.com`.
2. Deploy this `frontend/` folder as its own static Vercel project (or any static web host). No build command is needed.
3. Set `FRONTEND_URL` and `FRONTEND_ORIGIN` in the backend project to the resulting frontend origin.

For local development, serve this folder on port 5500 and run the backend on port 8080. The default `config.js` points to `http://localhost:8080`.
