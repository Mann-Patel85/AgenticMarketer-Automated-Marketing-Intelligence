import React, { useState } from 'react';
import { Upload, Bot, FileText, CheckCircle2, Play, Sparkles } from 'lucide-react';

export default function App() {
  const [files, setFiles] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const runPipeline = () => {
    if (files.length === 0) return alert('Please upload at least one marketing document!');
    setIsAnalyzing(true);
    // Backend API integration point
    setTimeout(() => setIsAnalyzing(false), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-10 flex justify-between items-center border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30">
            <Bot className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AgenticMarketer</h1>
            <p className="text-xs text-slate-400">Autonomous Multi-Agent Marketing Engine</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-medium flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          System Ready
        </span>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Upload Section */}
        <section className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-400" /> Grounding Documents
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Upload brand guides, competitor reports, or PDFs to ground agent research.
            </p>

            <label className="border-2 border-dashed border-slate-700 hover:border-indigo-500/50 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition bg-slate-950/50 hover:bg-indigo-950/10 group">
              <FileText className="w-10 h-10 text-slate-500 group-hover:text-indigo-400 transition mb-2" />
              <span className="text-xs font-medium text-slate-300">Click to upload or drag files</span>
              <span className="text-[10px] text-slate-500 mt-1">PDF, DOCX, PNG (Max 25MB)</span>
              <input type="file" multiple onChange={handleFileChange} className="hidden" />
            </label>

            {/* Uploaded File List */}
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold text-slate-400">Selected Files:</p>
                {files.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-slate-800/60 rounded-lg text-xs">
                    <span className="truncate max-w-[180px] text-slate-200">{file.name}</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={runPipeline}
              disabled={isAnalyzing}
              className="w-full mt-6 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-medium text-sm rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-indigo-200" />
                  Agents Orchestrating...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  Run Marketing Swarm
                </>
              )}
            </button>
          </div>
        </section>

        {/* Right Column: Multi-Agent Execution Pipeline */}
        <section className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" /> Swarm Execution Live Feed
            </h2>

            <div className="space-y-4">
              {[
                { name: 'Document Ingestion Agent', role: 'RAG Vectorization', status: 'Idle', color: 'border-slate-800' },
                { name: 'Market Research Agent', role: 'DuckDuckGo Web Search', status: 'Idle', color: 'border-slate-800' },
                { name: 'Copywriter Agent', role: 'Content Generation', status: 'Idle', color: 'border-slate-800' },
                { name: 'SEO Strategy Agent', role: 'Readability & Keyword Scoring', status: 'Idle', color: 'border-slate-800' },
              ].map((agent, i) => (
                <div key={i} className={`p-4 border rounded-xl bg-slate-950/40 flex items-center justify-between ${agent.color}`}>
                  <div>
                    <h3 className="text-sm font-medium text-slate-200">{agent.name}</h3>
                    <p className="text-xs text-slate-500">{agent.role}</p>
                  </div>
                  <span className="text-xs px-2.5 py-1 bg-slate-800 text-slate-400 rounded-md">
                    {isAnalyzing ? 'Processing...' : agent.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}