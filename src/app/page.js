import ChatBox from './components/ChatBox';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-[1440px] w-full mx-auto px-6 flex flex-col min-h-screen">
        <header className="py-6 bg-white border-b border-slate-200/80 backdrop-blur supports-backdrop-blur:bg-white/95">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-800">News AI</h1>
              </div>
              <span className="h-6 w-px bg-slate-200"></span>
              <p className="text-slate-600">Asisten berita interaktif untuk membantumu mendapatkan informasi terkini.</p>
            </div>
          </div>
        </header>
        
        <div className="flex-1 relative">
          <ChatBox />
        </div>
        
        <footer className="mt-auto py-4 text-center border-t border-slate-200/80">
          <p className="text-sm text-slate-600">
            Dibuat dengan{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-800 font-medium">
              Next.js
            </span>
            {', '}
            <span className="text-slate-800 font-medium">Llama 4</span>
            {', dan '}
            <span className="text-orange-600 font-medium">Firebase</span>
          </p>
          <p className="text-xs mt-1 text-slate-500">© 2025 News AI | Mahasiswa Jawa</p>
        </footer>
      </div>
    </main>
  );
}