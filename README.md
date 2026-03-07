# Performance Task App

A simple, mobile-friendly task tracker built with plain HTML, CSS, and JavaScript. Tasks persist using localStorage and a progress bar visualizes completion.

## Files
- [index.html](index.html) — Main page and markup
- [style.css](style.css) — Styles and responsive layout
- [script.js](script.js) — Task logic, localStorage, progress bar

## Features
- Add a task
- Mark tasks completed
- Delete tasks
- Progress bar showing percent completed
- Data persisted in the browser via `localStorage`

## Run locally
No build tools required. Just open `index.html` in a browser, or serve the folder with a static server.

Example using Python (optional):
```bash
python -m http.server 8000
# then open http://localhost:8000
```

## Deploy to GitHub Pages
1. Commit and push your repository to GitHub (main branch or a branch you prefer):
```bash
git add .
git commit -m "Add Performance Task App"
git push origin main
```
2. In your repository on GitHub, go to Settings → Pages, set Source to `main` branch and `/ (root)`, then save.
3. After a minute, your site will be available at `https://<your-username>.github.io/<your-repo>`.

Alternative: use `gh` (GitHub CLI) to quickly publish pages if configured:
```bash
gh pages deploy --branch main --path ./
```

## Notes
- The app stores tasks only in the browser's `localStorage` (no server). Deleting browser data will remove tasks.
- The UI is intentionally minimal and optimized for mobile.