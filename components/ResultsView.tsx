import React, { useState } from 'react';
import { Zap, Search, ClipboardList, BookOpen, AlertTriangle, Maximize2, X, Copy, Check } from 'lucide-react';
import { AptusResponse } from '../types';

interface ResultsViewProps {
  data: AptusResponse;
  t: any; // Translation object
}

type TabType = 'tldr' | 'rulelens' | 'steps' | 'citation';

const ResultsView: React.FC<ResultsViewProps> = ({ data, t }) => {
  const [activeTab, setActiveTab] = useState<TabType>('tldr');
  const [showCitationModal, setShowCitationModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const tabs = [
    { id: 'tldr', label: t.tabTldr, icon: Zap },
    { id: 'rulelens', label: t.tabRuleLens, icon: Search },
    { id: 'steps', label: t.tabActionPlan, icon: ClipboardList },
    { id: 'citation', label: t.tabSources, icon: BookOpen },
  ];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="animate-fade-in-up">
      
      {/* Tab Navigation */}
      <div className="flex p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl mb-8 overflow-x-auto touch-pan-x shadow-sm no-scrollbar">
        {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`flex-1 min-w-[100px] flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap relative ${
                        isActive 
                        ? 'text-aptus-600 dark:text-aptus-400' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                >
                    {isActive && (
                      <div className="absolute inset-0 bg-aptus-50 dark:bg-slate-800 rounded-xl shadow-inner mix-blend-multiply dark:mix-blend-normal transition-all" />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                        <Icon size={18} className={isActive ? 'text-aptus-500 dark:text-aptus-400 drop-shadow-sm' : 'text-slate-400 dark:text-slate-500'} strokeWidth={isActive ? 2.5 : 2} />
                        {tab.label}
                    </span>
                    {isActive && <div className="absolute bottom-1 w-1 h-1 bg-aptus-500 dark:bg-aptus-400 rounded-full"></div>}
                </button>
            );
        })}
      </div>

      {/* Tab Content Area */}
      <div className="min-h-[350px]">
        
        {/* 1. TL;DR Tab */}
        {activeTab === 'tldr' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-card border border-white/50 dark:border-slate-800 overflow-hidden animate-scale-in origin-top">
                <div className="bg-gradient-to-r from-aptus-500 via-aptus-600 to-violet-600 p-6 sm:p-8 flex items-center justify-between relative overflow-hidden">
                    <div className="flex items-center space-x-4 relative z-10">
                        <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md border border-white/10 shadow-lg">
                            <Zap className="text-white fill-white" size={24} />
                        </div>
                        <div>
                             <h3 className="text-white font-bold text-xl tracking-tight">{t.tldrTitle}</h3>
                             <p className="text-aptus-100 text-sm font-medium opacity-90">{t.tldrSubtitle}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => handleCopy(data.tldr, 'tldr')}
                        className="bg-white/10 hover:bg-white/20 p-2 rounded-lg text-white transition-colors relative z-10"
                        title="Copy text"
                    >
                        {copiedId === 'tldr' ? <Check size={20} /> : <Copy size={20} />}
                    </button>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                </div>
                <div className="p-8">
                    <p className="text-slate-700 dark:text-slate-200 text-lg sm:text-xl leading-relaxed font-medium">
                        {data.tldr}
                    </p>
                </div>
            </div>
        )}

        {/* 2. RuleLens Tab */}
        {activeTab === 'rulelens' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-card border border-slate-100 dark:border-slate-800 flex flex-col animate-scale-in origin-top overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-violet-50/50 dark:bg-violet-900/10">
                    <div className="flex items-center space-x-3">
                        <div className="bg-violet-100 dark:bg-violet-900/30 p-2 rounded-lg">
                            <Search className="text-violet-600 dark:text-violet-400" size={22} />
                        </div>
                        <div>
                            <h3 className="text-slate-800 dark:text-white font-bold text-lg">{t.ruleLensTitle}</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">{t.ruleLensSubtitle}</p>
                        </div>
                    </div>
                </div>
                <div className="p-6 sm:p-8 flex-1 bg-gradient-to-b from-white to-violet-50/20 dark:from-slate-900 dark:to-slate-900">
                    <div className="space-y-4">
                        {data.ruleLens.length > 0 ? (
                            data.ruleLens.map((item, idx) => (
                                <div key={idx} className="group bg-white dark:bg-slate-800 p-5 rounded-2xl border border-violet-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 hover:border-violet-200 dark:hover:border-violet-700">
                                    <div className="flex items-center mb-2">
                                        <div className="w-1.5 h-1.5 bg-violet-400 rounded-full mr-2.5 rtl:mr-0 rtl:ml-2.5 group-hover:scale-150 transition-transform"></div>
                                        <div className="text-violet-700 dark:text-violet-300 font-bold text-sm uppercase tracking-wider">
                                            {item.term}
                                        </div>
                                    </div>
                                    <div className="text-slate-600 dark:text-slate-300 text-base leading-relaxed pl-4 rtl:pl-0 rtl:pr-4 border-l-2 rtl:border-l-0 rtl:border-r-2 border-violet-50 dark:border-slate-600 group-hover:border-violet-100 dark:group-hover:border-violet-800 transition-colors">
                                        {item.definition}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 text-slate-400 dark:text-slate-600 flex flex-col items-center">
                                <Search size={40} className="mb-2 opacity-20" />
                                <p>{t.noTerms}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* 3. Actionable Steps Tab */}
        {activeTab === 'steps' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-card border border-slate-100 dark:border-slate-800 flex flex-col animate-scale-in origin-top overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-900/10">
                    <div className="flex items-center space-x-3">
                        <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg">
                            <ClipboardList className="text-emerald-600 dark:text-emerald-400" size={22} />
                        </div>
                         <div>
                            <h3 className="text-slate-800 dark:text-white font-bold text-lg">{t.actionPlanTitle}</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">{t.actionPlanSubtitle}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => handleCopy(data.actionableSteps.map(s => `- ${s}`).join('\n'), 'steps')}
                        className="p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                        title="Copy list"
                    >
                         {copiedId === 'steps' ? <Check size={20} /> : <Copy size={20} />}
                    </button>
                </div>
                <div className="p-6 sm:p-8 flex-1 bg-gradient-to-b from-white to-emerald-50/20 dark:from-slate-900 dark:to-slate-900">
                    <ul className="space-y-4">
                        {data.actionableSteps.length > 0 ? (
                            data.actionableSteps.map((step, idx) => (
                                <li 
                                    key={idx} 
                                    className="flex items-start space-x-4 rtl:space-x-reverse bg-white dark:bg-slate-800 p-4 rounded-2xl border border-emerald-100/50 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 group opacity-0 animate-fade-in-up"
                                    style={{ animationDelay: `${idx * 150}ms` }}
                                >
                                    <div className="min-w-[28px] h-7 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold text-sm mt-0.5 shadow-sm group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                        {idx + 1}
                                    </div>
                                    <span className="text-slate-700 dark:text-slate-300 font-medium text-base pt-0.5">{step}</span>
                                </li>
                            ))
                        ) : (
                            <div className="text-center py-10 text-slate-400 dark:text-slate-600 flex flex-col items-center">
                                <ClipboardList size={40} className="mb-2 opacity-20" />
                                <p>{t.noActions}</p>
                            </div>
                        )}
                    </ul>
                </div>
            </div>
        )}

        {/* 4. Source Citation Tab */}
        {activeTab === 'citation' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-card border border-slate-200 dark:border-slate-800 p-8 animate-scale-in origin-top relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 dark:bg-slate-800 rounded-bl-full -mr-16 -mt-16 pointer-events-none opacity-50"></div>
                <div className="flex flex-col sm:flex-row items-start sm:space-x-5 rtl:sm:space-x-reverse space-y-6 sm:space-y-0 relative z-10">
                    <div className="bg-slate-100 dark:bg-slate-800 p-3.5 rounded-2xl flex-shrink-0 shadow-inner">
                         <BookOpen className="text-slate-500 dark:text-slate-400" size={26} />
                    </div>
                    <div className="flex-1 w-full">
                        <div className="flex justify-between items-start mb-4">
                             <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{t.sourceTitle}</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-lg">
                                    {t.sourceSubtitle}
                                </p>
                             </div>
                             <button 
                                onClick={() => setShowCitationModal(true)}
                                className="hidden sm:flex items-center space-x-2 rtl:space-x-reverse text-aptus-600 dark:text-aptus-300 bg-aptus-50 dark:bg-slate-800 hover:bg-aptus-100 dark:hover:bg-slate-700 px-4 py-2 rounded-xl text-sm font-bold transition-colors border border-aptus-100 dark:border-slate-700"
                             >
                                <Maximize2 size={16} />
                                <span>{t.expand}</span>
                             </button>
                        </div>
                        
                        <div className="relative group">
                            <div className="text-sm font-mono bg-slate-50/80 dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 block w-full break-words max-h-[300px] overflow-y-auto leading-relaxed shadow-inner">
                                {data.sourceCitation}
                            </div>
                            <button 
                                onClick={() => setShowCitationModal(true)}
                                className="sm:hidden w-full mt-4 flex items-center justify-center space-x-2 rtl:space-x-reverse text-aptus-700 font-semibold py-3 border border-slate-200 rounded-xl bg-white shadow-sm hover:bg-slate-50 transition-colors"
                            >
                                <Maximize2 size={16} />
                                <span>{t.readFullScreen}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

      </div>

      {/* Disclaimer */}
      <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse text-amber-600/80 dark:text-amber-500/80 text-xs mt-10 pb-4 font-medium px-4 text-center">
        <AlertTriangle size={14} className="flex-shrink-0" />
        <span>{t.disclaimer}</span>
      </div>

      {/* Full Screen Citation Modal */}
      {showCitationModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity animate-fade-in-up" 
            onClick={() => setShowCitationModal(false)}
          />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scale-in">
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 z-10">
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                    <div className="bg-aptus-50 dark:bg-slate-800 p-2.5 rounded-xl">
                        <BookOpen className="text-aptus-600 dark:text-aptus-400" size={22} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">{t.sourceTitle}</h3>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => handleCopy(data.sourceCitation, 'citation-modal')}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                         {copiedId === 'citation-modal' ? <Check size={18} /> : <Copy size={18} />}
                         <span className="hidden sm:inline">{t.copy}</span>
                    </button>
                    <button 
                        onClick={() => setShowCitationModal(false)}
                        className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>
            </div>
            <div className="p-6 sm:p-8 overflow-y-auto bg-slate-50 dark:bg-slate-950 custom-scrollbar">
                <div className="font-mono text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    {data.sourceCitation}
                </div>
            </div>
             <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end">
                <button 
                    onClick={() => setShowCitationModal(false)}
                    className="px-6 py-3 bg-slate-900 dark:bg-slate-700 text-white rounded-xl hover:bg-slate-800 dark:hover:bg-slate-600 transition-transform active:scale-95 font-semibold text-sm shadow-lg shadow-slate-900/20"
                >
                    {t.closeViewer}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsView;