import React from 'react';
import { Shield, X, Lock, Server, EyeOff } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: any;
}

const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose, t }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-scale-in border border-slate-100 dark:border-slate-700">
        
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center space-x-3">
                <div className="bg-aptus-100 dark:bg-aptus-900/30 p-2 rounded-lg">
                    <Shield className="text-aptus-600 dark:text-aptus-400" size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t.privacyTitle || "Data Privacy & Security"}</h3>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <X size={24} />
            </button>
        </div>

        <div className="p-6 space-y-6">
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
                {t.privacyIntro || "At Aptus AI, we prioritize the confidentiality of your documents. Because we deal with sensitive legal information, we want you to understand exactly how your data is processed."}
            </p>

            <div className="space-y-4">
                <div className="flex items-start space-x-4">
                    <Lock className="text-emerald-500 mt-1 flex-shrink-0" size={20} />
                    <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{t.privacyEncryptionTitle || "Encryption in Transit"}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {t.privacyEncryptionDesc || "All files and text are transmitted securely via SSL/TLS encryption directly to Google's enterprise-grade AI servers."}
                        </p>
                    </div>
                </div>

                <div className="flex items-start space-x-4">
                    <Server className="text-blue-500 mt-1 flex-shrink-0" size={20} />
                    <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{t.privacyProcessingTitle || "AI Processing"}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {t.privacyProcessingDesc || "Data is processed by Google Gemini 2.5. Aptus does not store your documents on our own permanent servers after the session ends."}
                        </p>
                    </div>
                </div>

                <div className="flex items-start space-x-4">
                    <EyeOff className="text-amber-500 mt-1 flex-shrink-0" size={20} />
                    <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{t.privacyDisclaimerTitle || "Automated Interpretation"}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {t.privacyDisclaimerDesc || "Aptus is an automated tool, not a lawyer. Do not use this tool for privileged attorney-client communications without professional oversight."}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end">
            <button 
                onClick={onClose}
                className="px-6 py-2.5 bg-aptus-600 text-white rounded-xl hover:bg-aptus-700 transition-colors font-semibold text-sm shadow-lg shadow-aptus-500/20"
            >
                {t.acknowledge || "I Understand"}
            </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyModal;