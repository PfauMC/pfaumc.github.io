import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const TABS = ['Привилегии', 'Валюта', 'Кейсы', 'Разное']

const TIER_STYLES = [
  { color: '#9CA3AF', glow: 'rgba(156,163,175,0.12)', label: 'Стартер' },
  { color: '#9CA3AF', glow: 'rgba(156,163,175,0.12)', label: 'Стартер' },
  { color: '#10B981', glow: 'rgba(16,185,129,0.12)', label: 'Базовый' },
  { color: '#10B981', glow: 'rgba(16,185,129,0.12)', label: 'Базовый' },
  { color: '#3B82F6', glow: 'rgba(59,130,246,0.12)', label: 'Продвинутый' },
  { color: '#8B5CF6', glow: 'rgba(139,92,246,0.12)', label: 'Элитный' },
  { color: '#F97316', glow: 'rgba(249,115,22,0.12)', label: 'Премиум' },
  { color: '#F97316', glow: 'rgba(249,115,22,0.12)', label: 'Премиум' },
  { color: '#EF4444', glow: 'rgba(239,68,68,0.12)', label: 'Легенда' },
  { color: '#F59E0B', glow: 'rgba(245,158,11,0.15)', label: 'Легенда' },
  { color: '#1DA5E8', glow: 'rgba(29,165,232,0.2)',  label: '👑 БОГ' },
]

const privileges = [
  { rankCode: 'nishcheyob', displayName: 'Нищеёб', tier: 1, price: 99, features: ['Задержка в чате: 3 сек','Задержка телепорта: 4 сек','4 бесплатных /tpa в день','Шанс дропа головы: 3%','4 товара на рынке','Спавнеры выпадают: 22%'], commands: ['/stonecutter','/grindstone','/cartography','/lay','/roll','/kiss','/smoke','/poop'] },
  { rankCode: 'omezhka',    displayName: 'Омежка',  tier: 2, price: 199, features: ['Эмодзи в чате','Задержка телепорта: 3 сек','5 бесплатных /tpa в день','Шанс дропа головы: 6%','До 3 аккаунтов с одного IP','6 товаров на рынке','Спавнеры выпадают: 25%'], commands: ['/workbench','/loom','/ext','/fix','/ptime','/fart','/rollglobal','/flex'] },
  { rankCode: 'stepashka',  displayName: 'Степашка',tier: 3, price: 499, features: ['Задержка телепорта: 2 сек','7 бесплатных /tpa в день','Шанс дропа головы: 10%','До 4 аккаунтов с одного IP','Ссылка на /ah в чате','9 товаров на рынке','Спавнеры выпадают: 28%'], commands: ['/hat','/heal','/feed','/anvil','/smithing','/fix armor','/milk','/trash','/rtp far'] },
  { rankCode: 'kachok',     displayName: 'Качок',   tier: 4, price: 899, features: ['Задержка телепорта: 2 сек','8 бесплатных /tpa в день','Шанс дропа головы: 14%','Кулдауны снижены x2','До 5 аккаунтов с одного IP','12 товаров на рынке','Спавнеры выпадают: 32%'], commands: ['/nick','/invsee','/enderchest','/back','/god (на 30 сек)'] },
  { rankCode: 'sionist',    displayName: 'Сионист', tier: 5, price: 1489, features: ['Задержка телепорта: 1 сек','10 бесплатных /tpa в день','Шанс дропа головы: 18%','Кулдауны снижены x3','15 товаров на рынке','Комиссия рынка: 8%','Спавнеры выпадают: 38%'], commands: ['/fly (15 мин/день)','/speed','/pweather','/near','/top'] },
  { rankCode: 'alpha',      displayName: 'Альфа',   tier: 6, price: 2499, features: ['Телепорт без задержки','12 бесплатных /tpa в день','Шанс дропа головы: 22%','Кулдауны снижены x5','18 товаров на рынке','Комиссия рынка: 6%','Спавнеры выпадают: 45%'], commands: ['/fly (1 час/день)','/repair all','/craft','/echest','/colornick'] },
  { rankCode: 'slonjara',   displayName: 'Слоняра', tier: 7, price: 3999, features: ['Телепорт без задержки','Безлимитный /tpa','Шанс дропа головы: 25%','Кулдауны снижены x7','22 товара на рынке','Комиссия рынка: 5%','3 промо-слота на рынке','Спавнеры выпадают: 52%'], commands: ['/fly (безлимит)','/jump','/thru','/nv','/condense'] },
  { rankCode: 'akula',      displayName: 'Акула',   tier: 8, price: 7999, features: ['Телепорт без задержки','Безлимитный /tpa','Шанс дропа головы: 28%','Кулдауны снижены x10','28 товаров на рынке','Комиссия рынка: 4%','3 промо-слота на рынке','Спавнеры выпадают: 62%','Удорожание тюрьмы: x3'], commands: ['/heal all','/socialspy','/tpall','/staffchat'] },
  { rankCode: 'rebe',       displayName: 'Ребе',    tier: 9, price: 14999, features: ['Телепорт без задержки','Безлимитный /tpa','Шанс дропа головы: 30%','Голова не выпадает при смерти','Кулдауны снижены x15','4 точки дома','30 товаров на рынке','Комиссия рынка: 3%','Спавнеры выпадают: 72%','Удорожание тюрьмы: x5'], commands: [] },
  { rankCode: 'pozdnyakov', displayName: 'Поздняков',tier:10, price: 24999, features: ['Телепорт без задержки','Безлимитный /tpa','Шанс дропа головы: 30%','Голова не выпадает','Кулдауны снижены x20','5 точек дома','35 товаров на рынке','4 промо-слота','Комиссия рынка: 2%','Комиссия переводов: 0.2%','Спавнеры выпадают: 80%','Удорожание тюрьмы: x10'], commands: [] },
  { rankCode: 'bog',        displayName: 'Бог',     tier: 11, price: 99999, features: ['Телепортация без задержек','Безлимитный /tpa','Шанс дропа головы: 30%','Голова не выпадает','Кулдауны снижены x30','10 точек дома','50 товаров на рынке','5 промо-слотов','Комиссия рынка: 0%','Комиссия переводов: 0%','Спавнеры выпадают: 100%','Иммунитет от тюрьмы','Персональные команды','Прямой доступ к разработчикам','Именная статуя на спавне'], commands: ['/deputat — вечное насыщение'] },
]

