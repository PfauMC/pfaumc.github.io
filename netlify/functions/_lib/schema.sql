-- Схема форума PfauMC. Идемпотентна — можно запускать повторно.
-- Запуск: npm run db:migrate  (см. scripts/migrate.mjs)
--
-- ВАЖНО: файл разбивается на отдельные выражения по «;» в конце строки,
-- поэтому здесь не должно быть DO-блоков и функций с внутренними «;».

-- ===== Роли =====
CREATE TABLE IF NOT EXISTS forum_roles (
  key          text PRIMARY KEY,
  title        text NOT NULL,
  color        text NOT NULL DEFAULT '#94a3b8',
  rank         integer NOT NULL DEFAULT 0,
  can_moderate boolean NOT NULL DEFAULT false
);

INSERT INTO forum_roles (key, title, color, rank, can_moderate) VALUES
  ('player',    'Игрок',          '#94a3b8', 0,   false),
  ('moderator', 'Модератор',      '#1DA5E8', 50,  true),
  ('admin',     'Администратор',  '#f59e0b', 100, true)
ON CONFLICT (key) DO NOTHING;

-- ===== Пользователи =====
-- Аккаунт вечно привязан к mc_uuid; ник и скин обновляются при каждом входе.
CREATE TABLE IF NOT EXISTS forum_users (
  id                   bigserial PRIMARY KEY,
  mc_uuid              uuid NOT NULL UNIQUE,
  name                 text NOT NULL,
  name_lower           text NOT NULL,
  skin_url             text,
  role_key             text NOT NULL DEFAULT 'player' REFERENCES forum_roles(key) ON UPDATE CASCADE,
  is_banned            boolean NOT NULL DEFAULT false,
  ban_reason           text,
  notify_replies       boolean NOT NULL DEFAULT true,
  notify_mentions      boolean NOT NULL DEFAULT true,
  notify_subscriptions boolean NOT NULL DEFAULT true,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  last_login_at        timestamptz
);

-- ponytail: name_lower без UNIQUE — ник в Minecraft может освободиться и уйти
-- другому игроку. Упоминание @Ник резолвится в самого свежего носителя ника.
CREATE INDEX IF NOT EXISTS forum_users_name_lower_idx ON forum_users (name_lower);

-- ===== Одноразовые токены входа (выдаёт плагин по /login) =====
CREATE TABLE IF NOT EXISTS forum_login_tokens (
  id         bigserial PRIMARY KEY,
  token_hash text NOT NULL UNIQUE,
  mc_uuid    uuid NOT NULL,
  mc_name    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at    timestamptz
);

CREATE INDEX IF NOT EXISTS forum_login_tokens_expires_idx ON forum_login_tokens (expires_at);

-- ===== Сессии =====
-- В базе только SHA-256 от секрета; сам секрет живёт лишь в HttpOnly cookie.
CREATE TABLE IF NOT EXISTS forum_sessions (
  id           bigserial PRIMARY KEY,
  user_id      bigint NOT NULL REFERENCES forum_users(id) ON DELETE CASCADE,
  token_hash   text NOT NULL UNIQUE,
  csrf_token   text NOT NULL,
  remember     boolean NOT NULL DEFAULT false,
  user_agent   text,
  ip           text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL,
  revoked_at   timestamptz
);

CREATE INDEX IF NOT EXISTS forum_sessions_user_idx ON forum_sessions (user_id, revoked_at);

