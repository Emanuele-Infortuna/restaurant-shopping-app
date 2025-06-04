import React from 'react';
import { Loader } from 'lucide-react';

export const Loading: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
      <div className="text-center">
        <Loader className="w-12 h-12 text-red-600 animate-spin mx-auto mb-4" />
        <p className="text-red-700 font-medium">Caricamento...</p>
      </div>
    </div>
  );
};