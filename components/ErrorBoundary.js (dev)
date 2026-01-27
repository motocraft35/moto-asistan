import { useEffect, useState } from 'react';

const ErrorBoundary = ({ children }) => {
  const [error, setError] = useState(null);

  useEffect(() => {
    if (error) {
      // Retry logic here
      // For example:
      const retry = async () => {
        try {
          // Your retry logic here
          // For example:
          const response = await fetch('/api/endpoint');
          if (!response.ok) {
            throw new Error('Network error');
          }
        } catch (error) {
          setError(error);
        }
      };
      retry();
    }
  }, [error]);

  if (error) {
    return (
      <div>
        <h1>Oops, something went wrong!</h1>
        <p>{error.message}</p>
      </div>
    );
  }

  return children;
};

export default ErrorBoundary;