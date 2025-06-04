/* eslint-disable no-useless-catch */
import { useState, useEffect } from 'react';
import type { AvailableItem, ShoppingListItem } from '../types';
import { apiService } from '../services/api';

export const useShoppingList = (isAuthenticated: boolean) => {
  const [availableItems, setAvailableItems] = useState<AvailableItem[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Carica dati quando l'utente è autenticato
  useEffect(() => {
    if (isAuthenticated) {
      loadAvailableItems();
      loadShoppingList();
    }
  }, [isAuthenticated]);

  const loadAvailableItems = async (): Promise<void> => {
    try {
      const data = await apiService.getAvailableItems();
      setAvailableItems(data);
    } catch (error) {
      throw error;
    }
  };

  const loadShoppingList = async (): Promise<void> => {
    try {
      const data = await apiService.getShoppingList();
      setShoppingList(data);
    } catch (error) {
      throw error;
    }
  };

  const addItemToList = async (item: { name: string; quantity: string; notes: string }): Promise<void> => {
    setLoading(true);
    try {
      const newItem = await apiService.addItemToShoppingList(item);
      setShoppingList([newItem, ...shoppingList]);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (id: number, name: string): Promise<void> => {
    if (!confirm(`Sei sicuro di voler rimuovere "${name}" dalla lista?`)) {
      return;
    }

    try {
      await apiService.removeItemFromShoppingList(id);
      setShoppingList(shoppingList.filter(item => item.id !== id));
    } catch (error) {
      throw error;
    }
  };

  const togglePurchased = async (id: number, isPurchased: boolean): Promise<void> => {
    try {
      await apiService.toggleItemPurchased(id, !isPurchased);
      // Ricarica la lista per aggiornare lo stato
      await loadShoppingList();
    } catch (error) {
      throw error;
    }
  };

  return {
    availableItems,
    shoppingList,
    loading,
    addItemToList,
    removeItem,
    togglePurchased,
    loadShoppingList,
    loadAvailableItems
  };
};