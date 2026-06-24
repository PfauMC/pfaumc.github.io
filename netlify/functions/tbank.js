// Serverless proxy: скрывает Password от клиента, обходит CORS
// Для прода поменять TBANK_API_URL на https://securepay.tinkoff.ru/v2/Init

const TBANK_API_URL = 'https://securepay.tinkoff.ru/v2/Init'

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const res = await fetch(TBANK_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: event.body,
    })
    const data = await res.json()
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  } catch (e) {
    return {
      statusCode: 502,
      body: JSON.stringify({ Success: false, Message: e.message }),
    }
  }
}
