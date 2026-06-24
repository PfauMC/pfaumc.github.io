// T-Bank acquiring integration
// Запросы идут через /api/tbank (Vite-прокси → securepay.tinkoff.ru в dev,
// Netlify Function в prod). Password не виден в браузере.
const TERMINAL_KEY = '1782062080172DEMO'
const PASSWORD = 'qJZaLC4r0#5$OZ8_'
const API_URL = '/api/tbank'

async function sha256(str) {
  const buf = new TextEncoder().encode(str)
  const hash = await crypto.subtle.digest('SHA-256', buf)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// Token = SHA-256(concat of sorted param VALUES + Password)
// Исключены: Token, Receipt, DATA, Shops, Items
async function generateToken(flatParams) {
  const entries = Object.entries({ ...flatParams, Password: PASSWORD })
    .sort(([a], [b]) => a.localeCompare(b))
  return sha256(entries.map(([, v]) => String(v)).join(''))
}

export async function createPayment({ amount, description, nick }) {
  const orderId = `pfau-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const successURL = `${window.location.origin}/donate?paid=ok`
  const failURL = `${window.location.origin}/donate?paid=fail`

  const flatParams = {
    TerminalKey: TERMINAL_KEY,
    Amount: amount * 100, // в копейках
    OrderId: orderId,
    Description: `${description} | ${nick}`.slice(0, 140),
    SuccessURL: successURL,
    FailURL: failURL,
  }

  const token = await generateToken(flatParams)

  const body = {
    ...flatParams,
    Token: token,
    DATA: { Nick: nick },
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) throw new Error(`Ошибка сети: ${res.status}`)

  const data = await res.json()
  if (!data.Success) throw new Error(data.Message || `Ошибка ${data.ErrorCode}`)

  return data.PaymentURL
}
