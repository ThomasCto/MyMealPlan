import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import Papa from 'papaparse';

interface Dish {
  id: string;
  name: string;
  category: string; // "3/4 repas", "2 repas", "Repas du soir"
  price?: string;
  ingredients: string[];
}

interface MenuItem {
  date: string;
  type: 'midi' | 'soir';
  dishId: string;
  dishName: string;
}

interface GroceryItem {
  id: string;
  name: string;
  checked: boolean;
  alreadyHave: boolean;
}

interface AppContextType {
  dishes: Dish[];
  menu: MenuItem[];
  groceryList: GroceryItem[];
  otherItems: string[];
  settings: { sheetUrl?: string };
  updateSettings: (key: string, value: string) => Promise<void>;
  updateMenu: (date: string, type: 'midi' | 'soir', dishId: string, dishName: string, ingredients: string[]) => Promise<void>;
  removeMenu: (date: string, type: 'midi' | 'soir') => Promise<void>;
  updateGroceryItem: (id: string, updates: Partial<GroceryItem>) => Promise<void>;
  removeGroceryItem: (id: string) => Promise<void>;
  clearGroceryList: () => Promise<void>;
  addGroceryItems: (items: string[]) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [groceryList, setGroceryList] = useState<GroceryItem[]>([]);
  const [otherItems, setOtherItems] = useState<string[]>([]);
  const [settings, setSettings] = useState<{ sheetUrl?: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('menu_updated', fetchMenu);
    newSocket.on('grocery_updated', fetchGrocery);
    newSocket.on('settings_updated', fetchSettings);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings(data);
      if (data.sheetUrl) {
        fetchDishes(data.sheetUrl);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error('Failed to fetch settings', err);
      setLoading(false);
    }
  };

  const fetchMenu = async () => {
    try {
      const res = await fetch('/api/menu');
      const data = await res.json();
      setMenu(data);
    } catch (err) {
      console.error('Failed to fetch menu', err);
    }
  };

  const fetchGrocery = async () => {
    try {
      const res = await fetch('/api/grocery');
      const data = await res.json();
      setGroceryList(data.map((item: any) => ({
        ...item,
        checked: !!item.checked,
        alreadyHave: !!item.alreadyHave
      })));
    } catch (err) {
      console.error('Failed to fetch grocery list', err);
    }
  };

  const fetchDishes = async (url: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Ensure the URL is a CSV export URL if it's a Google Sheet URL
      let csvUrl = url;
      if (url.includes('docs.google.com/spreadsheets') && !url.includes('export?format=csv')) {
        // Try to convert to export URL
        const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (match) {
          csvUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
        }
      }

      const response = await fetch(csvUrl);
      if (!response.ok) throw new Error('Failed to fetch CSV');
      const csvText = await response.text();
      
      Papa.parse(csvText, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          let rows = results.data as string[][];
          
          // Skip header row if present
          if (rows.length > 0) {
            const firstCell = (rows[0][0] || '').toLowerCase().trim();
            if (firstCell === 'plat' || firstCell === 'nom' || firstCell === 'name') {
              rows = rows.slice(1);
            }
          }

          const otherItemsSet = new Set<string>();

          const parsedDishes: Dish[] = rows
            .filter(row => row && row.length > 0 && row[0] && row[0].trim() !== '')
            .map((row, index) => {
              const name = row[0].trim();
              const category = row[1] ? row[1].trim() : 'Repas du soir';
              const price = row[2] ? row[2].trim() : undefined;
              
              // Ingredients are from column D (index 3) to column N (index 13)
              let ingredients: string[] = [];
              const rawIngredients = row.slice(3, 14).map(i => i ? i.trim() : '').filter(i => i !== '');
              
              // If there's only 1 ingredient column but it contains commas, split it
              if (rawIngredients.length === 1 && rawIngredients[0].includes(',')) {
                ingredients = rawIngredients[0].split(',').map(i => i.trim()).filter(i => i !== '');
              } else {
                ingredients = rawIngredients;
              }

              // Extract other items from column O (index 14)
              if (row[14] && row[14].trim() !== '') {
                const items = row[14].split(',').map(i => i.trim()).filter(i => i !== '');
                items.forEach(i => {
                  if (i.toLowerCase() !== 'autres achats') {
                    otherItemsSet.add(i);
                  }
                });
              }

              return {
                id: `dish-${index}`,
                name,
                category,
                price,
                ingredients
              };
            });
          
          setDishes(parsedDishes);
          setOtherItems(Array.from(otherItemsSet).sort((a, b) => a.localeCompare(b)));
          setLoading(false);
        },
        error: (error: any) => {
          console.error('CSV Parse Error', error);
          setError('Erreur lors de la lecture du fichier CSV. Vérifiez que le lien est correct et public.');
          setLoading(false);
        }
      });
    } catch (err) {
      console.error('Failed to fetch dishes', err);
      setError('Impossible de charger les plats. Vérifiez le lien Google Sheet.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchMenu();
    fetchGrocery();
  }, []);

  const updateSettings = async (key: string, value: string) => {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value })
    });
    setSettings(prev => ({ ...prev, [key]: value }));
    if (key === 'sheetUrl') {
      fetchDishes(value);
    }
  };

  const updateMenu = async (date: string, type: 'midi' | 'soir', dishId: string, dishName: string, ingredients: string[]) => {
    await fetch('/api/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, type, dishId, dishName, ingredients })
    });
    await fetchMenu();
    await fetchGrocery();
  };

  const removeMenu = async (date: string, type: 'midi' | 'soir') => {
    await fetch('/api/menu', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, type })
    });
    await fetchMenu();
  };

  const updateGroceryItem = async (id: string, updates: Partial<GroceryItem>) => {
    await fetch('/api/grocery', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates })
    });
    await fetchGrocery();
  };

  const removeGroceryItem = async (id: string) => {
    await fetch('/api/grocery', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    await fetchGrocery();
  };

  const clearGroceryList = async () => {
    await fetch('/api/grocery/clear', {
      method: 'POST'
    });
    await fetchGrocery();
  };

  const addGroceryItems = async (items: string[]) => {
    await fetch('/api/grocery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    });
    await fetchGrocery();
  };

  return (
    <AppContext.Provider value={{
      dishes, menu, groceryList, otherItems, settings, updateSettings,
      updateMenu, removeMenu, updateGroceryItem, removeGroceryItem, clearGroceryList, addGroceryItems,
      loading, error
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
