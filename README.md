# Frontend (Next.js)

Frontend проект для аналитики Amplitude backend.

## Setup

1. Скопируйте env:

```bash
cp .env.example .env.local
```

2. Проверьте env в `.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=/api
BACKEND_BASE_URL=http://localhost:8000
```

Production example:

```bash
BACKEND_BASE_URL=https://api.avametric.online
```

По умолчанию frontend обращается к backend через Next.js API proxy (`/api/amplitude/*`), чтобы избежать CORS ошибок типа `Load failed`.

## Run

```bash
npm install
npm run dev
```

Откройте `http://localhost:3000`.

## Dashboard

На главной странице реализовано:

- выбор даты;
- выбор окна `6h / 24h`;
- карточки сводной статистики присутствия;
- таблица активности устройств.

## Architecture & Design Handoff

- Подробный документ: `docs/FRONTEND_ARCHITECTURE_AND_DESIGN.md`
# AmplitudeData-frontend
