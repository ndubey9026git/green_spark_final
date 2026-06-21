Summary of deployment steps

1) Frontend (Vercel):
- Set `VITE_API_BASE_URL` in Vercel to your backend URL (e.g. `https://your-backend.com/api`).
- Build command: `npm run build`
- Output directory: `dist`
- Optionally add `frontend/vercel.json` included in repo.

2) Backend (Render):
- Copy `backend/.env.example` to `backend/.env` on your machine or set environment variables in Render.
- Ensure `MONGO_URI` and `JWT_SECRET` are set securely in the Render environment.
- Set `ALLOWED_ORIGINS` to your frontend domain(s), comma-separated.
- Start command: `node server.js` (backend/package.json should include a start script).

3) Security cleanup done:
- Removed committed `backend/.env` and replaced with `.env.example`.
- Replace any remaining secrets in repository before publishing.

4) Media files:
- Backend serves uploaded files from `/uploads`.
- Frontend requests for media use `VITE_API_BASE_URL` (root trimmed) + file URL.

If you want, I can:
- Commit these changes and run `npm run build` in `frontend` to confirm.
- Add a small CI workflow for builds.
