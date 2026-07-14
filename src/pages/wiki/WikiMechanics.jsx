import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useSEO } from '../../hooks/useSEO'

export const mechanicsSections = [
  {
    id: 'mech-voice',
    category: 'Голосовой чат',
    icon: '🎙️',
    items: [
      'На сервере работает голосовой чат прямо в игре — поддерживаются моды Simple Voice Chat и Plasmo Voice, оба клиента совместимы между собой.',
      'Голос привязан к игровым координатам: чем ближе собеседник, тем громче слышно, как в реальной жизни.',
    ],
  },
  {
    id: 'mech-nether-roof',
    category: 'Крыша Ада',
    icon: '🔥',
    items: [
      'Находиться и строить на крыше Ада (потолке Нижнего мира) не запрещено.',
      'При этом администрация не несёт ответственности за то, что происходит с вами там, и не занимается вашей эвакуацией, если вы застряли, потерялись или погибли.',
    ],
  },
  {
    id: 'mech-newbie-spawn',
    category: 'Ограничения для новичков на спавне',
    icon: '🔰',
    items: [
      'Пока вы новичок, на спавне (координаты X:0 Z:0) вы не сможете ломать или ставить блоки — это защита территории от рандомного гриферства.',
      'Ограничение снимается по мере игры на сервере; если оно не пропадает — обратитесь в Discord.',
    ],
  },
  {
    id: 'mech-coreprotect',
    category: 'Логирование действий (CoreProtect)',
    icon: '🔍',
    items: [
      'Все действия игроков — ломание и установка блоков, убийства, взаимодействие с контейнерами — логируются плагином CoreProtect.',
      'Команда /co i включает режим инспекции: наведите взгляд на блок, чтобы увидеть, кто и когда его изменил.',
      'Эти логи администрация использует при разборе репортов о грифе и краже — сохраняйте координаты и время инцидента.',
    ],
  },
  {
    id: 'mech-teleports',
    category: 'Телепорты и первый вход',
    icon: '🌍',
    items: [
      'На сервере нет команд телепортации (/tp, /home, /spawn и т.п.) — перемещаться можно только пешком, на транспорте или через порталы.',
      'При первом входе на сервер игрок телепортируется в случайную точку мира, а не на координаты 0,0.',
    ],
  },
]

function MechanicsSection({ id, category, icon, items }) {
  const [open, setOpen] = useState(true)
  const { hash } = useLocation()
  const highlighted = hash === `#${id}`

  return (
    <div id={id} className={`card mb-4 scroll-mt-24 transition-shadow ${highlighted ? 'ring-1 ring-accent/50' : ''}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 text-left group"
      >
        <span className="text-xl flex-shrink-0">{icon}</span>
        <h3 className="font-mono font-bold text-white flex-1 group-hover:text-accent transition-colors">
          {category}
        </h3>
        <span className={`text-text-light/40 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <polyline points="6,9 12,15 18,9" />
          </svg>
        </span>
      </button>
      {open && (
        <ul className="mt-4 space-y-2.5">
          {items.map((rule, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-accent mt-2" />
              <span className="text-text-light text-sm leading-relaxed">{rule}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function WikiMechanics() {
  useSEO('Механики сервера — PfauMC Wiki', 'Голосовой чат, крыша Ада, защита спавна, CoreProtect и телепорты на Minecraft сервере PfauMC.')

  const { hash } = useLocation()

  useEffect(() => {
    if (!hash) return
    const el = document.getElementById(hash.slice(1))
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [hash])

  return (
    <article>
      <div className="mb-8">
        <div className="text-text-light/50 text-xs font-mono uppercase tracking-widest mb-3">Справка</div>
        <h1 className="font-mono text-3xl sm:text-4xl font-bold text-white mb-3">
          🧭 Механики сервера
        </h1>
        <p className="text-text-light text-base leading-relaxed max-w-2xl">
          Особенности, которые не описаны в правилах напрямую, но важно знать перед игрой.
        </p>
      </div>

      <div>
        {mechanicsSections.map((section) => (
          <MechanicsSection key={section.id} {...section} />
        ))}
      </div>

      <div className="mt-6 p-4 bg-accent/8 border border-accent/20 rounded-xl text-sm text-text-light">
        <span className="text-accent font-bold">Остались вопросы? </span>
        Спросите в{' '}
        <a href="https://discord.gg/BPmxWwdChY" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
          Discord
        </a>.
      </div>
    </article>
  )
}
