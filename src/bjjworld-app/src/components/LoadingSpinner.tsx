import React from 'react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: string
  text?: string
  className?: string
  'data-testid'?: string
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'text-blue-600',
  text,
  className = '',
  'data-testid': baseTestId = 'spinner',
}) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-[3px]',
    lg: 'w-12 h-12 border-4',
  }

  return (
    <div
      data-testid={baseTestId}
      className={`flex flex-col items-center justify-center p-4 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div
        data-testid={`${baseTestId}-icon`}
        className={`animate-spin rounded-full ${sizeClasses[size]} ${color} border-t-transparent border-solid`}
        aria-hidden="true"
      ></div>
      {text && (
        <p
          data-testid={`${baseTestId}-text`}
          className={`mt-3 text-sm font-medium text-gray-600 ${color}`}
        >
          {text}
        </p>
      )}
      <span className="sr-only">{text || 'Loading...'}</span>
    </div>
  )
}

export default LoadingSpinner
