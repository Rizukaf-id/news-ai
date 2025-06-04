import ChatBox from './components/ChatBox';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <div className="max-w-[1440px] w-full mx-auto px-6 flex flex-col min-h-screen">
        <header className="py-4 bg-white border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">Learning Assistant</h1>
              <span className="h-6 w-px bg-gray-300"></span>
              <p className="text-gray-600">Asisten pembelajaran interaktif untuk membantumu belajar apa saja.</p>
            </div>
          </div>
        </header>
        
        <div className="flex-1 relative">
          <ChatBox />
        </div>
        
        <footer className="mt-auto py-4 text-center text-sm text-gray-500 bg-white border-t">
          <p>Dibuat dengan Next.js, Tailwind CSS, llama-4-maverick, dan Firebase</p>
          <p className="text-xs mt-1">© 2025 Learning Assistant</p>
        </footer>
      </div>
    </main>
  );
}