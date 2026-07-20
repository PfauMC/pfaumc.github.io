// Single accessible live region for copy-to-clipboard feedback. Always
// mounted so screen readers pick up the text change (aria-live requires the
// container itself to persist — toggling the whole node in and out breaks it).
export default function CopyToast({ copied, error, successMessage = 'Скопировано', errorMessage = 'Не удалось скопировать' }) {
  return (
    <div aria-live="polite" role="status" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      {(copied || error) && (
        <div className={`copy-toast ${error ? 'bg-red-500' : 'bg-accent'}`}>
          {error ? errorMessage : successMessage}
        </div>
      )}
    </div>
  )
}
