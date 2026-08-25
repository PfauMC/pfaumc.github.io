import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useSEO } from '../../hooks/useSEO'

export const mechanicsSections = [
  {
    id: 'mech-first-join',
    category: 'Первый вход и команды',
    icon: '🌍',
    scope: 'all',
    items: [
      'При первом входе на сервер вы спавнитесь в случайной точке мира на расстоянии от 2000 до 16 000 блоков от центра, а не на фиксированных координатах. Команды /rtp нет — точка выдаётся автоматически.',
      'На сервере нет команд свободной телепортации — /spawn, /tp, /home, /tpa, /hub и подобных не существует. Перемещаться можно пешком, на транспорте, через порталы и по ледяным магистралям в Аду.',
      'Доступные команды: /msg (алиасы /m, /tell, /w, /whisper, /pm, /dm, /message) — личное сообщение, /reply (/r) — ответ последнему написавшему, /rules — ссылка на правила, /skin <ник> — сменить скин, /co i — инспектор CoreProtect.',
    ],
  },
  {
    id: 'mech-newbie-spawn',
    category: 'Ограничения для новичков',
    icon: '🔰',
    scope: 'all',
    items: [
      'Ограничения снимаются по календарному времени с первого входа, а не по наигранным часам.',
      'Первые 3 дня нельзя открывать чужие сундуки и шалкеры. Сообщение: «Вы пока не можете открывать этот блок, без владельца рядом».',
      'Первые 3 дня нельзя ломать и ставить блоки рядом с чужими постройками.',
      'Первые 7 дней нельзя строить и ломать в радиусе 600 блоков от спавна в Обычном мире и 75 блоков в Нижнем мире. Сообщение: «Вы не можете строить вблизи спауна».',
      'Если ограничение не пропало по истечении срока — создайте тему на форуме.',
    ],
  },
  {
    id: 'mech-world-settings',
    category: 'Настройки мира',
    icon: '⚙️',
    scope: 'all',
    items: [
      'Сложность hard, радиус симуляции 8, спаунрейт обычный — ограничений на фермы нет.',
      'keepInventory выключен: при смерти вещи выпадают. Выпавшие предметы лежат 5 минут, потом исчезают; опыт пропадает так же.',
      'Фантомы включены и спавнятся как в ванили.',
      'Обычный мир, Ад и Энд открыты, генерация бесконечная. Публичной веб-карты мира нет, сид не разглашается.',
      'Приватов, регионов и клеймов нет — вместо них логирование действий через CoreProtect.',
      'Включён Trade Rebalance: ассортимент жителей зависит от биома, починка — у болотного библиотекаря.',
      'Bedrock Edition (телефоны и консоли) не поддерживается. С телефона можно зайти только через Java-клиенты вроде PojavLauncher.',
    ],
  },
  {
    id: 'mech-mods',
    category: 'Клиентские модификации',
    icon: '🧩',
    scope: 'all',
    items: [
      'Разрешены: Sodium, Iris, шейдеры, ресурспаки, Xaero’s Minimap и Worldmap, Voxy, JEI, REI, Replay Mod, Item Scroller, сортировщики инвентаря.',
      'Litematica разрешена только для чертежа и подсветки. Litematica Printer и любая автопостройка запрещены.',
      'Запрещены чит-клиенты, X-Ray, Freecam, killaura, автокликеры, боты, Fullbright и гамма-бустеры.',
      { type: 'warning', text: 'Блокировка грозит за само наличие чит-клиента, даже без использования. Если мода нет ни в одном из списков — не ставьте его, сначала спросите в чате проекта.' },
    ],
  },
  {
    id: 'mech-voice',
    category: 'Голосовой чат',
    icon: '🎙️',
    scope: 'all',
    items: [
      'На сервере установлены Plasmo Voice и Simple Voice Chat — специальный плагин связывает их между собой, поэтому игроки с разными голосовыми модами слышат друг друга.',
      'Голос привязан к игровым координатам: чем ближе собеседник, тем громче слышно, как в реальной жизни.',
      'Рекомендуем Simple Voice Chat — в нём есть группы. Если вас не слышно, проверьте устройство вывода в настройках мода.',
    ],
  },
  {
    id: 'mech-pve',
    category: 'PvE и убийства игроков',
    icon: '🕊️',
    scope: 'vanilla',
    items: [
      'Режим Ванила — PvE: убийство другого игрока допустимо только при его добровольном согласии, нападение без согласия — нарушение правил.',
      'Сообщайте о нарушениях на форуме — с доказательствами.',
    ],
  },
  {
    id: 'mech-nether-roof',
    category: 'Крыша Нижнего мира',
    icon: '🔥',
    scope: 'all',
    items: [
      'Находиться и строить на крыше Нижнего мира не запрещено.',
      'При этом администрация не несёт ответственности за то, что происходит с вами там, включая потерю вещей, гибель персонажа или невозможность самостоятельно выбраться.',
    ],
  },
  {
    id: 'mech-nether-restore',
    category: 'Постройки в Нижнем мире',
    icon: '⚠️',
    scope: 'all',
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
    scope: 'all',
    items: [
      'Самовольное строительство на территории спавна запрещено — несогласованные постройки сносятся без компенсации ресурсов.',
      'Строить на спавне можно только по согласованию с администрацией.',
      'Выдача мест под магазины на спавне сейчас закрыта — новые участки не выдаются.',
      'Взрыв динамита на территории спавна — автоматический бан.',
    ],
  },
  {
    id: 'mech-griefing',
    category: 'Гриферство и помощь администрации',
    icon: '🛟',
    scope: 'vanilla',
    items: [
      'Эта процедура действует в режиме Ванила, где гриф запрещён. Если вас загрифили — обратитесь к хелперам.',
      'Сначала администрация постарается решить ситуацию мирно и договориться о добровольном возврате вещей — мы придерживаемся политики минимального вмешательства в ванильный игровой процесс и стараемся не использовать команды и откаты без необходимости.',
      'Если мирно решить не удалось: нарушитель получает блокировку, украденные вещи изымаются из его инвентаря и передаются пострадавшему, а постройки и животные восстанавливаются, если это технически возможно.',
      'Процедура не распространяется на вещи из общедоступных контейнеров: всё, что оставлено в открытом доступе, считается общим и не возвращается. Подробности — в разделе правил «Общественные зоны и контейнеры».',
    ],
  },
  {
    id: 'mech-vulnerabilities',
    category: 'Уязвимости и баги',
    icon: '🔍',
    scope: 'all',
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
    scope: 'all',
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
    scope: 'all',
    important: true,
    items: [
      'Администрация не несёт ответственности за безопасность неавторизованных аккаунтов.',
      'Авторизация аккаунта — добровольное решение и ответственность самого игрока.',
      'Обращения по поводу взлома, гриферства, кражи вещей или других действий, совершённых через неавторизованный аккаунт, администрацией не рассматриваются.',
    ],
  },
]

