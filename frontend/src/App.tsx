import React from 'react';
import { useAuth } from './hooks/useAuth';
import { useNotifications } from './hooks/useNotifications';
import { useShoppingList } from './hooks/useShoppingList';
import { LoginForm } from './components/LoginForm';
import { Header } from './components/Header';
import { AddItemForm } from './components/AddItemForm';
import { ShoppingList } from './components/ShoppingList';
import { Loading } from './components/Loading';
import { ErrorNotification, SuccessNotification } from './components/Notifications';
import type { LoginForm as LoginFormType } from './types/index';

const App: React.FC = () => {
  const { currentUser, initialLoading, login, logout, isAuthenticated } = useAuth();
  const { error, success, showError, showSuccess } = useNotifications();
  const { 
    availableItems, 
    shoppingList, 
    loading, 
    addItemToList, 
    removeItem, 
    togglePurchased 
  } = useShoppingList(isAuthenticated);

  const handleLogin = async (credentials: LoginFormType): Promise<void> => {
    try {
      await login(credentials);
      showSuccess('Login effettuato con successo!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore di login';
      showError(errorMessage);
    }
  };

  const handleAddItem = async (item: { name: string; quantity: string; notes: string }): Promise<void> => {
    try {
      await addItemToList(item);
      showSuccess('Articolo aggiunto alla lista!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore nell\'aggiunta articolo';
      showError(errorMessage);
    }
  };

  const handleRemoveItem = async (id: number, name: string): Promise<void> => {
    try {
      await removeItem(id, name);
      showSuccess('Articolo rimosso dalla lista!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore nella rimozione';
      showError(errorMessage);
    }
  };

  const handleTogglePurchased = async (id: number, isPurchased: boolean): Promise<void> => {
    try {
      await togglePurchased(id, isPurchased);
      showSuccess(isPurchased ? 'Articolo rimesso in lista' : 'Articolo marcato come acquistato');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore nell\'aggiornamento';
      showError(errorMessage);
    }
  };

  // Loading iniziale
  if (initialLoading) {
    return <Loading />;
  }

  // Se non autenticato, mostra form di login
  if (!currentUser) {
    return (
      <LoginForm
        onLogin={handleLogin}
        loading={loading}
        error={error}
        success={success}
      />
    );
  }

  // App principale
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
      <Header currentUser={currentUser} onLogout={logout} />

      <div className="max-w-6xl mx-auto p-6">
        {/* Messaggi di feedback */}
        {error && <ErrorNotification message={error} />}
        {success && <SuccessNotification message={success} />}

        {/* Sezione aggiunta articoli */}
        <AddItemForm
          availableItems={availableItems}
          onAddItem={handleAddItem}
          loading={loading}
        />

        {/* Lista della spesa */}
        <ShoppingList
          shoppingList={shoppingList}
          onRemoveItem={handleRemoveItem}
          onTogglePurchased={handleTogglePurchased}
        />
      </div>
    </div>
  );
};

export default App;