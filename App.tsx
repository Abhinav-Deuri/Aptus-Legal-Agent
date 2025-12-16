import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import InputCard from './components/InputCard';
import ResultsView from './components/ResultsView';
import ErrorBoundary from './components/ErrorBoundary';
import PrivacyModal from './components/PrivacyModal';
import { AppStatus, InputState, AptusResponse } from './types';
import { analyzeDocument, processFilesForGemini, ProcessedPart } from './services/gemini';
import { translations } from './translations';
import { Shield } from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [inputState, setInputState] = useState<InputState>({
    text: '',
    files: [],
    language: 'English',
  });
  const [result, setResult] = useState<AptusResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showPrivacy, setShowPrivacy] = useState(false);

  // Get current translations based on selected language name
  const t = translations[inputState.language] || translations['English'];
  const isRTL = inputState.language === 'العربية';

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aptus-theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('aptus-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('aptus-theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleSubmit = async () => {
    setStatus(AppStatus.PROCESSING);
    setErrorMsg('');
    setResult(null);

    try {
      // Process files: Image compression, PDF base64, Text file reading
      const processedFiles: ProcessedPart[] = await processFilesForGemini(inputState.files);

      const response = await analyzeDocument(
        inputState.text,
        processedFiles,
        inputState.language
      );

      setResult(response);
      setStatus(AppStatus.SUCCESS);
      
      // Scroll to results
      setTimeout(() => {
        const resultsEl = document.getElementById('results-section');
        resultsEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

    } catch (err: any) {
      console.error(err);
      setStatus(AppStatus.ERROR);
      setErrorMsg(err.message || "An unexpected error occurred while analyzing the document.");
    }
  };

  const handleReset = () => {
    setStatus(AppStatus.IDLE);
    setResult(null);
    setInputState(prev => ({ ...prev, text: '', files: [] }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <ErrorBoundary t={t}>
      <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen flex flex-col font-sans text-slate-900 dark:text-slate-100 relative selection:bg-aptus-200 selection:text-aptus-900 transition-colors duration-300">
        
        {/* Background Decor */}
        <div className="fixed inset-0 -z-10 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
          <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-b from-blue-50/80 via-indigo-50/50 to-transparent dark:from-blue-900/20 dark:via-indigo-900/10 pointer-events-none" />
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-aptus-200 dark:bg-aptus-900/30 rounded-full blur-3xl opacity-30 animate-pulse-slow" />
          <div className="absolute top-20 -left-20 w-72 h-72 bg-violet-200 dark:bg-violet-900/30 rounded-full blur-3xl opacity-30 animate-pulse-slow delay-1000" />
        </div>

        <Header 
          selectedLanguage={inputState.language}
          onLanguageChange={(lang) => setInputState(prev => ({ ...prev, language: lang }))}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
        />

        <main className="flex-grow w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
          
          {/* Intro */}
          {status === AppStatus.IDLE && (
            <div className="text-center mb-12 space-y-4 animate-fade-in-up">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-white dark:bg-slate-900 border border-aptus-100 dark:border-slate-800 shadow-sm text-xs font-semibold text-aptus-600 dark:text-aptus-400 mb-2">
                <span className="w-2 h-2 rounded-full bg-aptus-500 mr-2 animate-pulse"></span>
                {t.badge}
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {t.heroTitlePrefix} <br className="hidden md:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-aptus-600 to-violet-600 dark:from-aptus-400 dark:to-violet-400 animate-gradient-x">{t.heroTitleSuffix}</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                {t.heroDesc}
              </p>
            </div>
          )}

          {/* Input Section */}
          <div className="animate-fade-in-up delay-100">
            <InputCard 
              inputState={inputState}
              setInputState={setInputState}
              onSubmit={handleSubmit}
              isLoading={status === AppStatus.PROCESSING}
              t={t}
            />
          </div>

          {/* Error State */}
          {status === AppStatus.ERROR && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-5 flex items-start space-x-3 text-red-700 dark:text-red-300 mb-10 shadow-sm animate-fade-in-up">
              <div className="bg-red-100 dark:bg-red-900/50 p-2 rounded-full">
                 <span className="text-xl">⚠️</span>
              </div>
              <div>
                 <h3 className="font-bold text-red-800 dark:text-red-200">{t.analysisFailed}</h3>
                 <p className="text-sm mt-1">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Results Section */}
          {status === AppStatus.SUCCESS && result && (
            <div id="results-section" className="pt-8 animate-fade-in-up">
               <div className="flex justify-between items-end mb-8 px-2">
                  <div>
                     <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{t.analysisResultTitle}</h2>
                     <p className="text-slate-500 dark:text-slate-400 mt-1">{t.analysisResultSubtitle}</p>
                  </div>
                  <button 
                    onClick={handleReset}
                    className="px-4 py-2 text-sm font-semibold text-aptus-600 dark:text-aptus-300 bg-aptus-50 dark:bg-slate-800 hover:bg-aptus-100 dark:hover:bg-slate-700 rounded-xl transition-colors border border-aptus-200 dark:border-slate-700"
                  >
                    {t.analyzeNewButton}
                  </button>
               </div>
               <ResultsView data={result} t={t} />
            </div>
          )}

        </main>

        <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm py-8 transition-colors duration-300">
          <div className="max-w-4xl mx-auto px-4 text-center text-slate-400 dark:text-slate-600 text-sm font-medium">
            <p className="mb-2">&copy; {new Date().getFullYear()} {t.footer}</p>
            <button 
              onClick={() => setShowPrivacy(true)}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-aptus-600 dark:hover:text-aptus-400 transition-colors"
            >
              <Shield size={12} />
              <span>{t.privacyTitle || "Privacy & Data Security"}</span>
            </button>
          </div>
        </footer>

        <PrivacyModal 
          isOpen={showPrivacy} 
          onClose={() => setShowPrivacy(false)} 
          t={t} 
        />
      </div>
    </ErrorBoundary>
  );
};

export default App;