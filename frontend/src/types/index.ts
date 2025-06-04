export interface User {
  id: number;
  name: string;
  username: string;
  role: 'admin' | 'employee';
}

export interface AvailableItem {
  id: number;
  name: string;
  category: string;
}

export interface ShoppingListItem {
  id: number;
  name: string;
  quantity: string;
  notes?: string;
  isPurchased: boolean;
  addedBy: string;
  timestamp: string;
}

export interface LoginForm {
  username: string;
  password: string;
}

export interface NewItemForm {
  name: string;
  quantity: string;
  notes: string;
}

export interface ApiRequestOptions extends RequestInit {
  headers?: Record<string, string>;
}