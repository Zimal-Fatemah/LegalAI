import { Sun, Globe, FileText, Shield } from 'lucide-react';

function Spectre({ darkMode }) {
  return (
    <>
      {/* Right-side gradients */}
      <div
        style={{
          position: 'absolute',
          top: '0.5px',
          bottom: '-1.5px',
          right: 0,
          width: '756px',
          opacity: darkMode ? 0.62 : 0.8,
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        {/* warm amber blob */}
        <div
          style={{
            position: 'absolute',
            top: '280px',
            left: '18px',
            width: '650px',
            height: '327px',
            borderRadius: '50%',
            background: darkMode
              ? 'radial-gradient(ellipse, rgba(212, 168, 90, 0.24) 0%, transparent 70%)'
              : 'radial-gradient(ellipse, rgba(222, 181, 105, 0.45) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        {/* teal/sage blob */}
        <div
          style={{
            position: 'absolute',
            top: '465px',
            left: '-2px',
            width: '671px',
            height: '522px',
            borderRadius: '50%',
            background: darkMode
              ? 'radial-gradient(ellipse, rgba(43, 160, 132, 0.18) 0%, transparent 70%)'
              : 'radial-gradient(ellipse, rgba(161,197,193,0.35) 0%, transparent 70%)',
            filter: 'blur(50px)',
            transform: 'rotate(-15deg)',
          }}
        />
      </div>

      {/* Left-side gradients */}
      <div
        style={{
          position: 'absolute',
          top: '0.5px',
          bottom: '-1.5px',
          left: 0,
          width: '756px',
          opacity: darkMode ? 0.5 : 0.6,
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        {/* warm amber blob - left upper */}
        <div
          style={{
            position: 'absolute',
            top: '120px',
            right: '18px',
            width: '600px',
            height: '300px',
            borderRadius: '50%',
            background: darkMode
              ? 'radial-gradient(ellipse, rgba(212, 168, 90, 0.2) 0%, transparent 70%)'
              : 'radial-gradient(ellipse, rgba(222, 181, 105, 0.4) 0%, transparent 70%)',
            filter: 'blur(45px)',
          }}
        />
        {/* teal/sage blob - left */}
        <div
          style={{
            position: 'absolute',
            top: '200px',
            right: '-20px',
            width: '650px',
            height: '480px',
            borderRadius: '50%',
            background: darkMode
              ? 'radial-gradient(ellipse, rgba(43, 160, 132, 0.14) 0%, transparent 70%)'
              : 'radial-gradient(ellipse, rgba(161,197,193,0.3) 0%, transparent 70%)',
            filter: 'blur(55px)',
            transform: 'rotate(15deg)',
          }}
        />
      </div>
    </>
  );
}

export default function SettingsScreen({ settings, onSettingChange }) {
  const isDark = settings.darkMode;
  const settingsOptions = [
    { id: 'darkMode', label: 'Dark Mode', icon: Sun, description: 'Toggle between light and dark theme' },
    { id: 'showSources', label: 'Show Sources', icon: FileText, description: 'Display citations in responses', default: true },
    { id: 'onlineResearch', label: 'Online Research', icon: Globe, description: 'Search recent case law online', default: false },
  ];

  const handleToggle = (id) => {
    onSettingChange(id, !settings[id]);
  };

  return (
    <div className={`flex-1 flex flex-col h-full ${isDark ? 'dark bg-neutral-900' : 'bg-white'} overflow-y-auto relative`}>
      <Spectre darkMode={isDark} />
      {/* Header */}
      <div className={`border-b ${isDark ? 'dark border-neutral-700 bg-neutral-800/85' : 'border-neutral-200 bg-white/85'} px-8 py-6 relative z-10`}>
        <h1 className={`font-display font-bold text-3xl ${isDark ? 'dark text-neutral-100' : 'text-neutral-900'}`}>Settings</h1>
        <p className={`text-base ${isDark ? 'dark text-neutral-400' : 'text-neutral-600'} mt-2`}>Manage your LexAI preferences and privacy</p>
      </div>

      <div className="max-w-3xl mx-auto w-full px-8 py-8 flex-1 relative z-10">
        <div className="space-y-4">
          {settingsOptions.map((option) => (
            <div key={option.id} className={`${isDark ? 'dark bg-neutral-800 border-neutral-700' : 'bg-neutral-50 border-neutral-200'} rounded-lg border p-5 hover:border-neutral-300 transition-colors`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-10 h-10 rounded-lg ${isDark ? 'dark bg-neutral-700' : 'bg-primary-100'} flex items-center justify-center flex-shrink-0`}>
                    <option.icon size={18} className={isDark ? 'dark text-neutral-400' : 'text-primary-600'} />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${isDark ? 'dark text-neutral-100' : 'text-neutral-900'} text-sm`}>{option.label}</h3>
                    <p className={`text-xs ${isDark ? 'dark text-neutral-400' : 'text-neutral-600'} mt-0.5`}>{option.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle(option.id)}
                  className={`w-11 h-6 rounded-full transition-all flex-shrink-0 flex items-center ${
                    settings[option.id] ? 'bg-primary-500' : isDark ? 'dark bg-neutral-600' : 'bg-neutral-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-all ${
                      settings[option.id] ? 'ml-auto mr-0.5' : 'ml-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Privacy Section */}
        <div className={`mt-8 rounded-lg border p-6 ${isDark ? 'dark bg-neutral-800 border-neutral-700' : 'bg-primary-50 border-primary-200'}`}>
          <div className="flex items-center gap-3 mb-3">
            <Shield size={18} className={isDark ? 'dark text-neutral-300' : 'text-primary-700'} />
            <h3 className={`font-semibold ${isDark ? 'dark text-neutral-100' : 'text-primary-900'}`}>Privacy & Data Security</h3>
          </div>
          <p className={`text-sm ${isDark ? 'dark text-neutral-300' : 'text-primary-800'} mb-4`}>
            Your documents are processed locally on your device. No data is stored on remote servers or shared with third parties.
          </p>
          <button className={`text-sm px-3 py-2 rounded transition-colors font-medium ${
            isDark ? 'dark text-red-400 hover:bg-neutral-700' : 'text-red-600 hover:text-red-700 hover:bg-red-50'
          }`}>
            Clear All Data
          </button>
        </div>
        
        {/* Version & Support */}
        <div className="mt-8 space-y-4">
          <div className="text-center">
            <p className={`text-xs ${isDark ? 'dark text-neutral-400' : 'text-neutral-600'}`}>
              LexAI v1.0.0 — Powered by Groq Llama 3.3 70B
            </p>
            <p className={`text-xs ${isDark ? 'dark text-neutral-500' : 'text-neutral-500'} mt-2`}>
              For legal assistance or support, contact our team
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}