# PfauMC

Сайт Minecraft-сервера [pfaumc.io](https://pfaumc.io) — React + Vite + Tailwind, деплой на Netlify.

## Стек

- React 18 + React Router 7
- Vite 8
- Tailwind CSS
- Netlify Functions (серверная часть API) + Netlify Blobs (хранилище)

## Структура

```
src/
  components/   переиспользуемые UI-компоненты
  context/      React-контексты (тема и т.п.)
  data/         статические данные
  hooks/        кастомные хуки
  pages/        страницы, включая pages/wiki — вики сервера
  utils/
netlify/functions/  серверлесс-функции API (игроки, донат, статистика)
scripts/            служебные скрипты (players-selfcheck.mjs)
public/             статика
```

## Разработка

```bash
npm install
npm run dev       # локальный сервер разработки
npm run build     # прод-сборка в dist/
npm run preview   # предпросмотр прод-сборки
```

## API

Роуты `/api/*` проксируются на Netlify Functions (см. `netlify.toml`):

- `GET /api/players/online` — онлайн-игроки
- `GET /api/players/search` — поиск игрока
- `GET /api/players/profile` — профиль игрока
- `POST /api/tbank` — оплата донатов (Т-Банк)

## Деплой

Автоматический через Netlify при пуше в `main` (`netlify.toml`: `npm run build`, публикация `dist/`).
