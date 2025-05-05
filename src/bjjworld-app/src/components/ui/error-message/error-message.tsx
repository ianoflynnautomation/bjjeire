interface ErrorMessageProps {
  message: string;
  code?: string;
}

function ErrorMessage({ message, code }: ErrorMessageProps) {
  return (
    <div className="text-center p-8 text-red-600 bg-red-100 rounded">
      <h3 className="text-lg font-semibold">Error</h3>
      <p>{message}</p>
      {code && <p>Code: {code}</p>}
    </div>
  );
}

export default ErrorMessage;