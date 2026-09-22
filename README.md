# Typing Diary frontend

This folder is the plain HTML, CSS, and JavaScript client.

## Run

Start the backend first on port 8080, then open a second terminal:

```bash
cd frontend
python3 -m http.server 5500
```

Open `http://localhost:5500` in your browser. The frontend automatically sends API requests to `http://localhost:8080`.

You can also use any static file server such as VS Code Live Server. Keep the frontend on port `5500`, or update the allowed origin list in `backend/server.js`.
## Cross-device sync

Diary entries are loaded from the signed-in account through the backend API, not from browser-only storage. Page design metadata (font, page style, text size, spacing, width, alignment, and text color) is stored with each entry. Global appearance preferences can also be synced to the account.

For a Vercel deployment, configure the backend with a durable Upstash Redis database using `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`, plus a stable `SESSION_SECRET`. Without a durable database, serverless instances cannot safely provide cross-device persistence.
