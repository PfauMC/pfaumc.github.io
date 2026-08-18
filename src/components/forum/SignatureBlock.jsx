import { renderSignature } from '../../lib/markup'

/** Подпись автора под сообщением — визуально тише самого сообщения, высота ограничена. */
export default function SignatureBlock({ text, keyPrefix = 'sig', className = '' }) {
  if (!text?.trim()) return null
  return (
    <div
      className={`mt-2.5 pt-2.5 border-t border-white/5 text-xs text-text-light/50 leading-snug break-words overflow-hidden ${className}`}
      style={{ maxHeight: 280 }}
    >
      {renderSignature(text, keyPrefix)}
    </div>
  )
}
