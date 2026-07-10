import { useState } from 'react'

const faqData = [
  {
    category: '🎮 Игра и подключение',
    items: [
      {
        q: 'Какая версия Minecraft нужна для игры?',
        a: 'Сервер работает на Java Edition. Актуальная версия указана на главной странице сайта и в статусе сервера. Рекомендуем использовать последнюю поддерживаемую версию.',
      },
      {
        q: 'Как скопировать IP-адрес?',
        a: <>Адрес сервера: <code className="bg-bg-section px-2 py-0.5 rounded font-mono text-accent text-sm">play.pfaumc.online</code>. Можно скопировать прямо с главной страницы кнопкой «Скопировать».</>,
      },
      {
        q: 'Поддерживается ли TLauncher?',
        a: 'Зайти можно, но проблемы, возникшие из-за TLauncher, мы не рассматриваем. Если что-то не работает — сначала попробуй воспроизвести на рекомендуемом лаунчере (Prism Launcher или официальный). Если проблема пропала — это был TLauncher.',
      },
      {
        q: 'Нужна ли регистрация для входа?',
        a: 'Нет. Достаточно иметь лицензионный аккаунт Minecraft — войдите через Microsoft-аккаунт в лаунчере, и можно подключаться.',
      },
      {
        q: 'Есть ли белый список (whitelist)?',
        a: 'В базовом режиме вайтлист не используется. Если в какой-то момент он включён — информация появится на нашем Discord. Следите за анонсами.',
      },
    ],
  },
  {
    category: '🗺️ Режимы сервера',
    items: [
      {
        q: 'Чем отличаются режимы Ванила и Политическое выживание?',
        a: 'Ванила — это классический SMP без PvP, где ценятся постройки, сотрудничество и честная игра. Политическое выживание — анархия и PvP-режим с возможностью грифа и захвата территорий. Подробнее на главной странице в разделе «Режимы».',
      },
      {
        q: 'Можно ли играть сразу на двух режимах?',
        a: 'Да, это разные миры на одном сервере. Переключение между ними происходит в игре через меню или команду.',
      },
      {
        q: 'Когда происходят вайпы?',
        a: 'Мы стараемся не делать вайпов без веской причины. Анонсы о вайпе публикуются заранее в Discord и Telegram за несколько дней.',
      },
    ],
  },
  {
    category: '💎 Донат и привилегии',
    items: [
      {
        q: 'Есть ли pay-to-win?',
        a: 'Нет. Донат не даёт игровых преимуществ перед обычными игроками — только косметику, цвет ника и дополнительные команды, не влияющие на геймплей.',
      },
      {
        q: 'Освобождает ли донат от правил?',
        a: 'Нет. Донаторы подчиняются тем же правилам, что и все остальные. Статус не защищает от бана.',
      },
      {
        q: 'Как сделать донат?',
        a: 'Перейдите на страницу «Донат» в меню сайта и следуйте инструкциям.',
      },
    ],
  },
  {
    category: '⚙️ Технические вопросы',
    items: [
      {
        q: 'Игра лагает — что делать?',
        a: 'Убедитесь что выделили достаточно оперативной памяти в настройках лаунчера (рекомендуем 4-6 GB). Попробуйте снизить дальность прорисовки. Если проблема в нашем сервере — сообщите в Discord.',
      },
      {
        q: 'Нашёл баг в игре — куда сообщить?',
        a: 'Обращайтесь в Discord в специальный канал для репортов. Не эксплуатируйте баги — это нарушение правил.',
      },
      {
        q: 'Сервер недоступен — что происходит?',
        a: 'Проверьте статус на нашем сайте (/stats). Если сервер помечен как «офлайн» — ведутся технические работы или плановое обслуживание. Информация появится в Discord и Telegram.',
      },
    ],
  },
  {
    category: '⚖️ Правила и модерация',
    items: [
      {
        q: 'Как пожаловаться на игрока?',
        a: 'Обратитесь в Discord с ником нарушителя, описанием ситуации и, по возможности, скриншотами или видео. Не выясняйте отношения в игровом чате.',
      },
      {
        q: 'Меня заблокировали — что делать?',
        a: 'Напишите апелляцию в Discord. Спокойно объясните ситуацию. Скандалы и агрессия в апелляции снижают шансы на разбан. Решение администрации окончательно.',
      },
      {
        q: 'Можно ли использовать моды?',
        a: 'Моды, не дающие игровых преимуществ, разрешены: Optifine/Sodium (графика), Replay Mod (запись), миникарты без отображения игроков. Запрещены: X-Ray, ESP, чит-клиенты, автокликеры.',
      },
    ],
  },
]

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between gap-4 py-4 text-left group"
      >
        <span className={`text-sm font-medium transition-colors ${open ? 'text-accent' : 'text-white group-hover:text-accent'}`}>
          {q}
        </span>
        <span className={`flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-all mt-0.5 ${
          open ? 'border-accent text-accent rotate-45' : 'border-white/20 text-text-light/50 group-hover:border-accent/50'
        }`}>
          <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2}>
            <line x1="6" y1="0" x2="6" y2="12" />
            <line x1="0" y1="6" x2="12" y2="6" />
          </svg>
        </span>
      </button>
      {open && (
        <div className="pb-4 text-text-light text-sm leading-relaxed pr-8">
          {a}
        </div>
      )}
    </div>
  )
}

export default function WikiFAQ() {
  return (
    <article>
      <div className="mb-8">
        <div className="text-text-light/50 text-xs font-mono uppercase tracking-widest mb-3">Справка</div>
        <h1 className="font-mono text-3xl sm:text-4xl font-bold text-white mb-3">
          ❓ Часто задаваемые вопросы
        </h1>
        <p className="text-text-light text-base leading-relaxed max-w-2xl">
          Ответы на самые популярные вопросы о сервере. Не нашли свой — спросите в Discord.
        </p>
      </div>

      <div className="space-y-4">
        {faqData.map((section) => (
          <div key={section.category} className="card">
            <h2 className="font-mono text-base font-bold text-white mb-2 flex items-center gap-2">
              {section.category}
            </h2>
            <div>
              {section.items.map((item) => (
                <FAQItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-accent/8 border border-accent/20 rounded-xl text-sm text-text-light">
        <span className="text-accent font-bold">Не нашли ответ? </span>
        Задайте вопрос в{' '}
        <a href="https://discord.gg/BPmxWwdChY" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
          Discord
        </a>{' '}
        или{' '}
        <a href="https://t.me/pfaumc" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
          Telegram
        </a>.
      </div>
    </article>
  )
}
