import React, { useState, useEffect } from 'react';
import { Plus, Trash2, LogOut, User, ShoppingCart, AlertCircle, CheckCircle } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001/api';

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [availableItems, setAvailableItems] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [newItem, setNewItem] = useState({ name: '', quantity: '', notes: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Funzione per fare richieste API con token
  const apiRequest = async (endpoint, options = {}) => {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
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
  };

  // Controllo token all'avvio
  useEffect(() => {
    if (token) {
      verifyToken();
    }
  }, [token]);

  // Carica dati quando l'utente è autenticato
  useEffect(() => {
    if (currentUser) {
      loadAvailableItems();
      loadShoppingList();
    }
  }, [currentUser]);

  const verifyToken = async () => {
    try {
      const data = await apiRequest('/available-items');
      // Se la richiesta va a buon fine, il token è valido
      // Il currentUser dovrebbe essere recuperato dal token
    } catch (error) {
      localStorage.removeItem('token');
      setToken(null);
      setCurrentUser(null);
    }
  };

  const loadAvailableItems = async () => {
    try {
      const data = await apiRequest('/available-items');
      setAvailableItems(data);
    } catch (error) {
      setError('Errore nel caricamento articoli disponibili');
    }
  };

  const loadShoppingList = async () => {
    try {
      const data = await apiRequest('/shopping-list');
      setShoppingList(data);
    } catch (error) {
      setError('Errore nel caricamento lista spesa');
    }
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await apiRequest('/login', {
        method: 'POST',
        body: JSON.stringify(loginForm)
      });

      setToken(data.token);
      setCurrentUser(data.user);
      localStorage.setItem('token', data.token);
      setLoginForm({ username: '', password: '' });
      setSuccess('Login effettuato con successo!');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
    setShowAddForm(false);
    setNewItem({ name: '', quantity: '', notes: '' });
    setSelectedItem('');
    setShoppingList([]);
    setAvailableItems([]);
  };

  const addItemToList = async (e) => {
    if (e) e.preventDefault();
    const itemName = selectedItem || newItem.name;
    const quantity = newItem.quantity;
    
    if (!itemName.trim() || !quantity.trim()) {
      setError('Inserisci nome e quantità');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await apiRequest('/shopping-list', {
        method: 'POST',
        body: JSON.stringify({
          name: itemName,
          quantity: quantity,
          notes: newItem.notes
        })
      });

      setShoppingList([data, ...shoppingList]);
      setNewItem({ name: '', quantity: '', notes: '' });
      setSelectedItem('');
      setShowAddForm(false);
      setSuccess('Articolo aggiunto alla lista!');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (id) => {
    try {
      await apiRequest(`/shopping-list/${id}`, {
        method: 'DELETE'
      });
      setShoppingList(shoppingList.filter(item => item.id !== id));
      setSuccess('Articolo rimosso dalla lista!');
    } catch (error) {
      setError(error.message);
    }
  };

  const togglePurchased = async (id, isPurchased) => {
    try {
      await apiRequest(`/shopping-list/${id}/purchased`, {
        method: 'PATCH',
        body: JSON.stringify({ isPurchased: !isPurchased })
      });
      
      // Ricarica la lista per aggiornare lo stato
      loadShoppingList();
      setSuccess(isPurchased ? 'Articolo rimesso in lista' : 'Articolo marcato come acquistato');
    } catch (error) {
      setError(error.message);
    }
  };

  // Gestione messaggi di successo/errore
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md border-2 border-red-200">
          <div className="text-center mb-6">
            <User className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-800">Lista Spesa Ristorante</h1>
            <p className="text-red-600 mt-2">Accedi al tuo account</p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Username"
                value={loginForm.username}
                onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                className="w-full p-3 border-2 border-red-200 rounded-lg focus:border-red-500 focus:outline-none"
                disabled={loading}
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                className="w-full p-3 border-2 border-red-200 rounded-lg focus:border-red-500 focus:outline-none"
                disabled={loading}
              />
            </div>
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-red-600 text-white p-3 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? 'Accesso in corso...' : 'Accedi'}
            </div>
          
          <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-red-700 font-medium mb-2">Account di prova:</p>
            <p className="text-xs text-red-600">Admin: admin / admin123</p>
            <p className="text-xs text-red-600">Dipendente: mario / mario123</p>
            <p className="text-xs text-red-600">Dipendente: lucia / lucia123</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-red-50">
      {/* Header */}
      <div className="bg-red-600 text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <ShoppingCart className="w-6 h-6" />
            <h1 className="text-xl font-bold">Lista Spesa</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-red-100">
              Ciao, {currentUser.name} 
              {currentUser.role === 'admin' && <span className="text-red-200 text-sm ml-1">(Admin)</span>}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 bg-red-700 px-3 py-1 rounded-lg hover:bg-red-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Esci</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Messaggi di feedback */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center">
            <CheckCircle className="w-4 h-4 mr-2" />
            {success}
          </div>
        )}

        {/* Add Item Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-2 border-red-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-red-800">Aggiungi Articolo</h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
              disabled={loading}
            >
              <Plus className="w-4 h-4" />
              <span>{showAddForm ? 'Annulla' : 'Nuovo Articolo'}</span>
            </button>
          </div>

          {showAddForm && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-red-700 font-medium mb-2">Seleziona o inserisci articolo:</label>
                  <select
                    value={selectedItem}
                    onChange={(e) => {
                      setSelectedItem(e.target.value);
                      if (e.target.value) setNewItem({...newItem, name: ''});
                    }}
                    className="w-full p-3 border-2 border-red-200 rounded-lg focus:border-red-500 focus:outline-none"
                    disabled={loading}
                  >
                    <option value="">-- Seleziona dalla lista --</option>
                    {availableItems.map((item) => (
                      <option key={item.id} value={item.name}>{item.name}</option>
                    ))}
                  </select>
                  
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="Oppure inserisci nuovo articolo"
                      value={newItem.name}
                      onChange={(e) => {
                        setNewItem({...newItem, name: e.target.value});
                        if (e.target.value) setSelectedItem('');
                      }}
                      className="w-full p-3 border-2 border-red-200 rounded-lg focus:border-red-500 focus:outline-none"
                      disabled={loading}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-red-700 font-medium mb-2">Quantità:</label>
                  <input
                    type="text"
                    placeholder="es. 2 kg, 500g, 10 pezzi"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({...newItem, quantity: e.target.value})}
                    className="w-full p-3 border-2 border-red-200 rounded-lg focus:border-red-500 focus:outline-none"
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-red-700 font-medium mb-2">Note (opzionale):</label>
                <input
                  type="text"
                  placeholder="Note aggiuntive..."
                  value={newItem.notes}
                  onChange={(e) => setNewItem({...newItem, notes: e.target.value})}
                  className="w-full p-3 border-2 border-red-200 rounded-lg focus:border-red-500 focus:outline-none"
                  disabled={loading}
                />
              </div>
              
              <button
                onClick={addItemToList}
                disabled={loading}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
              >
                {loading ? 'Aggiunta in corso...' : 'Aggiungi alla Lista'}
              </button>
            </div>
          )}
        </div>

        {/* Shopping List */}
        <div className="bg-white rounded-lg shadow-lg border-2 border-red-200">
          <div className="p-6 border-b border-red-200">
            <h2 className="text-xl font-bold text-red-800">Lista della Spesa ({shoppingList.length} articoli)</h2>
          </div>
          
          <div className="p-6">
            {shoppingList.length === 0 ? (
              <div className="text-center py-8 text-red-500">
                <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nessun articolo nella lista</p>
              </div>
            ) : (
              <div className="space-y-3">
                {shoppingList.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                      item.isPurchased 
                        ? 'bg-green-50 border-green-200 opacity-60' 
                        : 'bg-red-50 border-red-200 hover:bg-red-100'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className={`font-bold ${item.isPurchased ? 'text-green-800 line-through' : 'text-red-800'}`}>
                            {item.name}
                          </h3>
                          <p className={`${item.isPurchased ? 'text-green-600' : 'text-red-600'}`}>
                            Quantità: {item.quantity}
                          </p>
                          {item.notes && (
                            <p className={`text-sm ${item.isPurchased ? 'text-green-500' : 'text-red-500'}`}>
                              Note: {item.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className={`mt-2 text-sm ${item.isPurchased ? 'text-green-500' : 'text-red-500'}`}>
                        Aggiunto da {item.addedBy} il {item.timestamp}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => togglePurchased(item.id, item.isPurchased)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          item.isPurchased
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                        title={item.isPurchased ? 'Segna come non acquistato' : 'Segna come acquistato'}
                      >
                        {item.isPurchased ? 'Acquistato' : 'Da comprare'}
                      </button>
                      
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-200 p-2 rounded-lg transition-colors"
                        title="Rimuovi articolo"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;