import { useState } from 'react'
import { useSEO } from '../../hooks/useSEO'

const SERVER_IP = 'play.pfaumc.online'

function buildSteps(copyIP) {
  return [
  {
    n: '1',
    title: 'Получите Minecraft Java Edition',
    content: (
      <>
        <p>
          Для игры на PfauMC нужен Minecraft Java Edition.
          Рекомендуем купить лицензию на официальном сайте:{' '}
          <a
            href="https://www.minecraft.net/ru-ru/store/minecraft-java-bedrock-edition-pc"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            minecraft.net
          </a>
        </p>
      </>
    ),
  },
  {
    n: '2',
    title: 'Установите Prism Launcher (рекомендуется)',
    content: (
      <>
        <p>
          Мы рекомендуем <strong className="text-white">Prism Launcher</strong> — бесплатный
          открытый лаунчер, который удобно управляет несколькими версиями игры и профилями.
        </p>
        <div className="mt-3 p-4 bg-accent/10 border border-accent/25 rounded-xl">
          <div className="font-mono text-sm font-bold text-accent mb-2">Официальный сайт</div>
          <a
            href="https://prismlauncher.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline font-mono text-sm break-all"
          >
            prismlauncher.org
          </a>
          <p className="text-text-light/70 text-xs mt-1.5">
            Загрузите установщик для вашей ОС (Windows · macOS · Linux) на странице Download
          </p>
        </div>
        <div className="mt-3 p-4 bg-bg-section border border-white/5 rounded-xl">
          <div className="font-mono text-sm font-bold text-white mb-2">Официальный гайд по установке</div>
          <a
            href="https://prismlauncher.org/wiki/getting-started/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline font-mono text-xs break-all"
          >
            prismlauncher.org/wiki/getting-started/
          </a>
          <p className="text-text-light/70 text-xs mt-1.5">
            Пошаговый гайд на английском — установка Java, добавление аккаунта, создание инстанса
          </p>
        </div>
      </>
    ),
  },
  {
    n: '3',
    title: 'Войдите в Microsoft-аккаунт',
    content: (
      <>
        <p>После установки Prism Launcher:</p>
        <ol className="mt-2 space-y-1.5 list-none">
          {[
            'Откройте Prism Launcher',
            'В правом верхнем углу нажмите на иконку профиля → «Add Account»',
            'Выберите «Microsoft» и войдите через браузер',
            'После авторизации ваш ник появится в лаунчере',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2.5 text-text-light text-sm">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-mono font-bold mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </>
    ),
  },
  {
    n: '4',
    title: 'Создайте инстанс Minecraft',
    content: (
      <>
        <p>Создайте новый игровой профиль (инстанс) нужной версии:</p>
        <ol className="mt-2 space-y-1.5 list-none">
          {[
            'Нажмите «Add Instance» (кнопка с плюсом)',
            'Выберите Vanilla → нужную версию (см. главную страницу сайта)',
            'Нажмите OK — инстанс создан',
            'Запустите его кнопкой «Launch»',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2.5 text-text-light text-sm">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-mono font-bold mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </>
    ),
  },
  {
    n: '5',
    title: 'Подключитесь к серверу',
    content: (
      <>
        <p>После запуска игры:</p>
        <ol className="mt-2 space-y-1.5 list-none">
          {[
            'В главном меню нажмите «Сетевая игра» → «Добавить сервер»',
            <span key="ip">
              Введите адрес сервера:{' '}
              <code
                onClick={copyIP}
                title="Скопировать IP"
                className="bg-bg-section px-2 py-0.5 rounded font-mono text-accent cursor-pointer hover:bg-accent/20 transition-colors"
              >
                {SERVER_IP}
              </code>
            </span>,
            'Нажмите «Готово», затем дважды кликните на сервер чтобы войти',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2.5 text-text-light text-sm">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-mono font-bold mt-0.5">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <div className="mt-4 p-4 bg-green-500/10 border border-green-500/25 rounded-xl">
          <div className="flex items-center gap-2 text-green-400 font-mono font-bold text-sm mb-1">
            ✅ Готово!
          </div>
          <p className="text-text-light/80 text-sm">
            Добро пожаловать на PfauMC! Выбери режим — Ванила или Политическое выживание — и начни играть.
          </p>
        </div>
      </>
    ),
  },
  ]
}

export default function WikiGuide() {
  useSEO('Как зайти на сервер — PfauMC Wiki', 'Пошаговый гайд по установке лаунчера и подключению к Minecraft серверу PfauMC.')

  const [copied, setCopied] = useState(false)

  const copyIP = async () => {
    try {
      await navigator.clipboard.writeText(SERVER_IP)
    } catch {
      const el = document.createElement('textarea')
      el.value = SERVER_IP
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const steps = buildSteps(copyIP)

  return (
    <article>
      {/* Header */}
      <div className="mb-8">
        <div className="text-text-light/50 text-xs font-mono uppercase tracking-widest mb-3">Начало работы</div>
        <h1 className="font-mono text-3xl sm:text-4xl font-bold text-white mb-3">
          🚀 Как зайти на сервер
        </h1>
        <p className="text-text-light text-base leading-relaxed max-w-2xl">
          Полный пошаговый гайд от покупки игры до первого входа на PfauMC.
          Займёт около 10 минут.
        </p>
      </div>

      {/* IP quick access */}
      <div className="mb-8 p-4 bg-bg-section border border-white/10 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <div className="text-text-light/50 text-xs font-mono uppercase tracking-widest mb-1">IP-адрес сервера</div>
          <code
            onClick={copyIP}
            title="Скопировать IP"
            className="font-mono text-xl font-bold text-white cursor-pointer hover:text-accent transition-colors"
          >
            {SERVER_IP}
          </code>
        </div>
        <button
          onClick={copyIP}
          className="sm:ml-auto btn-ghost text-sm py-2 px-4"
        >
          {copied ? '✓ Скопировано' : 'Скопировать'}
        </button>
      </div>
      {copied && <div className="copy-toast">IP скопирован</div>}

      {/* Launcher notice */}
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-4 bg-accent/8 border border-accent/20 rounded-xl">
          <div className="font-mono text-sm font-bold text-accent mb-2">⭐ Рекомендуем</div>
          <ul className="space-y-2">
            <li className="text-sm text-text-light flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0 mt-1.5" />
              <span>
                <strong className="text-white">Prism Launcher</strong> — бесплатный, открытый,
                удобно управляет версиями и профилями
              </span>
            </li>
            <li className="text-sm text-text-light flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0 mt-1.5" />
              <span>Официальный лаунчер Minecraft (лицензия)</span>
            </li>
          </ul>
        </div>
        <div className="p-4 bg-red-500/8 border border-red-500/20 rounded-xl">
          <div className="font-mono text-sm font-bold text-red-400 mb-2">⚠️ TLauncher</div>
          <p className="text-text-light/80 text-sm leading-relaxed">
            Проблемы, возникшие при использовании TLauncher, мы <strong className="text-red-400">не рассматриваем</strong>.
            Если у тебя баг или ошибка — убедись что дело не в лаунчере, переключившись на рекомендуемый.
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-6">
        {steps.map((step, i) => (
          <div key={step.n} className="card">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center font-mono font-bold text-accent text-sm">
                {step.n}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-mono font-bold text-white text-base mb-3">{step.title}</h3>
                <div className="text-text-light text-sm leading-relaxed space-y-2">
                  {step.content}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Help */}
      <div className="mt-6 p-4 bg-accent/8 border border-accent/20 rounded-xl text-sm text-text-light">
        <span className="text-accent font-bold">Не получается войти? </span>
        Обратитесь в{' '}
        <a href="https://discord.gg/BPmxWwdChY" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
          Discord
        </a>{' '}
        или{' '}
        <a href="https://t.me/pfaumc" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
          Telegram
        </a>{' '}
        — помогут разобраться.
      </div>
    </article>
  )
}
