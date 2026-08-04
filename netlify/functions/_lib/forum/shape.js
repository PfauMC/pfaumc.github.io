// Преобразование строк БД в форму, которую отдаём клиенту.
// bigint из Postgres приходит строкой — id везде оставляем строками.

export function author(row, prefix = 'a') {
  const id = row[`${prefix}_id`]
  if (id == null) return null
  return {
    id: String(id),
    uuid: row[`${prefix}_uuid`],
    name: row[`${prefix}_name`],
    skinUrl: row[`${prefix}_skin_url`] ?? null,
    role: {
      key: row[`${prefix}_role_key`],
      title: row[`${prefix}_role_title`],
      color: row[`${prefix}_role_color`],
      canModerate: row[`${prefix}_can_moderate`] ?? false,
    },
    // Заполняется только там, где эти данные реально нужны (карточка сообщения).
    joinedAt: row[`${prefix}_joined_at`] ?? null,
    postCount: row[`${prefix}_post_count`] ?? null,
  }
}

/** SQL-фрагмент со списком полей автора под нужным префиксом. */
export function authorFields(table, prefix = 'a', roleTable = null) {
  const r = roleTable ?? `${prefix}r`
  return `${table}.id AS ${prefix}_id, ${table}.mc_uuid AS ${prefix}_uuid, ${table}.name AS ${prefix}_name,
          ${table}.skin_url AS ${prefix}_skin_url,
          ${table}.role_key AS ${prefix}_role_key, ${r}.title AS ${prefix}_role_title,
          ${r}.color AS ${prefix}_role_color, ${r}.can_moderate AS ${prefix}_can_moderate`
}

export function group(row) {
  return {
    id: String(row.id),
    title: row.title,
    position: row.position,
    isVisible: row.is_visible,
  }
}

export function category(row) {
  return {
    id: String(row.id),
    groupId: row.group_id == null ? null : String(row.group_id),
    slug: row.slug,
    title: row.title,
    description: row.description,
    icon: row.icon,
    position: row.position,
    isVisible: row.is_visible,
    isActive: row.is_active,
    topicCount: row.topic_count ?? 0,
    postCount: row.post_count ?? 0,
    hasUnread: Boolean(row.has_unread),
    lastPost: row.last_post_id
      ? {
          postId: String(row.last_post_id),
          postNumber: row.last_post_number,
          topicId: String(row.last_topic_id),
          topicTitle: row.last_topic_title,
          createdAt: row.last_post_at,
          author: author(row, 'lp'),
        }
      : null,
  }
}

export function topic(row) {
  return {
    id: String(row.id),
    categoryId: String(row.category_id),
    categorySlug: row.category_slug ?? null,
    categoryTitle: row.category_title ?? null,
    title: row.title,
    isPinned: row.is_pinned,
    isLocked: row.is_locked,
    isDeleted: Boolean(row.deleted_at),
    views: row.views,
    postCount: row.post_count,
    replyCount: Math.max(0, row.post_count - 1),
    createdAt: row.created_at,
    lastPostAt: row.last_post_at,
    author: author(row, 'a'),
    lastPostAuthor: row.lp_id ? author(row, 'lp') : null,
    hasUnread: Boolean(row.has_unread),
    isSubscribed: Boolean(row.is_subscribed),
  }
}

export function post(row, reactions = []) {
  const deleted = Boolean(row.deleted_at)
  return {
    id: String(row.id),
    topicId: String(row.topic_id),
    postNumber: row.post_number,
    // Удалённое сообщение остаётся в БД, но текст наружу не отдаём никому,
    // кроме модераторов (они получают его отдельным запросом при восстановлении).
    body: deleted ? '' : row.body,
    isDeleted: deleted,
    createdAt: row.created_at,
    editedAt: row.edited_at,
    editedByModerator: Boolean(row.edited_by && String(row.edited_by) !== String(row.author_id)),
    author: author(row, 'a'),
    replyTo: row.reply_to_id
      ? { id: String(row.reply_to_id), postNumber: row.reply_to_number, authorName: row.reply_to_author }
      : null,
    reactions,
  }
}

export function notification(row) {
  return {
    id: String(row.id),
    type: row.type,
    isRead: Boolean(row.read_at),
    createdAt: row.created_at,
    topicId: row.topic_id ? String(row.topic_id) : null,
    postId: row.post_id ? String(row.post_id) : null,
    postNumber: row.post_number ?? null,
    topicTitle: row.topic_title ?? null,
    actor: row.ac_id ? author(row, 'ac') : null,
    payload: row.payload ?? {},
  }
}

export function report(row) {
  return {
    id: String(row.id),
    postId: String(row.post_id),
    topicId: row.topic_id ? String(row.topic_id) : null,
    topicTitle: row.topic_title ?? null,
    postNumber: row.post_number ?? null,
    reason: row.reason,
    status: row.status,
    note: row.note,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
    excerpt: row.excerpt ?? '',
    reporter: author(row, 'rp'),
    postAuthor: row.pa_id ? author(row, 'pa') : null,
  }
}

export function modLogEntry(row) {
  return {
    id: String(row.id),
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id ? String(row.target_id) : null,
    details: row.details ?? {},
    createdAt: row.created_at,
    moderator: author(row, 'm'),
  }
}