-- ===== Разделы =====
-- Верхний уровень главной страницы форума: заголовок, под ним категории.
CREATE TABLE IF NOT EXISTS forum_groups (
  id         bigserial PRIMARY KEY,
  title      text NOT NULL,
  position   integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS forum_groups_position_idx ON forum_groups (position, id);

-- ===== Категории =====
CREATE TABLE IF NOT EXISTS forum_categories (
  id          bigserial PRIMARY KEY,
  group_id    bigint REFERENCES forum_groups(id) ON DELETE SET NULL,
  slug        text NOT NULL UNIQUE,
  title       text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon        text NOT NULL DEFAULT '💬',
  position    integer NOT NULL DEFAULT 0,
  is_visible  boolean NOT NULL DEFAULT true,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz,
  deleted_by  bigint REFERENCES forum_users(id)
);

-- Для баз, созданных до появления разделов.
ALTER TABLE forum_categories ADD COLUMN IF NOT EXISTS group_id bigint REFERENCES forum_groups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS forum_categories_position_idx ON forum_categories (position, id);
CREATE INDEX IF NOT EXISTS forum_categories_group_idx ON forum_categories (group_id, position, id);

-- ===== Темы =====
CREATE TABLE IF NOT EXISTS forum_topics (
  id                bigserial PRIMARY KEY,
  category_id       bigint NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
  author_id         bigint NOT NULL REFERENCES forum_users(id),
  title             text NOT NULL,
  is_pinned         boolean NOT NULL DEFAULT false,
  is_locked         boolean NOT NULL DEFAULT false,
  views             integer NOT NULL DEFAULT 0,
  post_count        integer NOT NULL DEFAULT 1,
  last_post_at      timestamptz NOT NULL DEFAULT now(),
  last_post_user_id bigint REFERENCES forum_users(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz,
  deleted_by        bigint REFERENCES forum_users(id),
  title_tsv         tsvector GENERATED ALWAYS AS (to_tsvector('russian', title)) STORED
);

CREATE INDEX IF NOT EXISTS forum_topics_list_idx ON forum_topics (category_id, is_pinned DESC, last_post_at DESC);
CREATE INDEX IF NOT EXISTS forum_topics_author_idx ON forum_topics (author_id);
CREATE INDEX IF NOT EXISTS forum_topics_tsv_idx ON forum_topics USING gin (title_tsv);

-- ===== Сообщения =====
CREATE TABLE IF NOT EXISTS forum_posts (
  id          bigserial PRIMARY KEY,
  topic_id    bigint NOT NULL REFERENCES forum_topics(id) ON DELETE CASCADE,
  author_id   bigint NOT NULL REFERENCES forum_users(id),
  post_number integer NOT NULL,
  body        text NOT NULL,
  reply_to_id bigint REFERENCES forum_posts(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  edited_at   timestamptz,
  edited_by   bigint REFERENCES forum_users(id),
  deleted_at  timestamptz,
  deleted_by  bigint REFERENCES forum_users(id),
  body_tsv    tsvector GENERATED ALWAYS AS (to_tsvector('russian', body)) STORED,
  CONSTRAINT forum_posts_topic_number_key UNIQUE (topic_id, post_number)
);

CREATE INDEX IF NOT EXISTS forum_posts_topic_idx ON forum_posts (topic_id, post_number);
CREATE INDEX IF NOT EXISTS forum_posts_author_idx ON forum_posts (author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS forum_posts_tsv_idx ON forum_posts USING gin (body_tsv);

-- ===== Подписки на темы =====
CREATE TABLE IF NOT EXISTS forum_topic_subscriptions (
  user_id    bigint NOT NULL REFERENCES forum_users(id) ON DELETE CASCADE,
  topic_id   bigint NOT NULL REFERENCES forum_topics(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, topic_id)
);

CREATE INDEX IF NOT EXISTS forum_subs_topic_idx ON forum_topic_subscriptions (topic_id);

-- ===== Реакции =====
CREATE TABLE IF NOT EXISTS forum_post_reactions (
  post_id    bigint NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id    bigint NOT NULL REFERENCES forum_users(id) ON DELETE CASCADE,
  emoji      text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS forum_reactions_post_idx ON forum_post_reactions (post_id);

-- ===== Уведомления =====
CREATE TABLE IF NOT EXISTS forum_notifications (
  id         bigserial PRIMARY KEY,
  user_id    bigint NOT NULL REFERENCES forum_users(id) ON DELETE CASCADE,
  type       text NOT NULL,
  actor_id   bigint REFERENCES forum_users(id) ON DELETE SET NULL,
  topic_id   bigint REFERENCES forum_topics(id) ON DELETE CASCADE,
  post_id    bigint REFERENCES forum_posts(id) ON DELETE CASCADE,
  payload    jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS forum_notifications_user_idx ON forum_notifications (user_id, read_at, created_at DESC);

-- ===== Жалобы =====
CREATE TABLE IF NOT EXISTS forum_post_reports (
  id          bigserial PRIMARY KEY,
  post_id     bigint NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  reporter_id bigint NOT NULL REFERENCES forum_users(id) ON DELETE CASCADE,
  reason      text NOT NULL,
  comment     text,
  status      text NOT NULL DEFAULT 'open',
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by bigint REFERENCES forum_users(id),
  CONSTRAINT forum_post_reports_unique UNIQUE (post_id, reporter_id),
  CONSTRAINT forum_post_reports_status_check CHECK (status IN ('open', 'resolved', 'rejected'))
);

CREATE INDEX IF NOT EXISTS forum_reports_status_idx ON forum_post_reports (status, created_at DESC);

-- ===== Прочитанное =====
CREATE TABLE IF NOT EXISTS forum_topic_read_state (
  user_id             bigint NOT NULL REFERENCES forum_users(id) ON DELETE CASCADE,
  topic_id            bigint NOT NULL REFERENCES forum_topics(id) ON DELETE CASCADE,
  last_read_post_number integer NOT NULL DEFAULT 0,
  read_at             timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, topic_id)
);

-- ===== Журнал модерации =====
CREATE TABLE IF NOT EXISTS forum_moderation_log (
  id           bigserial PRIMARY KEY,
  moderator_id bigint NOT NULL REFERENCES forum_users(id),
  action       text NOT NULL,
  target_type  text NOT NULL,
  target_id    bigint,
  details      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS forum_modlog_created_idx ON forum_moderation_log (created_at DESC);
