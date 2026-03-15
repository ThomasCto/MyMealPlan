import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronRight, Plus, X, Search } from 'lucide-react';

export function MenuTab() {
  const { menu, dishes, updateMenu, removeMenu } = useAppContext();
  const [selectingFor, setSelectingFor] = useState<{ date: Date, type: 'midi' | 'soir' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(dishes.map(d => d.category))).filter(Boolean);

  // Generate days from Tuesday to next Tuesday
  const today = new Date();
  // Find the most recent Tuesday
  let startDay = startOfWeek(today, { weekStartsOn: 2 }); // 2 is Tuesday
  if (today.getDay() < 2) {
    startDay = addDays(startDay, -7);
  }

  const days = Array.from({ length: 8 }).map((_, i) => addDays(startDay, i));

  const getMeal = (date: Date, type: 'midi' | 'soir') => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return menu.find(m => m.date === dateStr && m.type === type);
  };

  const handleSelectDish = async (dish: any) => {
    if (!selectingFor) return;
    const dateStr = format(selectingFor.date, 'yyyy-MM-dd');
    await updateMenu(dateStr, selectingFor.type, dish.id, dish.name, dish.ingredients);
    setSelectingFor(null);
    setSearchTerm('');
  };

  const handleRemoveMeal = async (date: Date, type: 'midi' | 'soir') => {
    const dateStr = format(date, 'yyyy-MM-dd');
    await removeMenu(dateStr, type);
  };

  if (selectingFor) {
    const filteredDishes = dishes.filter(dish => {
      const matchesSearch = dish.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            dish.ingredients.some(i => i.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory ? dish.category === selectedCategory : true;
      return matchesSearch && matchesCategory;
    });
    
    return (
      <div className="flex flex-col h-full bg-stone-50 absolute inset-0 z-20 overflow-hidden">
        <div className="p-4 bg-white border-b border-stone-200 shrink-0 flex items-center gap-3">
          <button onClick={() => setSelectingFor(null)} className="p-2 -ml-2 text-stone-500 hover:bg-stone-100 rounded-full">
            <X className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-stone-800">
              Sélection du plat
            </h2>
            <p className="text-sm text-stone-500 capitalize">
              {format(selectingFor.date, 'EEEE', { locale: fr })} - {selectingFor.type}
            </p>
          </div>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un plat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
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
          
          <div className="space-y-2 pb-4">
            {filteredDishes.map(dish => (
              <button
                key={dish.id}
                onClick={() => handleSelectDish(dish)}
                className="w-full text-left bg-white p-4 rounded-xl shadow-sm border border-stone-100 hover:border-emerald-500 hover:ring-1 hover:ring-emerald-500 transition-all flex justify-between items-center group"
              >
                <div>
                  <h3 className="font-medium text-stone-800">{dish.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-stone-500">{dish.category}</span>
                    {dish.price && (
                      <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-100 font-medium">
                        {dish.price}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-emerald-500" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-4">
      {days.map((date, index) => {
        const isFirstDay = index === 0;
        const isLastDay = index === days.length - 1;
        
        // Skip midi on first day (starts Tuesday evening)
        // Skip soir on last day (ends Tuesday noon)
        const showMidi = !isFirstDay;
        const showSoir = !isLastDay;
        
        const isToday = isSameDay(date, new Date());

        return (
          <div key={date.toISOString()} className={`bg-white rounded-2xl shadow-sm border ${isToday ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-stone-100'} overflow-hidden`}>
            <div className={`px-4 py-2 ${isToday ? 'bg-emerald-50' : 'bg-stone-50'} border-b border-stone-100`}>
              <h3 className={`font-medium capitalize flex items-center gap-2 ${isToday ? 'text-emerald-800' : 'text-stone-700'}`}>
                {format(date, 'EEEE', { locale: fr })}
                {isToday && <span className="text-[10px] uppercase tracking-wider font-bold bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full">Aujourd'hui</span>}
              </h3>
            </div>
            
            <div className="divide-y divide-stone-100">
              {showMidi && (
                <MealSlot 
                  type="midi" 
                  meal={getMeal(date, 'midi')} 
                  onSelect={() => setSelectingFor({ date, type: 'midi' })}
                  onRemove={() => handleRemoveMeal(date, 'midi')}
                />
              )}
              {showSoir && (
                <MealSlot 
                  type="soir" 
                  meal={getMeal(date, 'soir')} 
                  onSelect={() => setSelectingFor({ date, type: 'soir' })}
                  onRemove={() => handleRemoveMeal(date, 'soir')}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MealSlot({ type, meal, onSelect, onRemove }: { type: 'midi' | 'soir', meal?: any, onSelect: () => void, onRemove: () => void }) {
  return (
    <div className="p-4 flex items-center justify-between group">
      <div className="flex items-center gap-3 flex-1">
        <div className="w-12 text-xs font-medium text-stone-400 uppercase tracking-wider">
          {type}
        </div>
        {meal ? (
          <div className="flex-1">
            <span className="font-medium text-stone-800">{meal.dishName}</span>
          </div>
        ) : (
          <button 
            onClick={onSelect}
            className="flex-1 flex items-center gap-2 text-stone-400 hover:text-emerald-600 transition-colors py-1"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Sélection du plat</span>
          </button>
        )}
      </div>
      
      {meal && (
        <button 
          onClick={onRemove}
          className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
          aria-label="Enlever"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
