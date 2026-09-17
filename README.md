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