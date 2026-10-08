# Agenda da Psicóloga

Laravel 13 (API) + React/TypeScript + Tailwind v4 (liquid glass) + PostgreSQL + Redis, tudo via Docker.

```bash
UID=$(id -u) GID=$(id -g) docker compose up -d --build
```

- App: http://localhost:5174  (o Vite repassa `/api` ao Laravel, sem CORS)
- API direta: http://localhost:8081/api
- Postgres: localhost:5433 · Redis: localhost:6381 (portas altas para não colidir com outros projetos)

Avisos sonoros/notificações funcionam com a aba aberta (checagem a cada 20 s).
