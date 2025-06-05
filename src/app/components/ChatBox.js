'use client';

import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { saveChat, getChatHistory } from '../lib/chatHistoryService';
import BotMessage from './BotMessage';

export default function ChatBox() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [userId] = useState(() => {
    if (typeof window !== 'undefined') {
      let storedId = localStorage.getItem('userId');
      if (!storedId) {
        storedId = uuidv4();
        localStorage.setItem('userId', storedId);
      }
      return storedId;
    }
    return null;
  });
  const [sessionId] = useState(uuidv4());

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  // Initialize chat
  useEffect(() => {
    const loadPreviousChat = async () => {
      if (!userId) return;
        try {
        setIsLoading(true);
        
        // Only show the greeting message without loading history
        const greetingMessage = {
          type: 'bot',
          content: '👋 Halo! Saya asisten berita Anda.\n\n### Apa yang bisa saya bantu?\nSaya dapat membantu Anda menemukan dan merangkum berita terkini dengan:\n- Pencarian berdasarkan topik atau kata kunci\n- Ringkasan berita dari berbagai sumber\n- Link referensi ke artikel lengkap\n- Pembaruan berita real-time\n\n### Mulai Mencari\nSilakan ketik topik atau kata kunci berita yang ingin Anda cari.',
          timestamp: new Date().toISOString()
        };
        
        setMessages([greetingMessage]);
      } catch (error) {
        console.error('Failed to load chat history:', error);
        // Show error message to user
        setMessages([{
          type: 'bot',
          content: `❌ Error Memuat Riwayat Chat\n\n### Detail Error\n- ${error.message || 'Gagal memuat riwayat chat'}\n\n### Saran\n- Refresh halaman untuk mencoba lagi\n- Pastikan Anda memiliki koneksi internet yang stabil`,
          isError: true,
          timestamp: new Date().toISOString()
        }]);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreviousChat();
  }, [userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || !userId) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message
    const newMessages = [
      ...messages,
      { type: 'user', content: userMessage }
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: userMessage,
          userId,
          sessionId 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
        const botMessage = {
        type: 'bot',
        content: data.response.content,
        references: data.response.references?.map(ref => ref.url) || [],
        articles: data.response.references || [],
        timestamp: new Date().toISOString()
      };

      // Update messages state
      setMessages([...newMessages, botMessage]);      // Save to chat history
      await saveChat({
        userId,
        sessionId,
        message: userMessage,
        response: {
          content: botMessage.content,
          references: botMessage.references,
          articles: botMessage.articles,
          timestamp: botMessage.timestamp
        },
        timestamp: botMessage.timestamp
      });    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        type: 'bot',
        content: `❌ Maaf, terjadi kesalahan\n\n### Detail Error\n- ${error.message || 'Terjadi kesalahan yang tidak diketahui'}\n\n### Saran\n- Pastikan koneksi internet Anda stabil\n- Coba refresh halaman jika masalah berlanjut\n- Tunggu beberapa saat dan coba lagi`,
        learningPath: [],
        references: [],
        isError: true,
        timestamp: new Date().toISOString()
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="absolute inset-0 flex flex-col">
      <div className="h-full flex-1 flex flex-col">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} w-full`}
              >
                {message.type === 'user' ? (
                  <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white px-4 py-3 rounded-2xl shadow-sm max-w-[70%]">
                    {message.content}
                  </div>
                ) : (
                  <BotMessage message={message} />
                )}
              </div>
            ))}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-200 bg-white py-4 px-6">
          <div className="max-w-[1440px] w-full mx-auto">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl 
                          focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                          transition-shadow duration-200"
                placeholder="Ketik topik berita yang ingin dicari..."
                disabled={isLoading}
                autoComplete="off"
              />
              <button
                type="submit"
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200
                  ${isLoading 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-md hover:shadow-blue-500/20'
                  }`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Mencari...</span>
                  </div>
                ) : (
                  <span>Cari Berita</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}