import { Link } from 'react-router-dom'
import { useSEO } from '../../hooks/useSEO'
import { SERVER_VERSION } from '../../config'
import { faqItems, FAQ_HIGHLIGHTS, FaqCard } from './WikiFaq'

const status = [
  ['IP', 'play.pfaumc.online'],
  ['Версия', `${SERVER_VERSION} · Java Edition`],
  ['Обычный мир', 'открыт'],
  ['Незер', 'открыт'],
  ['Энд', 'открыт'],
]

const statusNotes = [
  'Классических приватов и регионов нет — действия логируются CoreProtect.',
  '/spawn, /home, /tpa, /tp, /hub отсутствуют.',
  <>Репорты и апелляции подаются через <Link to="/forum" className="text-accent hover:underline">форум</Link>.</>,
]

const cards = [
  {
    to: '/wiki/guide',
    icon: '🚀',
    title: 'Как зайти на сервер',
    desc: 'Пошаговый гайд по установке лаунчера и подключению. Рекомендуем Prism Launcher.',
    tag: 'Начало работы',
    tagColor: 'text-green-400 bg-green-400/10 border-green-400/20',
  },
  {
    to: '/wiki/faq',
    icon: '❓',
    title: 'Частые вопросы',
    desc: 'Пиратка, приваты, фермы, Litematica, магазины, кражи и гриф — короткие ответы.',
    tag: 'FAQ',
    tagColor: 'text-green-400 bg-green-400/10 border-green-400/20',
  },
  {
    to: '/wiki/rules',
    icon: '📜',
    title: 'Правила сервера',
    desc: 'Общие правила и правила режима Ванила. Обязательно ознакомьтесь перед игрой.',
    tag: 'Правила',
    tagColor: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  },
  {
    to: '/wiki/mechanics',
    icon: '🧭',
    title: 'Механики сервера',
    desc: 'Первый вход, команды, моды, голосовой чат, PvE, крыша Нижнего мира, гриферство и защита спавна для новичков.',
    tag: 'Справка',
    tagColor: 'text-accent bg-accent/10 border-accent/20',
  },
  {
    to: '/wiki/cities',
    icon: '🏙️',
    title: 'Города',
    desc: 'Как зарегистрировать город: требования, заявка, глава, жители и форум города.',
    tag: 'Гайд',
    tagColor: 'text-accent bg-accent/10 border-accent/20',
  },
]

export default function WikiIndex() {
  useSEO('База знаний — PfauMC Wiki', 'Гайды, FAQ и правила Minecraft сервера PfauMC.')

  return (
    <div>
      {/* Hero */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 text-accent text-xs font-mono px-3 py-1.5 rounded-full mb-4">
          📖 База знаний PfauMC
        </div>
        <h1 className="font-mono text-3xl sm:text-4xl font-bold text-heading mb-3">
          Вики
        </h1>
        <p className="text-text-light text-base max-w-xl leading-relaxed">
          Всё что нужно знать о сервере — гайды, правила и ответы на вопросы.
          Если не нашли ответ — спрашивайте в нашем Discord.
        </p>
      </div>

      {/* Сейчас на сервере */}
      <section className="card mb-8" aria-labelledby="wiki-now">
        <h2 id="wiki-now" className="font-mono font-bold text-heading text-lg mb-4">Сейчас на PfauMC</h2>
        <dl className="grid sm:grid-cols-2 gap-3 mb-3">
          {status.slice(0, 2).map(([label, value]) => <StatusTile key={label} label={label} value={value} />)}
        </dl>
        <dl className="grid grid-cols-3 gap-3 mb-4">
          {status.slice(2).map(([label, value]) => <StatusTile key={label} label={label} value={value} />)}
        </dl>
        <ul className="space-y-2">
          {statusNotes.map((note, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-accent mt-2" />
              <span className="text-text-light text-sm leading-relaxed">{note}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Главные ответы видны сразу, без перехода в статьи */}
      <section className="mb-10" aria-labelledby="wiki-faq">
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <h2 id="wiki-faq" className="font-mono font-bold text-heading text-lg">Частые вопросы</h2>
          <Link to="/wiki/faq" className="text-accent text-sm hover:underline flex-shrink-0">Все вопросы →</Link>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {faqItems.slice(0, FAQ_HIGHLIGHTS).map((item) => <FaqCard key={item.q} {...item} />)}
        </div>
      </section>

      {/* Cards */}
      <div className="grid gap-4">
        {cards.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="card group flex items-start gap-5 hover:border-accent/30 hover:bg-accent/5 transition-all duration-200"
          >
            <div className="text-4xl flex-shrink-0 mt-0.5">{c.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <h2 className="font-mono font-bold text-lg text-heading group-hover:text-accent transition-colors">
                  {c.title}
                </h2>
                <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${c.tagColor}`}>
                  {c.tag}
                </span>
              </div>
              <p className="text-text-light text-sm leading-relaxed">{c.desc}</p>
            </div>
            <ArrowIcon className="w-5 h-5 text-text-light/30 group-hover:text-accent transition-colors flex-shrink-0 mt-1" />
          </Link>
        ))}
      </div>

      {/* Help footer */}
      <div className="mt-8 p-5 bg-bg-section rounded-2xl border border-white/5">
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
            <a
              href="https://discord.gg/BPmxWwdChY"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost text-sm py-2 px-4"
            >
              Discord
            </a>
            <a
              href="https://t.me/pfaumc"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost text-sm py-2 px-4"
            >
              Telegram
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusTile({ label, value }) {
  return (
    <div className="p-3 rounded-xl bg-bg-section border border-white/5 min-w-0">
      <dt className="text-text-light/50 text-xs font-mono mb-1">{label}</dt>
      <dd className="text-heading text-sm font-mono">{value}</dd>
    </div>
  )
}

function ArrowIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="9,18 15,12 9,6" />
    </svg>
  )
}
