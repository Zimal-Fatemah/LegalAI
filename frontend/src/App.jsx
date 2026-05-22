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
    if (!Array.isArray(parsed)) return [];
    // Backwards compatibility: convert string entries into objects
    return parsed.map((item) => {
      if (typeof item === 'string') return { title: item, messages: [] };
      return {
        title: item.title || (typeof item === 'string' ? item : 'Untitled'),
        messages: Array.isArray(item.messages) ? item.messages : [],
      };
    });
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

  const handleUserMessage = (messagesArray) => {
    // messagesArray expected to be the full messages array for the chat
    if (!Array.isArray(messagesArray) || messagesArray.length === 0) return;

    const userMsg = messagesArray.find(m => m.isUser) || messagesArray[0];
    let title = (userMsg && userMsg.content) ? userMsg.content : 'Untitled';
    title = title.replace(/\s+/g, ' ').trim().slice(0, 60) || 'Untitled';

    const chatObj = { title, messages: messagesArray };
    setRecentChats((prev) => [chatObj, ...prev.filter((chat) => chat.title !== title)].slice(0, 20));
  };

  const handleRecentChatClick = (chat) => {
    if (!chat) return;
    setMessages(Array.isArray(chat.messages) ? chat.messages : []);
    setCurrentScreen('chat');
  };

  const handleDeleteRecentChat = (title) => {
    setRecentChats(prev => prev.filter(c => c.title !== title));
  };

  return (
    <div className={`flex h-screen w-screen overflow-hidden ${settings.darkMode ? 'dark bg-neutral-900' : 'bg-discourse-bg'}`}>
      <Sidebar
        currentScreen={currentScreen}
        onScreenChange={setCurrentScreen}
        recentChats={recentChats}
        onRecentChatClick={handleRecentChatClick}
        onDeleteRecentChat={handleDeleteRecentChat}
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