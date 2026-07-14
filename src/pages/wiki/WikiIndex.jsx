import { Link } from 'react-router-dom'
import { useSEO } from '../../hooks/useSEO'

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
    title: 'Часто задаваемые вопросы',
    desc: 'Ответы на самые популярные вопросы о сервере, правилах, моде и техническом устройстве.',
    tag: 'Справка',
    tagColor: 'text-accent bg-accent/10 border-accent/20',
  },
  {
    to: '/wiki/rules',
    icon: '📜',
    title: 'Правила сервера',
    desc: 'Общие правила, правила режима Ванила и Политическое выживание. Обязательно ознакомьтесь перед игрой.',
    tag: 'Правила',
    tagColor: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  },
  {
    to: '/wiki/mechanics',
    icon: '🧭',
    title: 'Механики сервера',
    desc: 'Голосовой чат, крыша Ада, защита спавна для новичков, CoreProtect и телепорты.',
    tag: 'Справка',
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
        <h1 className="font-mono text-3xl sm:text-4xl font-bold text-white mb-3">
          Вики
        </h1>
        <p className="text-text-light text-base max-w-xl leading-relaxed">
          Всё что нужно знать о сервере — гайды, правила и ответы на вопросы.
          Если не нашли ответ — спрашивайте в нашем Discord.
        </p>
      </div>

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
                <h2 className="font-mono font-bold text-lg text-white group-hover:text-accent transition-colors">
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
            <div className="font-mono font-bold text-white mb-0.5">Нужна помощь?</div>
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

function ArrowIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="9,18 15,12 9,6" />
    </svg>
  )
}
