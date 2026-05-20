import { Copy, Check, ThumbsUp, ThumbsDown, RefreshCw } from 'lucide-react';
import { useState } from 'react';

export default function ChatMessage({ message, isUser }) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div className="flex justify-end mb-6">
        <div className="max-w-lg bg-discourse-teal text-white rounded-lg rounded-tr-sm px-4 py-3 text-sm font-medium shadow-sm">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 mb-6">
      {/* AI Avatar */}
      <div className="w-8 h-8 rounded-lg bg-discourse-teal flex items-center justify-center flex-shrink-0">
        <span className="text-white text-xs font-bold">L</span>
      </div>

      <div className="flex-1 max-w-2xl">
        <div className="text-xs text-discourse-teal font-semibold mb-2 flex items-center gap-2">
          <span>LexAI</span>
          {message.mode && (
            <span className="text-xs text-discourse-gray font-medium bg-discourse-input px-2 py-0.5 rounded">
              {message.mode}
            </span>
          )}
        </div>

        <div className="bg-white border border-discourse-border rounded-lg p-4 shadow-sm">
          <div className="text-sm text-discourse-dark leading-relaxed whitespace-pre-wrap font-normal">
            {message.content}
          </div>
        </div>

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="text-xs font-semibold text-discourse-gray">📚 Sources</div>
            <div className="flex flex-wrap gap-2">
              {message.sources.map((source, idx) => (
                <a
                  key={idx}
                  href={source.url || '#'}
                  className="text-xs bg-white hover:bg-discourse-input px-3 py-1.5 rounded-md text-discourse-dark border border-discourse-border transition-colors"
                  title={source.title}
                >
                  {source.title.split('/').pop()}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-1 mt-3">
          <button
            onClick={handleCopy}
            className="p-1.5 text-discourse-gray hover:text-discourse-teal hover:bg-discourse-input rounded transition-colors"
            title="Copy response"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
          <button
            onClick={() => setFeedback(feedback === 'like' ? null : 'like')}
            className={`p-1.5 rounded transition-colors ${
              feedback === 'like'
                ? 'text-discourse-teal bg-discourse-input'
                : 'text-discourse-gray hover:text-discourse-teal hover:bg-discourse-input'
            }`}
            title="Helpful"
          >
            <ThumbsUp size={16} />
          </button>
          <button
            onClick={() => setFeedback(feedback === 'dislike' ? null : 'dislike')}
            className={`p-1.5 rounded transition-colors ${
              feedback === 'dislike'
                ? 'text-red-600 bg-red-50'
                : 'text-discourse-gray hover:text-red-600 hover:bg-red-50'
            }`}
            title="Not helpful"
          >
            <ThumbsDown size={16} />
          </button>
          <button
            className="p-1.5 text-discourse-gray hover:text-discourse-teal hover:bg-discourse-input rounded transition-colors"
            title="Regenerate"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}