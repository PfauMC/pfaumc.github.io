# PfauMC

Сайт Minecraft-сервера [pfaumc.io](https://pfaumc.io) — React + Vite + Tailwind, деплой на Netlify.

## Стек

- React 18 + React Router 7
- Vite 8
- Tailwind CSS
- Netlify Functions (серверная часть API)
- Netlify Blobs (статистика игроков) + Netlify DB / Neon Postgres (форум)

## Структура

```
src/
  components/       переиспользуемые UI-компоненты
    forum/          UI форума (редактор, сообщения, уведомления, меню игрока)
  context/          React-контексты (тема, сессия форума)
  data/             статические данные
  hooks/            кастомные хуки
  lib/              клиентские утилиты форума (API, разметка, форматирование)
  pages/            страницы; pages/wiki — вики, pages/forum — форум
  utils/
netlify/functions/  серверлесс-функции API
  _lib/forum/       серверная логика форума + schema.sql
scripts/            служебные скрипты (миграции, selfcheck)
docs/               документация API (в т.ч. для Minecraft-плагина)
public/             статика
```

## Разработка

```bash
npm install
npm run dev        # фронтенд без функций
netlify dev        # фронтенд + функции + локальная БД
npm run build      # прод-сборка в dist/
npm run selfcheck  # проверки чистой логики (без сети и БД)
```

## Форум

Полноценный форум с разделами, категориями, темами, ответами, реакциями, подписками,
уведомлениями, поиском, жалобами и модерацией. Авторизация — только через
Minecraft (`/login` в игре), сессия в `HttpOnly`-cookie.

### Первый запуск

```bash
netlify db init                                  # создаёт Netlify DB (Neon)
netlify env:set FORUM_PLUGIN_SECRET "$(node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))")"
netlify dev:exec npm run db:migrate              # применяет schema.sql
```

Выдать модератора:

```sql
UPDATE forum_users SET role_key = 'moderator' WHERE name_lower = 'ник';
```

Разделы и категории не зашиты в код — модератор создаёт их прямо в интерфейсе
форума: на главной кнопки «+ Раздел», «+ Категория» и «+ Тема».

### Переменные окружения

| Переменная                  | Обязательна | По умолчанию | Назначение                          |
|-----------------------------|-------------|--------------|-------------------------------------|
| `NETLIFY_DATABASE_URL`      | да          | —            | Postgres форума (`netlify db init`) |
| `FORUM_PLUGIN_SECRET`       | да          | —            | секрет для API выдачи токенов входа |
| `FORUM_SITE_URL`            | нет         | `URL`        | база для ссылки `/auth/game`        |
| `FORUM_LOGIN_TOKEN_TTL_SEC` | нет         | `300`        | срок жизни одноразового токена      |
| `FORUM_SESSION_DAYS`        | нет         | `30`         | срок «Запомнить меня»               |
| `FORUM_POST_COOLDOWN_SEC`   | нет         | `15`         | пауза между сообщениями             |

Документация для разработчика Minecraft-плагина: [`docs/forum-auth-api.md`](docs/forum-auth-api.md).

## Источники данных

Данные об игроках и статистика сервера приходят из **игрового бэкенда**
(`pfaumc-backend`, публичный API `/api/v1/*`). Сайт ходит туда прямо из браузера:
у бэкенда есть CORS-разрешение для pfaumc.io, поэтому своя прослойка не нужна и
эта часть работает даже на статическом хостинге.

| Переменная | По умолчанию | Назначение |
|---|---|---|
| `VITE_GAME_API_URL` | `https://auth.pfaumc.io` | адрес игрового бэкенда, задаётся на сборке |

Что берётся оттуда: список онлайна, поиск по нику, профиль игрока (наигранное
время, теплокарта активности, роль), почасовая история онлайна для графика.

Внешний мониторинг `mcwatch.online` остался только для того, чего нет в бэкенде:
слоты, версия, MOTD и аптайм. Если он недоступен, страница статистики просто
показывает меньше данных.

## API

Роуты `/api/*` обслуживаются Netlify Functions (см. `netlify.toml`):

- `GET  /api/players/online` — онлайн-игроки
- `GET  /api/players/search` — поиск игрока
- `GET  /api/players/profile` — профиль игрока
- `POST /api/tbank` — оплата донатов (Т-Банк)
- `/api/auth/*` — вход через Minecraft, сессии, настройки уведомлений
- `/api/forum/*` — категории, темы, сообщения, поиск, уведомления, модерация

## Деплой

Автоматический через Netlify при пуше в `main` (`netlify.toml`: `npm run build`,
публикация `dist/`). Форуму нужна привязанная Netlify DB и переменные окружения
из таблицы выше.
