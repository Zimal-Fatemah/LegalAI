import { useState } from 'react';
import { ChevronDown, BookOpen, Scale, Users } from 'lucide-react';

const MODES = [
  { id: 'Student Mode', label: 'Student Mode', icon: BookOpen, description: 'For law students' },
  { id: 'Lawyer Mode', label: 'Lawyer Mode', icon: Scale, description: 'For legal professionals' },
  { id: 'Citizen Mode', label: 'Citizen Mode', icon: Users, description: 'For general users' },
];

export default function ModeSelector({ mode, onModeChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const currentMode = MODES.find(m => m.id === mode);
  const CurrentIcon = currentMode?.icon || BookOpen;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white hover:bg-neutral-50 border border-neutral-200 transition-colors text-sm font-semibold text-neutral-900"
      >
        <CurrentIcon size={16} />
        {currentMode?.label.split(' ')[0]}
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Dropdown Menu */}
          <div className="absolute bottom-full mb-2 left-0 w-56 bg-white rounded-lg border border-neutral-200 shadow-lg z-50">
            <div className="p-2">
              {MODES.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      onModeChange(m.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-start gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                      mode === m.id
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <Icon size={18} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">{m.label}</div>
                      <div className="text-xs text-neutral-600">{m.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
