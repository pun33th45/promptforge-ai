
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PromptType, Tone, SkillLevel, PromptRequest, HistoryItem } from './types';
import { optimizePrompt } from './services/geminiService';
import { Icons, PROMPT_TEMPLATES } from './constants';
import { Button } from './components/Button';

// Updated storage key to ensure a clean break from any legacy buggy versions
const STORAGE_KEY = 'promptforge_history_v5_prod';

const App: React.FC = () => {
  // Form State
  const [idea, setIdea] = useState('');
  const [type, setType] = useState<PromptType>(PromptType.Chatbot);
  const [tone, setTone] = useState<Tone>(Tone.Professional);
  const [level, setLevel] = useState<SkillLevel>(SkillLevel.Beginner);
  
  // App State - Initialized directly from localStorage to prevent race conditions on mount
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Critical: Failed to initialize history from localStorage", e);
      return [];
    }
  });

  const [loading, setLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');

  const resultRef = useRef<HTMLDivElement>(null);

  // Persistence: Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.error("Failed to persist history:", e);
    }
  }, [history]);

  // Status message auto-dismiss
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  const handleGenerate = async (e?: React.FormEvent, overrideRequest?: PromptRequest) => {
    if (e) e.preventDefault();
    
    const targetIdea = overrideRequest ? overrideRequest.idea : idea;
    const targetType = overrideRequest ? overrideRequest.type : type;
    const targetTone = overrideRequest ? overrideRequest.tone : tone;
    const targetLevel = overrideRequest ? overrideRequest.level : level;

    if (!targetIdea.trim()) {
      setError("Please describe what you want the AI to do.");
      return;
    }

    if (overrideRequest) {
      setIdea(targetIdea);
      setType(targetType);
      setTone(targetTone);
      setLevel(targetLevel);
    }

    setError(null);
    setLoading(true);
    setCurrentResult(null);

    const request: PromptRequest = { 
      idea: targetIdea, 
      type: targetType, 
      tone: targetTone, 
      level: targetLevel 
    };

    try {
      const result = await optimizePrompt(request);
      setCurrentResult(result);
      
      const newHistoryItem: HistoryItem = {
        id: crypto.randomUUID(),
        request,
        result,
        timestamp: Date.now()
      };
      
      setHistory(prev => [newHistoryItem, ...prev].slice(0, 50));
      if (activeTab !== 'generate') setActiveTab('generate');

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopying(true);
      setTimeout(() => setCopying(false), 2000);
    } catch (err) {
      console.error("Clipboard Error:", err);
    }
  };

  const downloadAsMarkdown = (text: string) => {
    const element = document.createElement("a");
    const file = new Blob([text], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = `optimized-prompt-${Date.now()}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    setStatusMessage("Entry deleted.");
  };

  const clearAllHistory = () => {
    const confirmed = window.confirm("Are you sure you want to clear all history? This action is permanent.");
    if (confirmed) {
      // Clear both state and storage immediately to prevent reappearance
      localStorage.removeItem(STORAGE_KEY);
      setHistory([]);
      setStatusMessage("History cleared successfully.");
    }
  };

  const applyTemplate = (templateIdea: string) => {
    setIdea(templateIdea);
    setError(null);
  };

  const loadFromHistory = (item: HistoryItem) => {
    setIdea(item.request.idea);
    setType(item.request.type);
    setTone(item.request.tone);
    setLevel(item.request.level);
    setCurrentResult(item.result);
    setActiveTab('generate');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const promptMetrics = useMemo(() => {
    if (!currentResult) return null;
    return {
      complexity: Math.min(Math.round(currentResult.length / 100), 10),
      isStructured: currentResult.includes('Role:') && (currentResult.includes('Constraints:') || currentResult.includes('Goal:')),
      hasFormat: currentResult.toLowerCase().includes('format')
    };
  }, [currentResult]);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col selection:bg-indigo-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full"></div>
      </div>

      {statusMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-slide-up">
          <div className="bg-slate-900 border border-slate-700 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">{statusMessage}</span>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-50 border-b border-slate-800/60 bg-[#020617]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('generate')}>
            <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Icons.Sparkles />
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              PromptForge <span className="text-indigo-400">AI</span>
            </h1>
          </div>
          
          <nav className="flex items-center gap-1 bg-slate-900/50 p-1 rounded-lg border border-slate-800/50">
            <button 
              onClick={() => setActiveTab('generate')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'generate' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              Generator
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              History {history.length > 0 && `(${history.length})`}
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-4 py-8 w-full relative z-10">
        {activeTab === 'generate' ? (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-fade-in">
            <div className="xl:col-span-7 space-y-6">
              <section className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-xl">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-1">Architecture Workshop</h2>
                  <p className="text-slate-400 text-sm">Design your professional AI instructions with architectural precision.</p>
                </div>

                <form onSubmit={(e) => handleGenerate(e)} className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Core Objective</label>
                      <span className={`text-[10px] ${idea.length > 900 ? 'text-rose-400' : 'text-slate-600'}`}>{idea.length}/1000</span>
                    </div>
                    <textarea
                      className="w-full h-36 bg-black/40 border border-slate-800 rounded-xl p-4 text-slate-200 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 outline-none transition-all resize-none placeholder:text-slate-700 leading-relaxed custom-scrollbar"
                      placeholder="e.g. Help me build a multi-tenant SaaS architecture for a project management tool..."
                      value={idea}
                      maxLength={1000}
                      onChange={(e) => setIdea(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Quick Start Blueprints</label>
                    <div className="flex flex-wrap gap-2">
                      {PROMPT_TEMPLATES.map((tmpl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => applyTemplate(tmpl.idea)}
                          className="px-3 py-1.5 rounded-full bg-slate-800/40 border border-slate-700/50 text-xs text-slate-300 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all"
                        >
                          {tmpl.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Industry Sector</label>
                      <select
                        className="w-full bg-black/40 border border-slate-800 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer"
                        value={type}
                        onChange={(e) => setType(e.target.value as PromptType)}
                      >
                        {Object.values(PromptType).map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Linguistic Tone</label>
                      <select
                        className="w-full bg-black/40 border border-slate-800 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer"
                        value={tone}
                        onChange={(e) => setTone(e.target.value as Tone)}
                      >
                        {Object.values(Tone).map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Target Depth</label>
                      <select
                        className="w-full bg-black/40 border border-slate-800 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer"
                        value={level}
                        onChange={(e) => setLevel(e.target.value as SkillLevel)}
                      >
                        {Object.values(SkillLevel).map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs flex items-center gap-2 animate-pulse">
                      <div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div>
                      {error}
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full py-4 text-base shadow-2xl shadow-indigo-600/20 active:scale-[0.98]" 
                    isLoading={loading}
                  >
                    <Icons.Sparkles />
                    Architect Optimized Prompt
                  </Button>
                </form>
              </section>

              {currentResult && promptMetrics && (
                <div className="bg-slate-900/20 border border-indigo-500/20 rounded-2xl p-6 backdrop-blur-sm space-y-4 animate-slide-up">
                  <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                    <Icons.Lightbulb />
                    Engineering Analysis
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-black/20 p-3 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase mb-1">Complexity Score</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-grow h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${promptMetrics.complexity * 10}%` }}></div>
                        </div>
                        <span className="text-xs font-bold text-indigo-300">{promptMetrics.complexity}/10</span>
                      </div>
                    </div>
                    <div className="bg-black/20 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg transition-colors ${promptMetrics.isStructured ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                        <Icons.Check />
                      </div>
                      <span className="text-xs font-medium">Logical Structure</span>
                    </div>
                    <div className="bg-black/20 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg transition-colors ${promptMetrics.hasFormat ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                        <Icons.Check />
                      </div>
                      <span className="text-xs font-medium">Output Definition</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="xl:col-span-5 flex flex-col gap-6" ref={resultRef}>
              <div className={`bg-slate-900/40 border border-slate-800/50 rounded-2xl overflow-hidden flex flex-col shadow-2xl transition-all duration-700 ${currentResult ? 'opacity-100' : 'opacity-40 select-none grayscale cursor-not-allowed'}`}>
                <div className="px-6 py-4 bg-slate-800/30 border-b border-slate-800/60 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-semibold tracking-wide text-indigo-300 uppercase">Compiled Blueprint</span>
                  </div>
                  {currentResult && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => downloadAsMarkdown(currentResult)}
                        title="Export as .md"
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700/50"
                      >
                        <Icons.Download />
                      </button>
                      <button 
                        onClick={() => copyToClipboard(currentResult)}
                        className={`px-4 py-2 flex items-center gap-2 rounded-lg text-xs font-bold transition-all border ${copying ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500 shadow-lg'}`}
                      >
                        {copying ? <Icons.Check /> : <Icons.Copy />}
                        {copying ? 'COPIED' : 'COPY'}
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="p-6 sm:p-8 flex-grow min-h-[400px]">
                  {!currentResult && !loading && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50 py-20">
                      <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-600">
                        <Icons.Sparkles />
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">System Idle</p>
                        <p className="text-slate-600 text-xs mt-1">Configure parameters to generate a blueprint.</p>
                      </div>
                    </div>
                  )}

                  {loading && (
                    <div className="h-full flex flex-col items-center justify-center space-y-6 py-20">
                      <div className="relative">
                        <div className="w-16 h-16 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Icons.Sparkles />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-indigo-400 font-semibold animate-pulse">Processing Logical Tokens...</p>
                        <p className="text-slate-600 text-[10px] uppercase tracking-widest mt-2">Neural Forging in Progress</p>
                      </div>
                    </div>
                  )}

                  {currentResult && (
                    <div className="animate-in fade-in zoom-in-95 duration-500">
                      <div className="bg-black/60 rounded-xl border border-slate-800 p-6 overflow-auto max-h-[600px] custom-scrollbar font-mono text-sm leading-relaxed text-slate-300 shadow-inner">
                        {currentResult.split('\n').map((line, i) => (
                          <div key={i} className={line.startsWith('Role:') || line.startsWith('Goal:') || line.startsWith('Constraints:') || line.startsWith('Output Format:') ? 'text-indigo-400 font-bold mt-4 first:mt-0' : ''}>
                            {line}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Archives</h2>
                <p className="text-slate-400 mt-1">Review, re-run, or restore your previous engineered prompts.</p>
              </div>
              <Button 
                variant="danger" 
                className={`text-xs uppercase font-black px-5 ${history.length === 0 ? 'opacity-30' : 'hover:bg-rose-600'}`}
                onClick={clearAllHistory}
                disabled={history.length === 0}
              >
                <Icons.Trash /> Clear All Repository
              </Button>
            </div>

            {history.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-20 text-center space-y-6 backdrop-blur-md">
                <div className="w-20 h-20 bg-slate-800/50 rounded-full mx-auto flex items-center justify-center text-slate-600 shadow-inner">
                  <Icons.History />
                </div>
                <div className="max-w-xs mx-auto">
                  <p className="text-slate-300 font-semibold">Repository Empty</p>
                  <p className="text-slate-500 text-sm mt-2">Past blueprints will be indexed here for audit and rapid deployment.</p>
                </div>
                <Button variant="secondary" onClick={() => setActiveTab('generate')}>Back to Workshop</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {history.map((item) => (
                  <div 
                    key={item.id}
                    className="group flex flex-col bg-slate-900/40 hover:bg-slate-800/40 border border-slate-800/60 rounded-2xl p-6 transition-all relative shadow-lg overflow-hidden border-l-4 border-l-indigo-500/20 hover:border-l-indigo-500/80"
                  >
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-black tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/10">
                            {item.request.type}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {new Date(item.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => deleteHistoryItem(item.id)}
                        className="p-2 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                        title="Delete entry"
                      >
                        <Icons.Trash />
                      </button>
                    </div>

                    <div className="space-y-4 flex-grow relative z-10">
                      <p className="text-base text-slate-100 font-bold line-clamp-2 leading-tight group-hover:text-indigo-200 transition-colors">
                        {item.request.idea}
                      </p>
                      
                      <div className="flex gap-2">
                        <span className="text-[10px] px-2 py-1 bg-black/40 border border-slate-800 rounded text-slate-400 font-medium">{item.request.tone}</span>
                        <span className="text-[10px] px-2 py-1 bg-black/40 border border-slate-800 rounded text-slate-400 font-medium">{item.request.level}</span>
                      </div>

                      <div className="bg-black/30 p-4 rounded-xl border border-slate-800/50 group-hover:border-slate-700 transition-colors">
                        <p className="text-[11px] text-slate-500 font-mono line-clamp-4 leading-relaxed italic">
                          "{item.result.substring(0, 300)}..."
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-6 relative z-10">
                      <Button 
                        variant="secondary" 
                        className="text-xs font-bold py-2.5 bg-slate-900/80 border border-slate-800 hover:bg-slate-800"
                        onClick={() => loadFromHistory(item)}
                      >
                        <Icons.Edit /> RESTORE
                      </Button>
                      <Button 
                        variant="primary" 
                        className="text-xs font-bold py-2.5 bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/10"
                        onClick={() => handleGenerate(undefined, item.request)}
                      >
                        <Icons.Play /> DEPLOY
                      </Button>
                    </div>
                    
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none group-hover:bg-indigo-500/10 transition-all"></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800/60 py-8 bg-[#020617]/50 mt-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-slate-500 text-xs flex items-center gap-4">
            <span className="font-semibold tracking-wide">© 2025 PromptForge AI Engine</span>
            <span className="w-1 h-1 bg-slate-800 rounded-full"></span>
            <span className="font-mono opacity-80">v1.3.1 Production</span>
            <span className="w-1 h-1 bg-slate-800 rounded-full"></span>
            <span className="text-emerald-500/80 flex items-center gap-1.5 font-medium">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              Engine Stable
            </span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-slate-500 hover:text-white transition-colors">Documentation</a>
            <a href="#" className="text-xs text-slate-500 hover:text-white transition-colors">Security Audit</a>
            <a href="#" className="text-xs text-slate-500 hover:text-white transition-colors">Privacy Lexicon</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
