import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'AgenticMarketer — Autonomous Marketing Intelligence Swarm',
  description: 'Multi-Agent Marketing Orchestration System powered by Gemini 3.5, Hugging Face, FAISS Vector RAG & Autonomous Publishing.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        <AuthProvider>
          <div className="relative min-h-screen flex flex-col bg-grid-cyber">
            <div className="fixed inset-0 pointer-events-none bg-radial-glow z-0" />
            <div className="relative z-10 flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1">{children}</main>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
