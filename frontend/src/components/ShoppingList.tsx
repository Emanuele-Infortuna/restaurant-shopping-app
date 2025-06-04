import React from 'react';
import { Trash2, ShoppingCart } from 'lucide-react';
import type { ShoppingListItem } from '../types';

interface ShoppingListProps {
  shoppingList: ShoppingListItem[];
  onRemoveItem: (id: number, name: string) => Promise<void>;
  onTogglePurchased: (id: number, isPurchased: boolean) => Promise<void>;
}

export const ShoppingList: React.FC<ShoppingListProps> = ({
  shoppingList,
  onRemoveItem,
  onTogglePurchased
}) => {
  // Filtraggio lista spesa
  const notPurchasedItems = shoppingList.filter(item => !item.isPurchased);
  const purchasedItems = shoppingList.filter(item => item.isPurchased);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-red-100">
      <div className="p-6 border-b border-red-100">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-red-800">Lista della Spesa</h2>
          <div className="flex space-x-4 text-sm">
            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full font-medium">
              Da comprare: {notPurchasedItems.length}
            </span>
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
              Acquistati: {purchasedItems.length}
            </span>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {shoppingList.length === 0 ? (
          <div className="text-center py-12 text-red-400">
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Nessun articolo nella lista</p>
            <p className="text-sm mt-2">Aggiungi il primo articolo per iniziare</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Articoli da comprare */}
            {notPurchasedItems.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-red-700 mb-4">Da comprare</h3>
                <div className="space-y-3">
                  {notPurchasedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-red-800 text-lg">{item.name}</h4>
                            <p className="text-red-600 font-medium">Quantità: {item.quantity}</p>
                            {item.notes && (
                              <p className="text-red-500 text-sm mt-1">Note: {item.notes}</p>
                            )}
                            <p className="text-red-400 text-sm mt-2">
                              Aggiunto da {item.addedBy} • {item.timestamp}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => onTogglePurchased(item.id, item.isPurchased)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 active:bg-green-800 transition-all text-sm font-medium"
                          title="Segna come acquistato"
                        >
                          Acquistato
                        </button>
                        
                        <button
                          onClick={() => onRemoveItem(item.id, item.name)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-200 p-2 rounded-lg transition-all"
                          title="Rimuovi articolo"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Articoli acquistati */}
            {purchasedItems.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-bold text-green-700 mb-4">Acquistati</h3>
                <div className="space-y-3">
                  {purchasedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg opacity-75"
                    >
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-green-800 text-lg line-through">{item.name}</h4>
                            <p className="text-green-600 font-medium line-through">Quantità: {item.quantity}</p>
                            {item.notes && (
                              <p className="text-green-500 text-sm mt-1 line-through">Note: {item.notes}</p>
                            )}
                            <p className="text-green-400 text-sm mt-2">
                              Aggiunto da {item.addedBy} • {item.timestamp}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => onTogglePurchased(item.id, item.isPurchased)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-all text-sm font-medium"
                          title="Rimetti in lista"
                        >
                          Rimetti
                        </button>
                        
                        <button
                          onClick={() => onRemoveItem(item.id, item.name)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-200 p-2 rounded-lg transition-all"
                          title="Rimuovi articolo"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};