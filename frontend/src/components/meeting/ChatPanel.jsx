import { useState, useRef, useEffect } from 'react';
import { Send, X, MessageSquare, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const ChatPanel = ({ isOpen, onClose, messages = [], onSendMessage, currentUserId }) => {
  const { theme, toggleTheme } = useTheme();
  const [text, setText] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text);
    setText('');
  };

  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="w-80 md:w-96 h-full flex flex-col bg-surface-50 dark:bg-surface-900 border-l border-border-color z-20 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-color bg-surface-50 dark:bg-surface-900">
        <div className="flex items-center gap-2">
          <MessageSquare size={18} className="text-text-primary" />
          <h3 className="text-sm font-semibold text-text-primary">Meeting Chat</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-100 dark:hover:bg-surface-800 transition"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-100 dark:hover:bg-surface-800 transition"
            aria-label="Close chat"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-surface-100/30 dark:bg-surface-950/40">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <MessageSquare size={32} className="text-text-tertiary mb-2" />
            <p className="text-xs font-medium text-text-secondary">No messages yet</p>
            <p className="text-[11px] text-text-tertiary mt-1">
              Messages are visible to participants in this meeting and disappear when it ends.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender?._id === currentUserId;
            return (
              <div
                key={msg.id || Math.random()}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 text-[11px] text-text-tertiary mb-1 px-1">
                  <span className="font-medium text-text-secondary">
                    {isMe ? 'You' : msg.sender?.name}
                  </span>
                  <span>•</span>
                  <span>{formatTime(msg.timestamp)}</span>
                </div>
                <div
                  className={`p-2.5 rounded-xl text-xs max-w-[85%] break-words border ${
                    isMe
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white rounded-tr-xs shadow-xs'
                      : 'bg-white text-neutral-900 dark:bg-surface-800 dark:text-neutral-100 border-border-color rounded-tl-xs shadow-xs'
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Field */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-border-color bg-surface-50 dark:bg-surface-900">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="input-field text-xs py-2 bg-white dark:bg-surface-800 text-neutral-900 dark:text-neutral-100 border border-border-color placeholder:text-neutral-500 dark:placeholder:text-neutral-400"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="p-2 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-900 rounded-lg disabled:opacity-40 transition"
            aria-label="Send message"
          >
            <Send size={15} />
          </button>
        </div>
      </form>
    </div>
  );
};
