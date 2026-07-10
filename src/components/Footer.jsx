import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { PfauIcon } from './LoadingScreen'

const SERVER_IP = 'play.pfaumc.online'

export default function Footer() {
  const [copied, setCopied] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const isHome = location.pathname === '/'

  const copyIP = async () => {
    try { await navigator.clipboard.writeText(SERVER_IP) } catch {
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

  const handleSection = (hash) => {
    if (isHome) {
      document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate('/')
      setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' }), 300)
    }
  }

  return (
    <footer className="relative bg-bg-section border-t border-white/5">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="py-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4 w-fit">
              <PfauIcon className="w-7 h-7" />
              <span className="font-mono font-bold text-xl">
                <span className="text-white">Pfau</span>
                <span className="text-accent">MC</span>
              </span>
            </Link>
            <p className="text-text-light text-sm leading-relaxed max-w-xs mb-5">
              Твой мир. Твои правила. Присоединяйся к сообществу PfauMC и найди свой стиль игры.
            </p>
            <button
              onClick={copyIP}
              className="group flex items-center gap-2.5 bg-bg-main/60 border border-white/10 hover:border-accent/40 rounded-lg px-4 py-2.5 transition-all duration-200 hover:bg-accent/5 mb-4"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="font-mono text-sm font-semibold text-white">{SERVER_IP}</span>
              <span className="ml-auto text-text-light/40 group-hover:text-accent transition-colors text-xs">
                {copied ? <span className="text-green-400">✓</span> : 'копировать'}
              </span>
            </button>
            <div className="space-y-1">
              <p className="text-text-light/50 text-xs">ИНН: 231227267502</p>
              <p className="text-text-light/50 text-xs">Email: <a href="mailto:contact@goyland.ru" className="hover:text-white transition-colors">contact@goyland.ru</a></p>
            </div>
          </div>

          {/* Nav */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-4">Сервер</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Главная', action: () => handleSection('#hero') },
                { label: 'Режимы', action: () => handleSection('#modes') },
                { label: '💎 Донат', action: () => navigate('/donate') },
              ].map((item) => (
                <li key={item.label}>
                  <button
                    onClick={item.action}
                    className="text-text-light/60 hover:text-white text-sm transition-colors"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Socials */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-1">Сообщество</h4>
            <p className="text-text-light/40 text-xs mb-3">Вопросы — в Discord или Telegram</p>
            <ul className="space-y-2.5">
              <li>
                <a href="https://discord.gg/BPmxWwdChY" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-text-light/60 hover:text-white text-sm transition-colors">
                  <DiscordIcon className="w-4 h-4" /> Discord
                </a>
              </li>
              <li>
                <a href="https://t.me/pfaumc" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-text-light/60 hover:text-white text-sm transition-colors">
                  <TelegramIcon className="w-4 h-4" /> Telegram
                </a>
              </li>
              <li>
                <a href="https://www.youtube.com/@PfauMC" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-text-light/60 hover:text-[#FF0000] text-sm transition-colors">
                  <YouTubeIcon className="w-4 h-4" /> YouTube
                </a>
              </li>
            </ul>
          </div>

          {/* Документы */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-4">Документы</h4>
            <ul className="space-y-2.5">
              <li>
                <a href="/agreement.pdf" target="_blank" rel="noopener noreferrer"
                  className="text-text-light/60 hover:text-white text-sm transition-colors">
                  Пользовательское соглашение
                </a>
              </li>
              <li>
                <a href="/privacy.pdf" target="_blank" rel="noopener noreferrer"
                  className="text-text-light/60 hover:text-white text-sm transition-colors">
                  Политика конфиденциальности
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="py-5 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-text-light/40 text-xs text-center sm:text-left order-last sm:order-none">
            © {new Date().getFullYear()} PfauMC. Все права защищены. Не является официальным продуктом Mojang Studios.
          </p>
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            <TBankBadge />
            <TPayBadge />
            <VisaBadge />
            <MastercardBadge />
            <MirBadge />
          </div>
          <div className="flex items-center gap-3">
            <a href="https://t.me/pfaumc" target="_blank" rel="noopener noreferrer" className="text-text-light/40 hover:text-[#29B6F6] transition-colors" aria-label="Telegram">
              <TelegramIcon className="w-4 h-4" />
            </a>
            <a href="https://discord.gg/BPmxWwdChY" target="_blank" rel="noopener noreferrer" className="text-text-light/40 hover:text-[#5865F2] transition-colors" aria-label="Discord">
              <DiscordIcon className="w-4 h-4" />
            </a>
            <a href="https://www.youtube.com/@PfauMC" target="_blank" rel="noopener noreferrer" className="text-text-light/40 hover:text-[#FF0000] transition-colors" aria-label="YouTube">
              <YouTubeIcon className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

function TBankBadge() {
  return (
    <span className="inline-flex items-center gap-1 bg-[#FFDD2D] rounded px-2 py-0.5">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="12" fill="#FFDD2D"/>
        <path d="M7 8h10v2H7V8zm0 3h10v2H7v-2zm0 3h7v2H7v-2z" fill="#000"/>
      </svg>
      <span className="text-black font-bold text-[10px] leading-none">Т-Банк</span>
    </span>
  )
}

function TPayBadge() {
  return (
    <span className="inline-flex items-center gap-1 bg-[#FFDD2D] rounded px-2 py-0.5">
      <span className="text-black font-bold text-[10px] leading-none">T-Pay</span>
    </span>
  )
}

function VisaBadge() {
  return (
    <svg width="38" height="22" viewBox="0 0 38 22" fill="none" className="opacity-70 hover:opacity-100 transition-opacity">
      <rect width="38" height="22" rx="3" fill="#1A1F71"/>
      <text x="19" y="15" textAnchor="middle" fill="white" fontSize="11" fontFamily="Arial" fontWeight="bold" fontStyle="italic">VISA</text>
    </svg>
  )
}

function MastercardBadge() {
  return (
    <svg width="38" height="22" viewBox="0 0 38 22" fill="none" className="opacity-70 hover:opacity-100 transition-opacity">
      <rect width="38" height="22" rx="3" fill="#252525"/>
      <circle cx="14" cy="11" r="7" fill="#EB001B"/>
      <circle cx="24" cy="11" r="7" fill="#F79E1B"/>
      <path d="M19 5.8a7 7 0 0 1 0 10.4A7 7 0 0 1 19 5.8z" fill="#FF5F00"/>
    </svg>
  )
}

function MirBadge() {
  return (
    <svg width="38" height="22" viewBox="0 0 38 22" fill="none" className="opacity-70 hover:opacity-100 transition-opacity">
      <rect width="38" height="22" rx="3" fill="#0F754E"/>
      <text x="19" y="15" textAnchor="middle" fill="white" fontSize="10" fontFamily="Arial" fontWeight="bold">МИР</text>
    </svg>
  )
}

function TelegramIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  )
}

function DiscordIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.101 18.08.114 18.1.132 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  )
}

function YouTubeIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  )
}
