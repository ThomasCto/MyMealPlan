import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Search, Tag } from 'lucide-react';

export function DishesTab() {
  const { dishes } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(dishes.map(d => d.category))).filter(Boolean);

  const filteredDishes = dishes.filter(dish => {
    const matchesSearch = dish.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          dish.ingredients.some(i => i.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory ? dish.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col min-h-full bg-stone-50">
      <div className="p-4 bg-white border-b border-stone-200 sticky top-0 z-10 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher un plat ou un ingrédient..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-stone-100 border-transparent rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === null 
                ? 'bg-stone-800 text-white' 
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Tous
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {filteredDishes.length === 0 ? (
          <div className="text-center text-stone-500 py-8">
            Aucun plat trouvé.
          </div>
        ) : (
          filteredDishes.map(dish => (
            <div key={dish.id} className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-semibold text-stone-800 text-lg pr-2">{dish.name}</h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-stone-100 text-stone-600 text-xs font-medium shrink-0">
                  <Tag className="w-3 h-3" />
                  {dish.category}
                </span>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">Ingrédients</p>
                  {dish.price && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[11px] font-medium border border-amber-100 shrink-0">
                      {dish.price}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {dish.ingredients.map((ing, idx) => (
                    <span key={idx} className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-sm">
                      {ing}
                    </span>
                  ))}
                  {dish.ingredients.length === 0 && (
                    <span className="text-sm text-stone-400 italic">Aucun ingrédient spécifié</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
