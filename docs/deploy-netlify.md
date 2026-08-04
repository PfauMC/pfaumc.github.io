# Переезд pfaumc.io с GitHub Pages на Netlify

## Текущая конфигурация (проверено 4 августа 2026)

| Что | Как настроено |
|---|---|
| Хостинг | GitHub Pages, `status: built`, `build_type: workflow` |
| Домен | `cname: pfaumc.io`, HTTPS принудительный |
| Источник Pages | ветка `gh-pages` |
| Воркфлоу | `.github/workflows/deploy.yml` «Deploy to GitHub Pages», активен, на пуш в `main` |
| DNS | `pfaumc.io` → Cloudflare (проксируется) → GitHub Pages |
| Интеграция с Netlify | **отсутствует** — ни секретов, ни воркфлоу, ни привязанного проекта |

То есть со стороны GitHub всё настроено правильно и работает: последний прогон
задеплоил `main` за 46 секунд. Проблема не в настройке, а в платформе — Pages
раздаёт только статику и выполнять серверный код не умеет в принципе.

## Зачем переезжать

Сейчас сайт отдаётся с GitHub Pages (воркфлоу `.github/workflows/deploy.yml` на пуш в `main`).
Pages раздаёт только статику: `netlify.toml` там игнорируется, функции из
`netlify/functions/` не выполняются. Поэтому **любой `/api/*` отвечает 404 и HTML**,
и не работают форум, статистика, список игроков и оплата донатов.

Проверить текущее состояние:

```bash
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" https://pfaumc.io/api/players/online
# 404 text/html  -> серверной части нет
# 200 application/json -> уже на Netlify
```

## Порядок действий

### 1. Подключить репозиторий

```bash
netlify login
netlify link          # или netlify init, если проекта в Netlify ещё нет
```

Build-команда и каталоги уже прописаны в `netlify.toml` — менять в интерфейсе
ничего не нужно:

```toml
command   = "npm run build"
publish   = "dist"
functions = "netlify/functions"
```

### 2. Завести базу форума

```bash
netlify db init       # создаёт Netlify DB (Neon) и переменную NETLIFY_DATABASE_URL
```

### 3. Переменные окружения

```bash
netlify env:set FORUM_PLUGIN_SECRET "$(node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))")"
```

Обязательные и необязательные переменные — в таблице в [README](../README.md#переменные-окружения).
Не забудьте про уже существующие ключи Т-Банка для `/api/tbank`, если они были
заданы в старом окружении.

### 4. Применить схему форума

```bash
netlify dev:exec npm run db:migrate
```

Скрипт идемпотентный, его можно запускать повторно.

### 5. Выдать себе модератора

```sql
UPDATE forum_users SET role_key = 'moderator' WHERE name_lower = 'ваш_ник_в_нижнем_регистре';
```

Пользователь появляется в базе после первого входа через `/login`, так что
сначала войдите на форум, потом выполните запрос.

### 6. Проверить деплой до переключения домена

Netlify выдаёт адрес вида `имя-проекта.netlify.app`. На нём:

```bash
SITE=https://имя-проекта.netlify.app
for p in /api/server/stats /api/forum/categories /api/players/online; do
  printf "%-26s " "$p"; curl -s -o /dev/null -w "%{http_code} %{content_type}\n" "$SITE$p"
done
# ожидаем 200 application/json на всех трёх
```

### 7. Переключить DNS в Cloudflare

Домен проксируется через Cloudflare, поэтому менять записи нужно там, а не у
регистратора. В Netlify: Domain management → Add custom domain → `pfaumc.io`,
дальше по их инструкции заменить целевую запись в Cloudflare.

Если запись останется «оранжевой» (проксируемой), Netlify не сможет выпустить
свой сертификат — либо переведите запись в DNS only, либо оставьте проксирование
и настройте SSL в Cloudflare в режиме Full (strict).

До этого шага сайт продолжает отдаваться с Pages и ничего не ломается.

### 8. Выключить GitHub Pages

Только **после** того, как домен поедет на Netlify, иначе останутся два
источника правды:

```bash
gh workflow disable "Deploy to GitHub Pages" --repo PfauMC/pfaumc.github.io
gh api -X DELETE repos/PfauMC/pfaumc.github.io/pages     # выключить публикацию
```

Ветку `gh-pages` после этого можно удалить. Секрет `ACTIONS_DEPLOY_KEY`
(заведён в 2024 году) тоже станет не нужен.

## Что проверить после переезда

| Страница | Что должно работать |
|---|---|
| `/stats` | Онлайн, аптайм, график за две недели |
| `/players` | Список онлайна и поиск по нику |
| `/forum` | Разделы и категории, вход по `/login` |
| `/donate` | Оплата через Т-Банк (если включена) |

## Для разработчика Minecraft-плагина

После переезда заработает `POST /api/auth/login-token` — формат запроса,
коды ошибок и переменные окружения описаны в
[`docs/forum-auth-api.md`](forum-auth-api.md).

## Локальная разработка от переезда не зависит

`npm run dev:api` поднимает функции на PGlite без Netlify-аккаунта — см. README.
