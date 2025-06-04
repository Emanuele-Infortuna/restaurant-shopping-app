import { useState, useEffect } from 'react';
import type { User, LoginForm } from '../types';
import { apiService } from '../services/api';

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token') || null);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);

  // Imposta il token nel servizio API quando cambia
  useEffect(() => {
    apiService.setToken(token);
  }, [token]);

  // Controllo token all'avvio
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const data = await apiService.verifyToken();
          setCurrentUser(data.user);
        } catch (error) {
          localStorage.removeItem('token');
          setToken(null);
          console.error('Token non valido:', error);
        }
      }
      setInitialLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (credentials: LoginForm): Promise<void> => {
    const data = await apiService.login(credentials);
    setToken(data.token);
    setCurrentUser(data.user);
    localStorage.setItem('token', data.token);
  };

  const logout = (): void => {
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
  };

  return {
    currentUser,
    token,
    initialLoading,
    login,
    logout,
    isAuthenticated: !!currentUser
  };
};