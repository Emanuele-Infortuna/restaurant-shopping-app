import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface NotificationProps {
  message: string;
}

export const ErrorNotification: React.FC<NotificationProps> = ({ message }) => (
  <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg flex items-start shadow-sm">
    <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
    <span>{message}</span>
  </div>
);

export const SuccessNotification: React.FC<NotificationProps> = ({ message }) => (
  <div className="mb-6 p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg flex items-start shadow-sm">
    <CheckCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
    <span>{message}</span>
  </div>
);