const fluxPackages = [
  { amount: 100, price: 100 }, { amount: 250, price: 250 }, { amount: 500, price: 500 },
  { amount: 1000, price: 1000 }, { amount: 2000, price: 2000 }, { amount: 3000, price: 3000 },
  { amount: 5000, price: 5000 }, { amount: 10000, price: 10000 },
]

const cases = [
  { name: 'Обычные привилегии', icon: '📦', packs: [{ keys: 1, price: 150 }, { keys: 3, price: 419, save: 6 }, { keys: 5, price: 679, save: 9 }, { keys: 10, price: 1299, save: 13 }, { keys: 25, price: 2999, save: 20 }] },
  { name: 'Редкие привилегии',  icon: '💎', packs: [{ keys: 1, price: 400 }, { keys: 3, price: 1159, save: 3 }, { keys: 5, price: 1879, save: 6 }, { keys: 10, price: 3599, save: 10 }, { keys: 20, price: 6999, save: 12 }] },
  { name: 'Кейс с гхыбками',   icon: '✨', packs: [{ keys: 1, price: 29 }, { keys: 5, price: 139, save: 4 }, { keys: 10, price: 259, save: 10 }, { keys: 25, price: 599, save: 17 }, { keys: 50, price: 1119, save: 22 }] },
  { name: 'Кейс со спавнерами',icon: '🌀', packs: [{ keys: 1, price: 159 }, { keys: 3, price: 449, save: 5 }, { keys: 7, price: 999, save: 10 }, { keys: 15, price: 1999, save: 16 }, { keys: 30, price: 3739, save: 21 }] },
]