const SCOPE_LABELS = {
  all: 'Общее правило для всех режимов',
  vanilla: 'Относится только к Ваниле',
}

function MechanicsItem({ item, important }) {
  if (typeof item === 'string') {
    return (
      <li className="flex items-start gap-2.5">
        <span className={`flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2 ${important ? 'bg-orange-400' : 'bg-accent'}`} />
        <span className="text-text-light text-sm leading-relaxed">{item}</span>
      </li>
    )
  }

  if (item.type === 'warning') {
    return (
      <li className="flex items-start gap-2.5 bg-orange-500/8 border border-orange-500/20 rounded-xl p-3">
        <span className="text-orange-400 flex-shrink-0">⚠️</span>
        <span className="text-text-light text-sm leading-relaxed">{item.text}</span>
      </li>
    )
  }

  return null
}

function MechanicsSection({ id, category, icon, items, important, scope }) {
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
        <h3 className="font-mono font-bold text-heading flex-1 min-w-0 group-hover:text-accent transition-colors flex items-center gap-2 flex-wrap">
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
        <>
          {scope && scope !== 'all' && (
            <span className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full border text-accent bg-accent/10 border-accent/20 mt-3">
              {SCOPE_LABELS[scope]}
            </span>
          )}
          <ul className="mt-4 space-y-2.5">
            {items.map((rule, i) => (
              <MechanicsItem key={i} item={rule} important={important} />
            ))}
          </ul>
        </>
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
        <h1 className="font-mono text-3xl sm:text-4xl font-bold text-heading mb-3">
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
