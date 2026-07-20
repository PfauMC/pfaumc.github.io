import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useSEO } from '../../hooks/useSEO'

export const mechanicsSections = [
  {
    id: 'mech-first-join',
    category: 'Первый вход и команды',
    icon: '🌍',
    items: [
      'При первом входе на сервер вы спавнитесь в случайной точке мира, а не на фиксированных координатах.',
      'На сервере нет команд свободной телепортации — /spawn, /tp, /home и подобных не существует. Перемещаться можно пешком, на транспорте или через порталы.',
      'Доступные команды: /hub — телепортация в хаб, /co i — просмотр истории изменений блока (кто и когда его сломал или поставил).',
    ],
  },
  {
    id: 'mech-newbie-spawn',
    category: 'Ограничения для новичков',
    icon: '🔰',
    items: [
      'Первое время после входа вы не можете ломать или ставить блоки в зоне спавна — ни в Обычном мире, ни в Нижнем мире. Это защита от случайного гриферства новичками.',
      'Ограничение снимается автоматически по мере игры на сервере; если оно не пропадает — обратитесь в Discord.',
    ],
  },
  {
    id: 'mech-mods',
    category: 'Клиентские модификации',
    icon: '🧩',
    items: [
      'Разрешены любые моды, улучшающие удобство игры, если они не дают преимущества над другими игроками.',
      'Мод на миникарту — разрешён.',
      'Litematica разрешена для отображения схематики, но запрещено использовать её (или другие моды) для автоматического строительства, обхода игровой физики или абуза механик.',
    ],
  },
  {
    id: 'mech-voice',
    category: 'Голосовой чат',
    icon: '🎙️',
    items: [
      'На сервере установлены Plasmo Voice и Simple Voice Chat — специальный плагин связывает их между собой, поэтому игроки с разными голосовыми модами слышат друг друга.',
      'Голос привязан к игровым координатам: чем ближе собеседник, тем громче слышно, как в реальной жизни.',
    ],
  },
  {
    id: 'mech-pve',
    category: 'PvE и убийства игроков',
    icon: '🕊️',
    items: [
      'Сервер полностью PvE — убийство другого игрока допустимо только при его добровольном согласии.',
      'Нападение без согласия второй стороны — нарушение правил. Сообщайте о таких случаях в Discord с доказательствами.',
    ],
  },
  {
    id: 'mech-nether-roof',
    category: 'Крыша Нижнего мира',
    icon: '🔥',
    items: [
      'Находиться и строить на крыше Нижнего мира не запрещено.',
      'При этом администрация не несёт ответственности за то, что происходит с вами там, включая потерю вещей, гибель персонажа или невозможность самостоятельно выбраться.',
    ],
  },
  {
    id: 'mech-nether-restore',
    category: 'Постройки в Нижнем мире',
    icon: '⚠️',
    important: true,
    items: [
      'Магазины, базы и другое имущество, расположенные в Нижнем мире, не подлежат восстановлению после гриферства.',
      'Учитывайте это до начала строительства в Аду — вернуть утраченное там администрация не сможет.',
    ],
  },
  {
    id: 'mech-spawn-building',
    category: 'Строительство на спавне',
    icon: '🏗️',
    items: [
      'Самовольное строительство на территории спавна запрещено.',
      'Разрешается размещать только магазины — и только после согласования со строителями или администрацией проекта.',
      'Несогласованные постройки могут быть удалены без компенсации ресурсов.',
    ],
  },
  {
    id: 'mech-griefing',
    category: 'Гриферство и помощь администрации',
    icon: '🛟',
    items: [
      'Если вас загрифили — обратитесь к хелперам.',
      'Сначала администрация постарается решить ситуацию мирно и договориться о добровольном возврате вещей — мы придерживаемся политики минимального вмешательства в ванильный игровой процесс и стараемся не использовать команды и откаты без необходимости.',
      'Если мирно решить не удалось: нарушитель получает блокировку, украденные вещи изымаются из его инвентаря и передаются пострадавшему, а постройки и животные восстанавливаются, если это технически возможно.',
    ],
  },
  {
    id: 'mech-vulnerabilities',
    category: 'Уязвимости и баги',
    icon: '🔍',
    items: [
      'Мы стараемся исправлять все известные нам уязвимости сервера.',
      'Нашли новую уязвимость, дюп или способ обхода ограничений — сообщите администрации. За полезный и ответственный отчёт может быть предусмотрено вознаграждение.',
      'Использование найденной уязвимости в личных целях или её распространение среди других игроков — нарушение правил и повод для блокировки.',
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
    id: 'mech-unauthorized-accounts',
    category: 'Неавторизованные аккаунты',
    icon: '🔐',
    important: true,
    items: [
      'Администрация не несёт ответственности за безопасность неавторизованных аккаунтов.',
      'Авторизация аккаунта — добровольное решение и ответственность самого игрока.',
      'Обращения по поводу взлома, гриферства, кражи вещей или других действий, совершённых через неавторизованный аккаунт, администрацией не рассматриваются.',
    ],
  },
]

function MechanicsSection({ id, category, icon, items, important }) {
  const [open, setOpen] = useState(true)
  const { hash } = useLocation()
  const highlighted = hash === `#${id}`

  return (
    <div
      id={id}
      className={`card mb-4 scroll-mt-24 transition-shadow ${
        important ? 'border-orange-500/30 bg-orange-500/[0.04]' : ''
      } ${highlighted ? 'ring-1 ring-accent/50' : ''}`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 text-left group"
      >
        <span className="text-xl flex-shrink-0">{icon}</span>
        <h3 className="font-mono font-bold text-white flex-1 group-hover:text-accent transition-colors flex items-center gap-2">
          {category}
          {important && (
            <span className="text-orange-400 text-xs font-mono font-bold border border-orange-500/30 bg-orange-500/10 rounded-full px-2 py-0.5">
              Важно
            </span>
          )}
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
              <span className={`flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2 ${important ? 'bg-orange-400' : 'bg-accent'}`} />
              <span className="text-text-light text-sm leading-relaxed">{rule}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function WikiMechanics() {
  useSEO('Механики сервера — PfauMC Wiki', 'Первый вход, команды, моды, голосовой чат, PvE, крыша Нижнего мира, гриферство и защита спавна на Minecraft сервере PfauMC.')

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
