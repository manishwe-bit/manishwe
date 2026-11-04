# Frontend as a container, for hosts that build with Docker (e.g. a Render "Docker" web service with an
# empty Root Directory). Render can also serve it as a free Static Site instead: see render.yaml.
FROM node:22-alpine AS build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
# Where the browser finds the API. Override with --build-arg / the host's build env var.
ARG VITE_API_URL=https://manish-kaiwarty-api.onrender.com
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:1.27-alpine
# The nginx image fills ${PORT} into this template at start-up (hosts like Render set PORT).
COPY deploy/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
ENV PORT=10000
EXPOSE 10000
