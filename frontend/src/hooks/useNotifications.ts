import { useState, useEffect } from 'react';

export const useNotifications = () => {
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Auto-clear error messages after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Auto-clear success messages after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const showError = (message: string) => {
    setError(message);
    setSuccess('');
  };

  const showSuccess = (message: string) => {
    setSuccess(message);
    setError('');
  };

  const clearNotifications = () => {
    setError('');
    setSuccess('');
  };

  return {
    error,
    success,
    showError,
    showSuccess,
    clearNotifications
  };
};