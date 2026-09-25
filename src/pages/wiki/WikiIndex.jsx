import { Link } from 'react-router-dom'
import { useSEO } from '../../hooks/useSEO'
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard'
import CopyToast from '../../components/CopyToast'
import { SERVER_VERSION } from '../../config'
import { useApiData } from '../../hooks/useApiData'
import { renderMarkup } from '../../lib/markup'
import { wikiFetcher, groupBySection, faqItems } from '../../lib/wikiApi'

const FAQ_HIGHLIGHTS = 6

const SERVER_IP = 'play.pfaumc.online'

const worlds = ['Обычный мир', 'Незер', 'Энд']

const facts = [
  { icon: '🛡️', title: 'Приватов нет', text: 'Классических приватов и регионов нет — действия логируются CoreProtect.' },
  { icon: '🚫', title: 'Без телепортов', text: '/spawn, /home, /tpa, /tp, /hub отсутствуют.' },
  { icon: '📨', title: 'Репорты', text: <>Репорты и апелляции подаются через <Link to="/forum" className="text-accent hover:underline">форум</Link>.</> },
]

export default function WikiIndex() {
  useSEO('База знаний — PfauMC Wiki', 'Гайды, FAQ и правила Minecraft сервера PfauMC.')
  const { copied, error, copy } = useCopyToClipboard()
  const pages = useApiData('/pages', { fetcher: wikiFetcher }).data?.pages ?? []
  const groups = groupBySection(pages)
  const faq = faqItems(useApiData('/pages/faq', { fetcher: wikiFetcher }).data?.page?.body).slice(0, FAQ_HIGHLIGHTS)

  return (
    <div className="space-y-10">
      {/* Hero */}
      <header>
        <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 text-accent text-xs font-mono px-3 py-1.5 rounded-full mb-4">
          📖 База знаний PfauMC
        </div>
        <h1 className="font-mono text-3xl sm:text-4xl font-bold text-heading mb-3">Вики</h1>
        <p className="text-text-light text-base max-w-xl leading-relaxed">
          Всё что нужно знать о сервере — гайды, правила и ответы на вопросы.
        </p>
      </header>

      {/* Сейчас на сервере */}
      <section aria-labelledby="wiki-now" className="card">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-5 border-b border-white/5">
          <div className="min-w-0">
            <h2 id="wiki-now" className="text-text-light/50 text-xs font-mono uppercase tracking-widest mb-1.5">Сейчас на PfauMC</h2>
            <button
              onClick={() => copy(SERVER_IP)}
              aria-label={`Скопировать IP-адрес сервера ${SERVER_IP}`}
              className="font-mono text-xl font-bold text-heading hover:text-accent transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 rounded"
            >
              {SERVER_IP}
            </button>
            <div className="text-text-light/50 text-xs mt-1">Java Edition {SERVER_VERSION}</div>
          </div>
          <button onClick={() => copy(SERVER_IP)} className="btn-ghost text-sm py-2 px-4 sm:ml-auto flex-shrink-0 self-start sm:self-auto">
            {copied ? '✓ Скопировано' : 'Скопировать IP'}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 py-4">
          {worlds.map((world) => (
            <span key={world} className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border border-green-400/20 bg-green-400/10 text-text-light">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" aria-hidden="true" />
              {world} — <span className="text-green-400">открыт</span>
            </span>
          ))}
        </div>

        <ul className="grid sm:grid-cols-3 gap-3">
          {facts.map((fact) => (
            <li key={fact.title} className="p-3 rounded-xl bg-bg-section border border-white/5">
              <div className="font-mono text-sm font-bold text-heading mb-1">{fact.icon} {fact.title}</div>
              <p className="text-text-light/80 text-xs leading-relaxed">{fact.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Разделы */}
      <section aria-labelledby="wiki-sections">
        <h2 id="wiki-sections" className="font-mono font-bold text-heading text-lg mb-4">Разделы</h2>
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.section}>
              <div className="text-text-light/40 text-xs font-mono uppercase tracking-widest mb-2">{group.section}</div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.pages.map((c) => (
                  <Link
                    key={c.slug}
                    to={`/wiki/${c.slug}`}
                    className="card group flex items-start gap-3 hover:border-accent/30 hover:bg-accent/5 transition-all duration-200"
                  >
                    <span className="text-2xl flex-shrink-0" aria-hidden="true">{c.icon}</span>
                    <span className="min-w-0">
                      <span className="block font-mono font-bold text-heading group-hover:text-accent transition-colors mb-1">{c.title}</span>
                      {c.summary && <span className="block text-text-light/70 text-sm leading-relaxed">{c.summary}</span>}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Главные ответы — прямо здесь, без перехода в статьи */}
      <section aria-labelledby="wiki-faq">
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <h2 id="wiki-faq" className="font-mono font-bold text-heading text-lg">Частые вопросы</h2>
          <Link to="/wiki/faq" className="text-accent text-sm hover:underline flex-shrink-0">Все вопросы →</Link>
        </div>
        <div className="card p-0 sm:p-0 divide-y divide-white/5 overflow-hidden">
          {faq.map((item) => (
            <details key={item.q} className="group">
              <summary className="flex items-center gap-3 px-4 sm:px-6 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden hover:bg-white/[0.03] transition-colors">
                <span className="font-mono font-bold text-heading text-sm flex-1">{item.q}</span>
                <svg className="w-4 h-4 text-text-light/40 flex-shrink-0 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <polyline points="6,9 12,15 18,9" />
                </svg>
              </summary>
              <div className="px-4 sm:px-6 pb-4 -mt-1 text-text-light text-sm leading-relaxed">{renderMarkup(item.a, `faq-${item.q}`, { wiki: true })}</div>
            </details>
          ))}
        </div>
      </section>

      {/* Help footer */}
      <div className="p-5 bg-bg-section rounded-2xl border border-white/5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="text-3xl">💬</div>
          <div>
            <div className="font-mono font-bold text-heading mb-0.5">Нужна помощь?</div>
            <p className="text-text-light/70 text-sm">
              Если в вики нет ответа — обратитесь в наш Discord или Telegram.
              Администрация отвечает в течение нескольких часов.
            </p>
          </div>
          <div className="flex gap-2 sm:ml-auto flex-shrink-0">
            <a href="https://discord.gg/BPmxWwdChY" target="_blank" rel="noopener noreferrer" className="btn-ghost text-sm py-2 px-4">
              Discord
            </a>
            <a href="https://t.me/pfaumc" target="_blank" rel="noopener noreferrer" className="btn-ghost text-sm py-2 px-4">
              Telegram
            </a>
          </div>
        </div>
      </div>

      <CopyToast copied={copied} error={error} successMessage="IP скопирован" />
    </div>
  )
}
