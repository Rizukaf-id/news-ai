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
        const history = await getChatHistory(userId);
        
        // Always show the greeting message, then add history if it exists
        const greetingMessage = {
          type: 'bot',
          content: '👋 Halo! Saya asisten pembelajaran Anda.\n\n### Apa yang bisa saya bantu?\nSaya bisa membantu Anda belajar berbagai topik dengan:\n- Penjelasan yang mudah dipahami\n- Contoh praktis dan relevan\n- Sumber belajar yang terverifikasi\n- Panduan langkah demi langkah\n\n### Mulai Belajar\nSilakan ketik pertanyaan atau topik yang ingin Anda pelajari.',
          timestamp: new Date().toISOString()
        };
        
        if (history && history.length > 0) {
          console.log('Chat history loaded:', history.length, 'messages');
          setMessages([greetingMessage, ...history]);
        } else {
          setMessages([greetingMessage]);
        }
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
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const botMessage = {
        type: 'bot',
        content: data.response.content || 'Maaf, saya tidak dapat memproses permintaan Anda.',
        learningPath: data.response.learningPath || [],
        references: data.response.references || [],
        timestamp: new Date().toISOString()
      };

      // Update messages state
      setMessages([...newMessages, botMessage]);

      // Save to chat history with normalized data
      await saveChat({
        userId,
        sessionId,
        message: userMessage,
        response: {
          content: botMessage.content,
          learningPath: botMessage.learningPath,
          references: botMessage.references,
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
      <div className="bg-white h-full flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} w-full`}
              >
                <div
                  className={`${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white ml-auto max-w-[70%] p-4 rounded-lg'
                      : message.isError
                        ? 'bg-red-50 border border-red-200 text-gray-800 max-w-[85%]'
                        : 'w-full'
                  }`}
                >
                  {message.type === 'bot' && message.content ? (
                    <BotMessage message={message} />
                  ) : (
                    <div className="p-4 rounded-lg">
                      {message.content}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        <div className="border-t border-gray-200 bg-white py-4">
          <div className="max-w-[1440px] w-full mx-auto px-6">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ketik pesan Anda..."
                disabled={isLoading}
                autoComplete="off"
              />
              <button
                type="submit"
                className={`px-4 py-2 bg-blue-500 text-white rounded-lg ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
                }`}
                disabled={isLoading}
              >
                Kirim
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}