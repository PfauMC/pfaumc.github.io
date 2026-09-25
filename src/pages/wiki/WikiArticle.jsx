import { useEffect } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useSEO } from '../../hooks/useSEO'
import { useApiData } from '../../hooks/useApiData'
import { useForumAuth } from '../../context/ForumAuthContext'
import { renderMarkup } from '../../lib/markup'
import { formatDateTime } from '../../lib/forumFormat'
import { wikiFetcher } from '../../lib/wikiApi'
import { ListSkeleton, ErrorState } from '../../components/forum/ui'
import NotFoundPage from '../NotFoundPage'

/** Вступление (до первого `## `) и разделы -- каждый раздел рисуется своей карточкой. */
function splitSections(body) {
  const [intro, ...rest] = body.split(/^(?=##\s)/m)
  return { intro: intro.trim(), sections: rest.map((s) => s.trim()).filter(Boolean) }
}

export default function WikiArticle() {
  const { slug } = useParams()
  const { hash } = useLocation()
  const { isModerator } = useForumAuth()
  const { data, loading, error, reload } = useApiData(`/pages/${slug}`, { fetcher: wikiFetcher })
  const page = data?.page

  useSEO(page ? `${page.title} — PfauMC Wiki` : 'Вики — PfauMC', page?.summary || undefined)

  useEffect(() => {
    if (!hash || !page) return
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [hash, page])

  if (error?.status === 404) return <NotFoundPage />
  if (loading && !page) return <ListSkeleton rows={5} />
  if (error && !page) return <ErrorState message="Не удалось загрузить статью" onRetry={reload} />
  if (!page) return null

  const { intro, sections } = splitSections(page.body)

  return (
    <article>
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <div className="text-text-light/50 text-xs font-mono uppercase tracking-widest">{page.section}</div>
          {isModerator && !data.fallback && (
            <Link to={`/wiki/${page.slug}/edit`} className="ml-auto btn-ghost text-xs py-1.5 px-3">✏️ Редактировать</Link>
          )}
        </div>
        <h1 className="font-mono text-3xl sm:text-4xl font-bold text-heading mb-3">
          {page.icon} {page.title}
        </h1>
        {intro && <div className="text-text-light text-base leading-relaxed max-w-2xl">{renderMarkup(intro, `${slug}-intro`, { wiki: true })}</div>}
      </div>

      <div className="space-y-4">
        {sections.map((section, i) => (
          <section key={i} className="card text-text-light text-sm leading-relaxed [&_h2]:!text-lg [&_h2]:!mb-3 [&_ul]:space-y-2">
            {renderMarkup(section, `${slug}-s${i}`, { wiki: true })}
          </section>
        ))}
      </div>

      {page.updatedAt && (
        <p className="mt-6 text-xs text-text-light/40">
          Обновлено {formatDateTime(page.updatedAt)}{page.updatedByName && ` · ${page.updatedByName}`}
        </p>
      )}
    </article>
  )
}
