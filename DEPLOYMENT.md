# Deployment

This project is set up for Render with:

- `wasto-backend`: Django API service
- `wasto-frontend`: Vite static site
- `wasto-db`: PostgreSQL database

## Render Blueprint

1. Commit and push this repository to GitHub/GitLab/Bitbucket.
2. In Render, create a new Blueprint instance and select this repository.
3. Before applying the blueprint, fill the prompted secret environment variables.
4. After the backend service is created, set:

```text
CORS_ALLOWED_ORIGINS=https://<your-frontend-host>.onrender.com
CSRF_TRUSTED_ORIGINS=https://<your-frontend-host>.onrender.com
VITE_API_URL=https://<your-backend-host>.onrender.com/api/v1
```

5. Redeploy the frontend after setting `VITE_API_URL`.

## Required Secrets

Backend:

- `OPENWEATHERMAP_API_KEY`
- `FIREBASE_SERVER_KEY`, if push notifications are used
- `FIREBASE_CREDENTIALS_PATH`, if Firebase Admin credentials are mounted as a secret file

Frontend:

- `VITE_OPENWEATHER_API_KEY`
- Firebase `VITE_FIREBASE_*` values, if push notifications are used

## Local Production Check

From `backend`:

```bash
pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate
gunicorn wasto_backend.wsgi:application
```

From `frontend`:

```bash
npm ci
npm run build
```
