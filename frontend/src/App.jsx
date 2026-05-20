import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatScreen from './screens/ChatScreen';
import UploadScreen from './screens/UploadScreen';
import SettingsScreen from './screens/SettingsScreen';
import QuizScreen from './screens/QuizScreen';

const RECENT_CHATS_KEY = 'lexai_recent_chats';

function getInitialRecentChats() {
  try {
    const raw = localStorage.getItem(RECENT_CHATS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function App() {
  const [currentScreen, setCurrentScreen] = useState('chat');
  const [mode, setMode] = useState('Student Mode');
  const [messages, setMessages] = useState([]);
  const [recentChats, setRecentChats] = useState(getInitialRecentChats);
  const [settings, setSettings] = useState({
    darkMode: false,
    showSources: true,
    onlineResearch: false,
  });

  useEffect(() => {
    localStorage.setItem(RECENT_CHATS_KEY, JSON.stringify(recentChats));
  }, [recentChats]);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentScreen('chat');
  };

  const handleUploadComplete = () => {
    // Optional: Show notification or refresh something
  };

  const handleUserMessage = (content) => {
    const title = content.replace(/\s+/g, ' ').trim().slice(0, 60);
    if (!title) return;

    setRecentChats((prev) => [title, ...prev.filter((chat) => chat !== title)].slice(0, 20));
  };

  const handleRecentChatClick = () => {
    setCurrentScreen('chat');
  };

  return (
    <div className={`flex h-screen w-screen overflow-hidden ${settings.darkMode ? 'dark bg-neutral-900' : 'bg-discourse-bg'}`}>
      <Sidebar
        currentScreen={currentScreen}
        onScreenChange={setCurrentScreen}
        recentChats={recentChats}
        onRecentChatClick={handleRecentChatClick}
        onNewChat={handleNewChat}
        darkMode={settings.darkMode}
      />
      
      {currentScreen === 'chat' && (
        <ChatScreen
          mode={mode}
          onModeChange={setMode}
          messages={messages}
          setMessages={setMessages}
          darkMode={settings.darkMode}
          onOpenQuiz={() => setCurrentScreen('quiz')}
          onUserMessage={handleUserMessage}
        />
      )}

      {currentScreen === 'quiz' && (
        <QuizScreen
          darkMode={settings.darkMode}
          mode={mode}
          onBackToChat={() => setCurrentScreen('chat')}
        />
      )}
      
      {currentScreen === 'upload' && (
        <UploadScreen onUploadComplete={handleUploadComplete} darkMode={settings.darkMode} />
      )}
      
      {currentScreen === 'settings' && (
        <SettingsScreen
          settings={settings}
          onSettingChange={handleSettingChange}
        />
      )}
    </div>
  );
}

export default App;