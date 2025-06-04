import type { ApiRequestOptions, User, AvailableItem, ShoppingListItem, LoginForm } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async apiRequest(endpoint: string, options: ApiRequestOptions = {}) {
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
        ...options.headers
      },
      ...options
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Errore nella richiesta');
    }

    return data;
  }

  async login(credentials: LoginForm): Promise<{ token: string; user: User }> {
    return this.apiRequest('/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  async verifyToken(): Promise<{ user: User }> {
    return this.apiRequest('/verify');
  }

  async getAvailableItems(): Promise<AvailableItem[]> {
    return this.apiRequest('/available-items');
  }

  async getShoppingList(): Promise<ShoppingListItem[]> {
    return this.apiRequest('/shopping-list');
  }

  async addItemToShoppingList(item: { name: string; quantity: string; notes: string }): Promise<ShoppingListItem> {
    return this.apiRequest('/shopping-list', {
      method: 'POST',
      body: JSON.stringify(item)
    });
  }

  async removeItemFromShoppingList(id: number): Promise<void> {
    return this.apiRequest(`/shopping-list/${id}`, {
      method: 'DELETE'
    });
  }

  async toggleItemPurchased(id: number, isPurchased: boolean): Promise<void> {
    return this.apiRequest(`/shopping-list/${id}/purchased`, {
      method: 'PATCH',
      body: JSON.stringify({ isPurchased })
    });
  }
}

export const apiService = new ApiService();