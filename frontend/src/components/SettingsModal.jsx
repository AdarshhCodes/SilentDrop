import { useState, useEffect } from "react";
import api from "../api";

function SettingsModal({ isOpen, onClose }) {
  const [preferences, setPreferences] = useState({ timezone: 'UTC', coreHoursStart: 9, coreHoursEnd: 17 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.get("/api/user/preferences")
        .then(res => {
          setPreferences(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to load preferences", err);
          setLoading(false);
        });
    }
  }, [isOpen]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/api/user/preferences", preferences);
      onClose(); // close on success
    } catch (err) {
      console.error("Failed to save preferences", err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-bold">Preferences</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
        </div>
        
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="text-center text-gray-500">Loading...</div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Timezone</label>
                <select 
                  className="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={preferences.timezone}
                  onChange={e => setPreferences({...preferences, timezone: e.target.value})}
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="Europe/London">London (GMT/BST)</option>
                  <option value="Europe/Berlin">Central Europe (CET)</option>
                  <option value="Asia/Kolkata">India (IST)</option>
                  <option value="Asia/Tokyo">Japan (JST)</option>
                  <option value="Australia/Sydney">Sydney (AEST)</option>
                  {/* Additional timezones can be added here */}
                </select>
                <p className="text-xs text-gray-500 mt-2">Used to calculate your daily rhythm and weekends accurately.</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Core Working Hours</label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <select 
                      className="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={preferences.coreHoursStart}
                      onChange={e => setPreferences({...preferences, coreHoursStart: parseInt(e.target.value)})}
                    >
                      {[...Array(24)].map((_, i) => (
                        <option key={i} value={i}>{`${i.toString().padStart(2, '0')}:00`}</option>
                      ))}
                    </select>
                  </div>
                  <span className="text-gray-400">to</span>
                  <div className="flex-1">
                    <select 
                      className="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={preferences.coreHoursEnd}
                      onChange={e => setPreferences({...preferences, coreHoursEnd: parseInt(e.target.value)})}
                    >
                      {[...Array(24)].map((_, i) => (
                        <option key={i} value={i}>{`${i.toString().padStart(2, '0')}:00`}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Activity outside these hours is counted towards burnout risk.</p>
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={saving || loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
