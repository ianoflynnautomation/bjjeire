interface ErrorMessageProps {
  message: string
  code?: string
}

function ErrorMessage({ message, code }: ErrorMessageProps) {
  return (
    <div
      data-testid="error-message"
      className="text-center p-8 text-orange-700 bg-orange-50 rounded-md shadow-sm"
    >
      <h3 data-testid="error-message-heading" className="text-lg font-semibold text-slate-800">
        Error
      </h3>
      <p data-testid="error-message-text" className="text-slate-600">
        {message}
      </p>
      {code && (
        <p data-testid="error-message-code" className="text-slate-600">
          Code: {code}
        </p>
      )}
    </div>
  )
}

export default ErrorMessage
