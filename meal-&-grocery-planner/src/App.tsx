/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Calendar, ShoppingCart, Utensils, Settings } from 'lucide-react';
import { AppProvider, useAppContext } from './context/AppContext';
import { MenuTab } from './components/MenuTab';
import { GroceryTab } from './components/GroceryTab';
import { DishesTab } from './components/DishesTab';
import { SettingsTab } from './components/SettingsTab';

function AppContent() {
  const [activeTab, setActiveTab] = useState<'menu' | 'grocery' | 'dishes' | 'settings'>('menu');
  const { settings, loading, error } = useAppContext();

  if (!settings.sheetUrl && activeTab !== 'settings') {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm text-center max-w-md w-full">
          <Utensils className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-stone-800 mb-2">Bienvenue !</h1>
          <p className="text-stone-600 mb-6">
            Pour commencer, veuillez configurer le lien vers votre fichier Google Sheet contenant la liste des plats.
          </p>
          <button
            onClick={() => setActiveTab('settings')}
            className="w-full bg-emerald-500 text-white py-3 rounded-xl font-medium hover:bg-emerald-600 transition-colors"
          >
            Configurer l'application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-stone-50 flex flex-col max-w-md mx-auto relative shadow-xl overflow-hidden">
      {/* Header */}
      <header className="bg-white px-4 py-4 shadow-sm z-10 flex justify-between items-center shrink-0">
        <h1 className="text-xl font-semibold text-stone-800">
          {activeTab === 'menu' && 'Menu de la semaine'}
          {activeTab === 'grocery' && 'Liste de courses'}
          {activeTab === 'dishes' && 'Liste des plats'}
          {activeTab === 'settings' && 'Paramètres'}
        </h1>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`p-2 rounded-full transition-colors ${activeTab === 'settings' ? 'bg-stone-100 text-emerald-600' : 'text-stone-500 hover:bg-stone-100'}`}
        >
          <Settings className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {loading && activeTab !== 'settings' ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        ) : error && activeTab !== 'settings' ? (
          <div className="p-4 text-center text-red-500 bg-red-50 m-4 rounded-xl">
            {error}
          </div>
        ) : (
          <>
            {activeTab === 'menu' && <MenuTab />}
            {activeTab === 'grocery' && <GroceryTab />}
            {activeTab === 'dishes' && <DishesTab />}
            {activeTab === 'settings' && <SettingsTab />}
          </>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-stone-200 w-full z-10 pb-safe shrink-0">
        <div className="flex justify-around items-center h-16">
          <button
            onClick={() => setActiveTab('menu')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
              activeTab === 'menu' ? 'text-emerald-600' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            <Calendar className="w-6 h-6" />
            <span className="text-[10px] font-medium">Menu</span>
          </button>
          <button
            onClick={() => setActiveTab('grocery')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
              activeTab === 'grocery' ? 'text-emerald-600' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="text-[10px] font-medium">Courses</span>
          </button>
          <button
            onClick={() => setActiveTab('dishes')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
              activeTab === 'dishes' ? 'text-emerald-600' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            <Utensils className="w-6 h-6" />
            <span className="text-[10px] font-medium">Plats</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-stone-200">
        <AppContent />
      </div>
    </AppProvider>
  );
}
