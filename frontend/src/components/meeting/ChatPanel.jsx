import { useState, useRef, useEffect } from 'react';
import { Send, X, MessageSquare, Paperclip, FileText, Download } from 'lucide-react';

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const getFileTypeInfo = (file) => {
  if (!file) return { category: 'file', label: 'FILE' };
  const type = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();

  if (type.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(name)) {
    return { category: 'image', label: 'IMG' };
  }
  if (type === 'application/pdf' || name.endsWith('.pdf')) {
    return { category: 'pdf', label: 'PDF' };
  }
  if (
    type.includes('msword') ||
    type.includes('wordprocessingml') ||
    /\.(docx?)$/i.test(name)
  ) {
    return { category: 'word', label: 'DOC' };
  }
  return { category: 'file', label: 'FILE' };
};

export const ChatPanel = ({ isOpen, onClose, messages = [], onSendMessage, currentUserId }) => {
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [isReadingFile, setIsReadingFile] = useState(false);

  const fileInputRef = useRef(null);
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

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Max 10MB limit to keep WebRTC / socket payload responsive
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setFileError('File size exceeds the 10 MB limit');
      setTimeout(() => setFileError(''), 4000);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setFileError('');
    setIsReadingFile(true);

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedFile({
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        dataUrl: reader.result,
      });
      setIsReadingFile(false);
    };
    reader.onerror = () => {
      setFileError('Failed to read file. Please try again.');
      setIsReadingFile(false);
      setTimeout(() => setFileError(''), 4000);
    };
    reader.readAsDataURL(file);
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() && !selectedFile) return;

    onSendMessage({
      text: text.trim(),
      file: selectedFile || null,
    });

    setText('');
    clearSelectedFile();
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
        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-100 dark:hover:bg-surface-800 transition"
          aria-label="Close chat"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-surface-100/30 dark:bg-surface-950/40">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <MessageSquare size={32} className="text-text-tertiary mb-2" />
            <p className="text-xs font-medium text-text-secondary">No messages yet</p>
            <p className="text-[11px] text-text-tertiary mt-1">
              Messages and files shared here are visible to meeting participants.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender?._id === currentUserId;
            const rawText = typeof msg.message === 'string'
              ? msg.message
              : (msg.message?.content || msg.message?.text || msg.message?.message || '');
            const attachedFile = msg.file || (typeof msg.message === 'object' ? msg.message?.file : null);
            const fileInfo = attachedFile ? getFileTypeInfo(attachedFile) : null;

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
                    attachedFile ? 'w-full sm:w-auto min-w-[210px]' : ''
                  } ${
                    isMe
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white rounded-tr-xs shadow-xs'
                      : 'bg-white text-neutral-900 dark:bg-surface-800 dark:text-neutral-100 border-border-color rounded-tl-xs shadow-xs'
                  }`}
                >
                  {/* File Attachment */}
                  {attachedFile && (
                    <div className="mb-2">
                      {fileInfo.category === 'image' ? (
                        <div className="rounded-lg overflow-hidden border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
                          <a
                            href={attachedFile.dataUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={attachedFile.name}
                            className="group relative block overflow-hidden"
                            title={`Click to open/download ${attachedFile.name}`}
                          >
                            <img
                              src={attachedFile.dataUrl}
                              alt={attachedFile.name}
                              className="max-h-56 w-full object-cover rounded-lg transition-transform duration-200 group-hover:scale-[1.02]"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-medium">
                              <Download size={14} />
                              <span>Download</span>
                            </div>
                          </a>
                          <div className="flex items-center justify-between px-2 py-1.5 text-[10px] opacity-80 border-t border-black/5 dark:border-white/5">
                            <span className="truncate max-w-[130px] font-medium" title={attachedFile.name}>
                              {attachedFile.name}
                            </span>
                            <span className="shrink-0 ml-2">{formatFileSize(attachedFile.size)}</span>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`flex items-center justify-between gap-2.5 p-2 rounded-lg border transition ${
                            isMe
                              ? 'bg-neutral-800 text-white dark:bg-neutral-100 dark:text-neutral-900 border-neutral-700 dark:border-neutral-200'
                              : 'bg-surface-100 dark:bg-surface-900/60 text-text-primary border-border-color'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-lg flex flex-col items-center justify-center shrink-0 ${
                                fileInfo.category === 'pdf'
                                  ? 'bg-red-500/15 text-red-500 border border-red-500/30'
                                  : fileInfo.category === 'word'
                                  ? 'bg-blue-500/15 text-blue-500 border border-blue-500/30'
                                  : 'bg-neutral-500/15 text-neutral-400 border border-neutral-500/30'
                              }`}
                            >
                              <FileText size={15} />
                              <span className="text-[8px] font-bold leading-none mt-0.5 tracking-tight">
                                {fileInfo.label}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 text-left">
                              <p className="text-xs font-medium truncate max-w-[125px]" title={attachedFile.name}>
                                {attachedFile.name}
                              </p>
                              <p className="text-[10px] opacity-70">
                                {formatFileSize(attachedFile.size)}
                              </p>
                            </div>
                          </div>
                          <a
                            href={attachedFile.dataUrl}
                            download={attachedFile.name}
                            className={`p-1.5 rounded-md shrink-0 transition ${
                              isMe
                                ? 'hover:bg-white/20 text-white dark:hover:bg-black/10 dark:text-neutral-900'
                                : 'hover:bg-surface-200 dark:hover:bg-surface-800 text-text-secondary hover:text-text-primary'
                            }`}
                            title={`Download ${attachedFile.name}`}
                            aria-label={`Download ${attachedFile.name}`}
                          >
                            <Download size={15} />
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Text Content */}
                  {rawText && <p className="whitespace-pre-wrap">{rawText}</p>}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Field */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-border-color bg-surface-50 dark:bg-surface-900">
        {/* Error Notification */}
        {fileError && (
          <div className="mb-2 px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center justify-between">
            <span>{fileError}</span>
            <button
              type="button"
              onClick={() => setFileError('')}
              className="p-0.5 hover:opacity-70"
              aria-label="Dismiss error"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Selected File Preview */}
        {selectedFile && (
          <div className="mb-2 p-2 rounded-lg bg-surface-100 dark:bg-surface-800/80 border border-border-color flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {getFileTypeInfo(selectedFile).category === 'image' ? (
                <img
                  src={selectedFile.dataUrl}
                  alt={selectedFile.name}
                  className="w-8 h-8 rounded object-cover border border-border-color shrink-0"
                />
              ) : (
                <div
                  className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${
                    getFileTypeInfo(selectedFile).category === 'pdf'
                      ? 'bg-red-500/15 text-red-500 border border-red-500/30'
                      : getFileTypeInfo(selectedFile).category === 'word'
                      ? 'bg-blue-500/15 text-blue-500 border border-blue-500/30'
                      : 'bg-neutral-500/15 text-neutral-400 border border-neutral-500/30'
                  }`}
                >
                  <FileText size={16} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-text-primary truncate">
                  {selectedFile.name}
                </p>
                <p className="text-[10px] text-text-tertiary">
                  {formatFileSize(selectedFile.size)} • {getFileTypeInfo(selectedFile).label}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={clearSelectedFile}
              className="p-1 rounded-md text-text-tertiary hover:text-text-primary hover:bg-surface-200 dark:hover:bg-surface-700 transition"
              title="Remove file"
              aria-label="Remove attached file"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            id="chat-file-upload-input"
          />

          {/* Paperclip Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isReadingFile}
            className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-100 dark:hover:bg-surface-800 transition shrink-0"
            title="Attach file (Images, PDF, Word)"
            aria-label="Attach file"
          >
            <Paperclip size={16} />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={selectedFile ? "Add a caption or send..." : "Type a message..."}
            className="input-field text-xs py-2 bg-white dark:bg-surface-800 text-neutral-900 dark:text-neutral-100 border border-border-color placeholder:text-neutral-500 dark:placeholder:text-neutral-400 flex-1 min-w-0"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={(!text.trim() && !selectedFile) || isReadingFile}
            className="p-2 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-900 rounded-lg disabled:opacity-40 transition shrink-0"
            aria-label="Send message"
          >
            <Send size={15} />
          </button>
        </div>
      </form>
    </div>
  );
};
