import React from 'react';
import { Scale, Globe, ChevronDown, Moon, Sun } from 'lucide-react';
import { LANGUAGES } from '../types';

interface HeaderProps {
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ selectedLanguage, onLanguageChange, isDarkMode, toggleTheme }) => {
  return (
    <header className="sticky top-0 z-50 transition-all duration-300 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-white/20 dark:border-slate-800/50 shadow-sm supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="relative">
            <div className="absolute inset-0 bg-aptus-400 blur opacity-20 group-hover:opacity-40 transition-opacity rounded-xl"></div>
            <div className="bg-gradient-to-br from-aptus-500 to-aptus-600 p-2 sm:p-2.5 rounded-xl text-white shadow-lg shadow-aptus-500/30 relative transform group-hover:scale-105 transition-transform duration-300">
              <Scale size={22} strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white tracking-tight leading-none group-hover:text-aptus-600 dark:group-hover:text-aptus-400 transition-colors">Aptus</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle Dark Mode"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Language Selector */}
          <div className="relative group/lang">
            <div className="flex items-center space-x-2 bg-slate-50/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-aptus-200 dark:hover:border-slate-600 px-3 py-2 rounded-full transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer relative">
              <Globe size={16} className="text-aptus-500" />
              <select
                value={selectedLanguage}
                onChange={(e) => onLanguageChange(e.target.value)}
                className="bg-transparent text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none appearance-none cursor-pointer pr-7 pl-1 z-10"
                aria-label="Select Language"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.name} className="dark:bg-slate-800">
                    {lang.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="text-slate-400 absolute right-3 pointer-events-none group-hover/lang:text-aptus-500 transition-colors" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;