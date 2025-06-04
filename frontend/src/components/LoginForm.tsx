import React, { useState } from 'react';
import { Eye, EyeOff, Loader } from 'lucide-react';
import type { LoginForm as LoginFormType } from '../types';
import { ErrorNotification, SuccessNotification } from './Notifications';
import logo from '../assets/logo.png';

interface LoginFormProps {
  onLogin: (credentials: LoginFormType) => Promise<void>;
  loading: boolean;
  error: string;
  success: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin, loading, error, success }) => {
  const [loginForm, setLoginForm] = useState<LoginFormType>({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!loginForm.username.trim() || !loginForm.password.trim()) {
      return;
    }

    try {
      await onLogin(loginForm);
      setLoginForm({ username: '', password: '' });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Error handling is managed by parent component
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md border border-red-100">
        <div className="text-center mb-8">
          <img 
            src={logo}
            alt="Logo Ristorante" 
            className="mx-auto mb-2 max-h-16 object-contain"
          />
          <h1 className="text-3xl font-bold text-red-800 mb-2">Lista Spesa</h1>
        </div>
        
        {error && <ErrorNotification message={error} />}
        {success && <SuccessNotification message={success} />}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-red-700 font-medium mb-2">Username</label>
            <input
              type="text"
              placeholder="Inserisci il tuo username"
              value={loginForm.username}
              onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
              className="w-full p-4 border-2 border-red-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all outline-none"
              disabled={loading}
              required
            />
          </div>
          <div>
            <label className="block text-red-700 font-medium mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Inserisci la tua password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                className="w-full p-4 border-2 border-red-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all outline-none pr-12"
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 hover:text-red-700"
                disabled={loading}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white p-4 rounded-lg hover:bg-red-700 active:bg-red-800 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin mr-2" />
                Accesso in corso...
              </>
            ) : (
              'Accedi'
            )}
          </button>
        </form>
        
        <div className="mt-8 p-4 bg-red-50 rounded-lg border border-red-200">
          <p className="text-sm text-red-700 font-medium mb-3">Account di prova:</p>
          <div className="space-y-1 text-xs text-red-600">
            <p><strong>Admin:</strong> admin / admin123</p>
            <p><strong>Dipendente:</strong> mario / mario123</p>
            <p><strong>Dipendente:</strong> lucia / lucia123</p>
          </div>
        </div>
      </div>
    </div>
  );
};