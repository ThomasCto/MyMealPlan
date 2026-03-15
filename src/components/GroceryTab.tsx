import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Check, Trash2, Search, ShoppingCart, Plus, X } from 'lucide-react';

export function GroceryTab() {
  const { groceryList, otherItems, updateGroceryItem, removeGroceryItem, clearGroceryList, addGroceryItems } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isOtherItemsModalOpen, setIsOtherItemsModalOpen] = useState(false);
  const [selectedOtherItems, setSelectedOtherItems] = useState<string[]>([]);

  const filteredList = groceryList.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort: 
  // 1. Not checked, not already have
  // 2. Already have (crossed out)
  // 3. Checked (moved to bottom)
  const sortedList = [...filteredList].sort((a, b) => {
    if (a.checked !== b.checked) return a.checked ? 1 : -1;
    if (a.alreadyHave !== b.alreadyHave) return a.alreadyHave ? 1 : -1;
    return a.name.localeCompare(b.name);
  });

  const handleToggleAlreadyHave = async (id: string, current: boolean) => {
    await updateGroceryItem(id, { alreadyHave: !current });
  };

  const handleToggleChecked = async (id: string, current: boolean) => {
    await updateGroceryItem(id, { checked: !current });
  };

  const handleRemove = async (id: string) => {
    await removeGroceryItem(id);
  };

  const handleToggleOtherItem = (item: string) => {
    setSelectedOtherItems(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const handleAddSelectedOtherItems = async () => {
    if (selectedOtherItems.length > 0) {
      await addGroceryItems(selectedOtherItems);
      setSelectedOtherItems([]);
      setIsOtherItemsModalOpen(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-stone-50">
      <div className="p-4 bg-white border-b border-stone-200 sticky top-0 z-10 space-y-3">
        <div className="flex justify-between items-center">
          <button
            onClick={() => setIsOtherItemsModalOpen(true)}
            className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Autres achats
          </button>
          
          {groceryList.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Voulez-vous vraiment vider toute la liste de courses ?')) {
                  clearGroceryList();
                }
              }}
              className="text-red-500 hover:text-red-600 text-sm font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Vider
            </button>
          )}
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher un ingrédient..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-stone-100 border-transparent rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
          />
        </div>
        
        {groceryList.length > 0 && (
          <div className="flex items-center justify-between px-1 pt-1 text-[11px] font-medium text-stone-500 uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded border border-stone-300 flex items-center justify-center bg-stone-200 text-stone-500">
                <Check className="w-3 h-3" />
              </div>
              <span>En stock</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>Suivi courses</span>
              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                <Check className="w-3 h-3" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 space-y-2 pb-4">
        {sortedList.length === 0 ? (
          <div className="text-center text-stone-500 py-12 flex flex-col items-center">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4">
              <ShoppingCart className="w-8 h-8 text-stone-300" />
            </div>
            <p className="font-medium text-stone-600">Votre liste est vide</p>
            <p className="text-sm mt-1 max-w-[250px]">
              Ajoutez des plats dans le menu de la semaine pour remplir votre liste de courses.
            </p>
          </div>
        ) : (
          sortedList.map(item => (
            <div 
              key={item.id} 
              className={`flex items-center justify-between p-3.5 bg-white rounded-xl shadow-sm border transition-all ${
                item.checked ? 'border-emerald-100 bg-emerald-50/30' : 
                item.alreadyHave ? 'border-stone-100 bg-stone-50/50' : 'border-stone-200'
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                {/* Checkbox "J'ai déjà" (Left) */}
                <button
                  onClick={() => handleToggleAlreadyHave(item.id, item.alreadyHave)}
                  className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${
                    item.alreadyHave 
                      ? 'bg-stone-200 border-stone-300 text-stone-500' 
                      : 'border-stone-300 hover:border-stone-400'
                  }`}
                  title="En stock"
                >
                  {item.alreadyHave && <Check className="w-4 h-4" />}
                </button>
                
                <span className={`flex-1 font-medium transition-all ${
                  item.checked ? 'text-emerald-700 line-through opacity-70' :
                  item.alreadyHave ? 'text-stone-400 line-through' : 'text-stone-800'
                }`}>
                  {item.name}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Remove button */}
                <button
                  onClick={() => handleRemove(item.id)}
                  className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  title="Enlever de la liste"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Checkbox "Acheté" (Right) */}
                <button
                  onClick={() => handleToggleChecked(item.id, item.checked)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm ${
                    item.checked 
                      ? 'bg-emerald-500 text-white shadow-emerald-200' 
                      : 'bg-white border-2 border-stone-200 text-transparent hover:border-emerald-400'
                  }`}
                  title="Suivi courses"
                >
                  <Check className={`w-5 h-5 ${item.checked ? 'opacity-100' : 'opacity-0'}`} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isOtherItemsModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-stone-50">
          <div className="p-4 bg-white border-b border-stone-200 shrink-0 flex items-center gap-3">
            <button onClick={() => setIsOtherItemsModalOpen(false)} className="p-2 -ml-2 text-stone-500 hover:bg-stone-100 rounded-full">
              <X className="w-6 h-6" />
            </button>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-stone-800">Autres achats</h2>
              <p className="text-sm text-stone-500">Sélectionnez les articles à ajouter</p>
            </div>
            <button
              onClick={handleAddSelectedOtherItems}
              disabled={selectedOtherItems.length === 0}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
                selectedOtherItems.length > 0 
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              Ajouter ({selectedOtherItems.length})
            </button>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto space-y-2">
            {otherItems.length === 0 ? (
              <div className="text-center text-stone-500 py-8">
                Aucun article trouvé dans la colonne O "Autres achats".
              </div>
            ) : (
              otherItems.map(item => (
                <button
                  key={item}
                  onClick={() => handleToggleOtherItem(item)}
                  className={`w-full text-left p-4 rounded-xl shadow-sm border transition-all flex justify-between items-center ${
                    selectedOtherItems.includes(item)
                      ? 'bg-emerald-50 border-emerald-200 ring-1 ring-emerald-500'
                      : 'bg-white border-stone-100 hover:border-emerald-300'
                  }`}
                >
                  <span className={`font-medium ${selectedOtherItems.includes(item) ? 'text-emerald-800' : 'text-stone-800'}`}>
                    {item}
                  </span>
                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                    selectedOtherItems.includes(item)
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-stone-300'
                  }`}>
                    {selectedOtherItems.includes(item) && <Check className="w-4 h-4" />}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
