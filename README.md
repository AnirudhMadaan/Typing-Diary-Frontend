# Typing Diary — Frontend

Updated React frontend, prebuilt into static files and served locally by a Python standard-library server. The source build uses esbuild and Tailwind CLI; no Vite is used.

## Local run (no frontend npm install)

The archive includes `dist/`, so only Python 3 is needed to run the frontend. For a separate local frontend/backend, its config automatically points to `http://localhost:8080`; edit `config.js` only if your backend uses a different URL. Alternatively, open the frontend served by the backend for a same-origin setup.

```bash
python serve.py
```

On Windows, `py serve.py` also works. Open `http://localhost:5500`. Python serves the prebuilt React bundle from `dist/`; the UI and its features run in the browser, while the API remains in `../backend/`.

## Rebuild after source changes

Requires Node.js 20+. From this folder:

```bash
npm install --registry=https://registry.npmjs.org
npm run build
```

Set `window.TYPING_DIARY_API_URL` in `config.js` to the deployed backend URL before rebuilding. Publish `dist/` from a static hosting provider. Set the backend's `FRONTEND_URL` and `FRONTEND_ORIGIN` environment variables to this site's exact origin for authenticated API requests.
