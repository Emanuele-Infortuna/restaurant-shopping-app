import React from 'react';
import { LogOut } from 'lucide-react';
import type { User } from '../types';
import logo from '../assets/logo.png'

interface HeaderProps {
  currentUser: User;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, onLogout }) => {
  return (
    <div className="bg-white shadow-lg border-b-4 border-red-600">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="p-0">
              {/*<ShoppingCart className="w-6 h-6 text-white" />*/}
              <img 
                src={logo}
                alt="Logo Ristorante" 
                className="mx-auto mb-2 max-h-16 object-contain"
              />

            </div>
            <div>
              <h1 className="text-2xl font-bold text-red-800">Lista Spesa Brina</h1>
              {/*<p className="text-red-600 text-sm">Gestione acquisti e forniture</p>*/}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-red-800 font-medium">{currentUser.name}</p>
              <p className="text-red-600 text-sm">
                {currentUser.role === 'admin' ? 'Amministratore' : 'Dipendente'}
              </p>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 active:bg-red-800 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Esci</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};