# The whole site as ONE service: build the React frontend, then run the FastAPI backend,
# which serves both the website and /api/* (chat, live cursors, forms, admin) from the same URL.
# Render: New > Web Service > this repo (it finds this Dockerfile), or the "Deploy to Render" button.

FROM node:22-alpine AS frontend
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
# Same origin: the API lives on the same host as the site.
ENV VITE_API_URL=""
RUN npm run build

FROM python:3.12-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/app ./app
COPY --from=frontend /app/dist ./static
ENV STATIC_DIR=/app/static PORT=10000
EXPOSE 10000
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --proxy-headers --forwarded-allow-ips "*"
