import { MessageSquare, Plus, Search, FolderOpen, Settings } from 'lucide-react';

export default function Sidebar({ currentScreen, onScreenChange, recentChats, onRecentChatClick, onNewChat, darkMode }) {
  return (
    <div className={`w-64 flex flex-col h-full overflow-hidden border-r transition-colors duration-200 ${
      darkMode 
        ? 'bg-[#181818] border-[#2a2a2a]' 
        : 'bg-discourse-sidebar border-discourse-border'
    }`}>
      {/* Header - New Chat Button */}
      <div className={`p-4 border-b ${darkMode ? 'border-[#2a2a2a]' : 'border-discourse-border'}`}>
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-discourse-teal hover:bg-discourse-teal/90 text-white rounded-lg font-medium transition-colors text-sm"
        >
          <Plus size={18} />
          New Chat
        </button>
      </div>

      {/* Navigation */}
      <nav className={`px-3 py-4 space-y-1 border-b ${darkMode ? 'border-[#2a2a2a]' : 'border-discourse-border'}`}>
        <button
          onClick={() => onScreenChange('chat')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
            currentScreen === 'chat'
              ? 'bg-discourse-teal text-white'
              : darkMode 
                ? 'text-gray-300 hover:bg-[#252525]' 
                : 'text-discourse-dark hover:bg-discourse-input'
          }`}
        >
          <Search size={16} />
          Search
        </button>

        <button
          onClick={() => onScreenChange('upload')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
            currentScreen === 'upload'
              ? 'bg-discourse-teal text-white'
              : darkMode 
                ? 'text-gray-300 hover:bg-[#252525]' 
                : 'text-discourse-dark hover:bg-discourse-input'
          }`}
        >
          <FolderOpen size={16} />
          Projects
        </button>

        <button
          onClick={() => onScreenChange('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
            currentScreen === 'settings'
              ? 'bg-discourse-teal text-white'
              : darkMode 
                ? 'text-gray-300 hover:bg-[#252525]' 
                : 'text-discourse-dark hover:bg-discourse-input'
          }`}
        >
          <Settings size={16} />
          Settings
        </button>
      </nav>

      {/* Chats Section */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <h3 className={`px-3 text-xs font-semibold uppercase tracking-wide mb-3 ${
          darkMode ? 'text-gray-500' : 'text-discourse-gray'
        }`}>
          Chats
        </h3>
        <div className="space-y-1">
          {recentChats.map((chat, idx) => (
            <button
              key={idx}
              onClick={onRecentChatClick}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm rounded-lg transition-colors group ${
                darkMode 
                  ? 'text-gray-300 hover:bg-[#252525]' 
                  : 'text-discourse-dark hover:bg-discourse-input'
              }`}
            >
              <MessageSquare size={14} className={`flex-shrink-0 ${darkMode ? 'text-gray-500' : 'text-discourse-gray'}`} />
              <span className="truncate flex-1">{chat}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Version Footer */}
      <div className={`px-3 py-4 border-t text-xs text-center ${
        darkMode ? 'border-[#2a2a2a] text-gray-500' : 'border-discourse-border text-discourse-gray'
      }`}>
        v1.0
      </div>
    </div>
  );
}