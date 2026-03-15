import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Save, Link as LinkIcon, Info, ExternalLink } from 'lucide-react';

export function SettingsTab() {
  const { settings, updateSettings } = useAppContext();
  const [url, setUrl] = useState(settings.sheetUrl || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await updateSettings('sheetUrl', url);
    setSaving(false);
  };

  return (
    <div className="p-4 space-y-6">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100">
        <h2 className="text-lg font-semibold text-stone-800 mb-4 flex items-center gap-2">
          <LinkIcon className="w-5 h-5 text-emerald-500" />
          Lien Google Sheet
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              URL du fichier (CSV ou lien de partage)
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !url.trim()}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white py-2.5 rounded-xl font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Enregistrer
                </>
              )}
            </button>

            <a
              href={url.trim() || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white py-2.5 rounded-xl font-medium hover:bg-emerald-600 transition-colors ${!url.trim() ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
            >
              <ExternalLink className="w-5 h-5" />
              Ouvrir le fichier
            </a>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
        <h3 className="text-blue-800 font-medium mb-2 flex items-center gap-2">
          <Info className="w-5 h-5" />
          Comment configurer le fichier ?
        </h3>
        <ul className="text-sm text-blue-700 space-y-2 list-disc list-inside">
          <li>Le fichier doit être accessible publiquement (Lecture seule).</li>
          <li>Il doit contenir les colonnes : <strong>Plat</strong>, <strong>Catégorie</strong>, <strong>Prix</strong> et <strong>Ingrédients</strong>.</li>
          <li>Les ingrédients peuvent être séparés par des virgules dans la colonne Ingrédients, ou placés dans les colonnes suivantes.</li>
          <li>Catégories recommandées : "3/4 repas", "2 repas", "Repas du soir".</li>
        </ul>
      </div>

      <div className="mt-8 text-center text-xs text-stone-400">
        &copy; {new Date().getFullYear()} thomas_cto
      </div>
    </div>
  );
}
