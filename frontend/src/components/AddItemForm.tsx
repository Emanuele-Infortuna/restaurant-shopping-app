import React, { useState } from 'react';
import { Plus, Loader } from 'lucide-react';
import type{ AvailableItem, NewItemForm } from '../types';

interface AddItemFormProps {
  availableItems: AvailableItem[];
  onAddItem: (item: { name: string; quantity: string; notes: string }) => Promise<void>;
  loading: boolean;
}

export const AddItemForm: React.FC<AddItemFormProps> = ({ availableItems, onAddItem, loading }) => {
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newItem, setNewItem] = useState<NewItemForm>({ name: '', quantity: '', notes: '' });
  const [selectedItem, setSelectedItem] = useState<string>('');

  // Raggruppamento degli articoli per categoria
  const groupedItems = availableItems.reduce((acc, item) => {
    const category = item.category || 'Altri';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, AvailableItem[]>);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const itemName = selectedItem || newItem.name;
    const quantity = newItem.quantity;
    
    if (!itemName.trim() || !quantity.trim()) {
      return;
    }

    try {
      await onAddItem({
        name: itemName,
        quantity: quantity,
        notes: newItem.notes
      });
      
      setNewItem({ name: '', quantity: '', notes: '' });
      setSelectedItem('');
      setShowAddForm(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Error handling is managed by parent component
    }
  };

  const resetForm = () => {
    setShowAddForm(!showAddForm);
    if (!showAddForm) {
      setNewItem({ name: '', quantity: '', notes: '' });
      setSelectedItem('');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-red-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-red-800">Aggiungi Articolo</h2>
        <button
          onClick={resetForm}
          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 active:bg-red-800 transition-all flex items-center space-x-2 disabled:opacity-50"
          disabled={loading}
        >
          <Plus className={`w-4 h-4 transition-transform ${showAddForm ? 'rotate-45' : ''}`} />
          <span>{showAddForm ? 'Annulla' : 'Nuovo Articolo'}</span>
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-red-700 font-medium mb-3">Articolo:</label>
              <select
                value={selectedItem}
                onChange={(e) => {
                  setSelectedItem(e.target.value);
                  if (e.target.value) setNewItem({...newItem, name: ''});
                }}
                className="w-full p-4 h-120 border-2 border-red-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all outline-none mb-3"
                disabled={loading}
              >
                <option value="">-- Seleziona dalla lista --</option>
                {Object.entries(groupedItems).map(([category, items]) => (
                  <optgroup key={category} label={category}>
                    console.log(category)
                    {items.map((item) => (
                      
                      <option key={item.id} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <div>
                <label className="text-center block text-red-700/50 font-medium mb-3">oppure</label>
              </div>
              <input
                type="text"
                placeholder="Oppure inserisci nuovo articolo"
                value={newItem.name}
                onChange={(e) => {
                  setNewItem({...newItem, name: e.target.value});
                  if (e.target.value) setSelectedItem('');
                }}
                className="w-full p-4 border-2 border-red-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all outline-none"
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="block text-red-700 font-medium mb-3">Quantità:</label>
              <input
                type="text"
                placeholder="es. 2 kg, 500g, 10 pezzi"
                value={newItem.quantity}
                onChange={(e) => setNewItem({...newItem, quantity: e.target.value})}
                className="w-full p-4 border-2 border-red-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all outline-none"
                disabled={loading}
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-red-700 font-medium mb-3">Note (opzionale):</label>
            <input
              type="text"
              placeholder="Note aggiuntive..."
              value={newItem.notes}
              onChange={(e) => setNewItem({...newItem, notes: e.target.value})}
              className="w-full p-4 border-2 border-red-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all outline-none"
              disabled={loading}
            />
          </div>
          
          
          <button
            type="submit"
            disabled={loading}
            className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 active:bg-red-800 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Aggiunta in corso...</span>
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                <span>Aggiungi alla Lista</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};