const miscItems = [
  { name: 'Размут', icon: '🔊', price: 149, desc: 'Снятие мута с вашего аккаунта' },
  { name: 'Разбан', icon: '🔓', price: 449, desc: 'Снятие бана с вашего аккаунта' },
  { name: 'Разбан по IP', icon: '🌐', price: 699, desc: 'Снятие бана по IP-адресу' },
  { name: 'Размут по IP', icon: '📡', price: 449, desc: 'Снятие мута по IP-адресу' },
]

export default function DonatePage() {
  const [tab, setTab] = useState('Привилегии')
  const [openPriv, setOpenPriv] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
    setTimeout(() => setVisible(true), 80)
  }, [])

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative pt-28 pb-14 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <Link to="/" className="inline-flex items-center gap-2 text-text-light/60 hover:text-white text-sm font-medium mb-10 transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            На главную
          </Link>
          <div className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <p className="text-accent font-mono text-sm font-semibold tracking-widest uppercase mb-3">Поддержать сервер</p>
            <h1 className="font-mono text-3xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">Донат</h1>
            <p className="text-text-light text-lg max-w-xl">
              Поддержи сервер и получи привилегии, валюту и кейсы. Все покупки — навсегда.
            </p>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="sticky top-[60px] z-40 bg-bg-main/95 backdrop-blur border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto py-3 scrollbar-none">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-shrink-0 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  tab === t ? 'bg-accent text-white shadow-[0_0_12px_rgba(29,165,232,0.3)]' : 'text-text-light hover:text-white hover:bg-white/5'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">

        {/* ПРИВИЛЕГИИ */}
        {tab === 'Привилегии' && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {privileges.map((p) => {
              const style = TIER_STYLES[p.tier - 1]
              const isOpen = openPriv === p.rankCode
              return (
                <div
                  key={p.rankCode}
                  className="relative rounded-2xl border border-white/5 bg-bg-card overflow-hidden flex flex-col transition-all duration-300 hover:border-white/10"
                  style={{ boxShadow: isOpen ? `0 0 24px ${style.glow}` : undefined }}
                >
                  {/* Top accent line */}
                  <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, transparent, ${style.color}, transparent)` }} />

                  <div className="p-5 flex-1">
                    {/* Tier badge + name */}
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full border" style={{ color: style.color, borderColor: `${style.color}40`, background: `${style.color}12` }}>
                        {style.label}
                      </span>
                      <span className="text-xs text-text-light/40 font-mono">Tier {p.tier}</span>
                    </div>

                    <h3 className="font-mono text-2xl font-bold text-white mb-1">{p.displayName}</h3>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-2xl font-bold" style={{ color: style.color }}>{p.price.toLocaleString('ru-RU')}</span>
                      <span className="text-text-light/60 text-sm">₽</span>
                      <span className="ml-2 text-xs bg-white/5 text-text-light/50 px-2 py-0.5 rounded-full">навсегда</span>
                    </div>

                    {/* Features */}
                    <ul className="space-y-1.5 mb-4">
                      {p.features.map((f) => (
                        <li key={f} className="flex gap-2 text-xs text-text-light/80 leading-relaxed">
                          <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" viewBox="0 0 16 16" fill="none">
                            <circle cx="8" cy="8" r="7" stroke={style.color} strokeWidth="1.5"/>
                            <path d="M5 8l2 2 4-4" stroke={style.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>

                    {/* Commands toggle */}
                    {p.commands.length > 0 && (
                      <button
                        onClick={() => setOpenPriv(isOpen ? null : p.rankCode)}
                        className="text-xs text-text-light/50 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        <svg className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="6,9 12,15 18,9"/></svg>
                        {isOpen ? 'Скрыть' : `Команды (${p.commands.length})`}
                      </button>
                    )}
                    {isOpen && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {p.commands.map((cmd) => (
                          <span key={cmd} className="font-mono text-xs bg-white/5 border border-white/10 text-text-light/70 px-2 py-0.5 rounded">
                            {cmd}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Buy button */}
                  <div className="px-5 pb-5">
                    <button
                      className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90 hover:scale-[1.02]"
                      style={{ background: `${style.color}20`, color: style.color, border: `1px solid ${style.color}30` }}
                    >
                      Купить за {p.price.toLocaleString('ru-RU')} ₽
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ВАЛЮТА */}
        {tab === 'Валюта' && (
          <div>
            <div className="mb-8">
              <h2 className="font-mono text-2xl font-bold text-white mb-2">Гхыбки — игровая валюта</h2>
              <p className="text-text-light">Внутриигровая валюта сервера. Используй для торговли, покупок и обменов.</p>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              {fluxPackages.map((pkg) => (
                <div key={pkg.amount} className="card hover:border-accent/20 flex flex-col gap-4 transition-all duration-300 hover:scale-[1.02]">
                  <div className="text-center">
                    <div className="text-4xl mb-2">💎</div>
                    <div className="font-mono text-2xl font-bold text-gradient">{pkg.amount.toLocaleString('ru-RU')}</div>
                    <div className="text-text-light/50 text-sm">гхыбок</div>
                  </div>
                  <div className="text-center text-lg font-bold text-white">{pkg.price.toLocaleString('ru-RU')} ₽</div>
                  <button className="btn-primary text-sm justify-center">Купить</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* КЕЙСЫ */}
        {tab === 'Кейсы' && (
          <div className="space-y-10">
            {cases.map((c) => (
              <div key={c.name}>
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-3xl">{c.icon}</span>
                  <h2 className="font-mono text-xl font-bold text-white">{c.name}</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {c.packs.map((pack) => (
                    <div key={pack.keys} className={`card flex flex-col items-center gap-3 text-center hover:border-accent/20 transition-all duration-300 hover:scale-[1.02] ${pack.save ? 'border-accent/15' : ''}`}>
                      {pack.save ? (
                        <span className="text-xs bg-accent/10 text-accent border border-accent/20 px-2 py-0.5 rounded-full font-medium">−{pack.save}%</span>
                      ) : <span className="h-5" />}
                      <div className="font-mono text-3xl font-bold text-white">×{pack.keys}</div>
                      <div className="text-text-light/50 text-xs">ключей</div>
                      <div className="font-bold text-white">{pack.price.toLocaleString('ru-RU')} ₽</div>
                      <button className="w-full btn-ghost text-xs py-1.5">Купить</button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* РАЗНОЕ */}
        {tab === 'Разное' && (
          <div>
            <div className="mb-8">
              <h2 className="font-mono text-2xl font-bold text-white mb-2">Прочие услуги</h2>
              <p className="text-text-light">Снятие наказаний и другие разовые услуги.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {miscItems.map((item) => (
                <div key={item.name} className="card flex flex-col gap-4 hover:border-accent/20 transition-all duration-300">
                  <div className="text-3xl">{item.icon}</div>
                  <div>
                    <h3 className="font-semibold text-white text-lg mb-1">{item.name}</h3>
                    <p className="text-text-light/60 text-sm">{item.desc}</p>
                  </div>
                  <div className="mt-auto">
                    <div className="text-2xl font-bold text-gradient mb-3">{item.price} ₽</div>
                    <button className="btn-primary text-sm w-full justify-center">Купить</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Notice */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="border border-white/5 rounded-xl p-5 bg-bg-section text-text-light/50 text-sm text-center">
          Все покупки предоставляются навсегда и не привязаны к сезонам. Возврат средств осуществляется в соответствии с пользовательским соглашением. По вопросам обращайтесь в{' '}
          <a href="https://discord.gg/BPmxWwdChY" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Discord</a>.
        </div>
      </div>
    </div>
  )
}
