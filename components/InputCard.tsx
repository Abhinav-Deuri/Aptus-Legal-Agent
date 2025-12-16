import React, { useRef, useState, useEffect, useMemo } from 'react';
import { UploadCloud, FileText, X, Camera, Image as ImageIcon, Scale, File as FileIcon, AlertCircle, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { InputState } from '../types';

interface InputCardProps {
  inputState: InputState;
  setInputState: React.Dispatch<React.SetStateAction<InputState>>;
  onSubmit: () => void;
  isLoading: boolean;
  t: any; // Translation object
}

const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const getFileId = (file: File) => `${file.name}-${file.size}-${file.lastModified}`;

const FilePreview: React.FC<{ 
  file: File; 
  progress: number; 
  onRemove: () => void; 
}> = ({ file, progress, onRemove }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const isImage = file.type.startsWith('image/');
  const isUploading = progress < 100;

  useEffect(() => {
    if (isImage) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file, isImage]);

  const fileType = useMemo(() => {
    const extension = file.type.split('/')[1];
    if (file.type === 'application/pdf') return 'PDF';
    if (file.type === 'text/plain') return 'TXT';
    if (extension === 'jpeg') return 'JPG';
    return extension ? extension.toUpperCase() : 'FILE';
  }, [file]);

  return (
    <div className="relative group w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm bg-slate-50 dark:bg-slate-800 flex items-center justify-center animate-scale-in">
      {isImage && previewUrl ? (
        <img 
          src={previewUrl} 
          alt="preview" 
          className={`w-full h-full object-cover transition-all duration-500 ${isUploading ? 'blur-sm scale-105' : 'group-hover:scale-110'}`}
        />
      ) : (
        <div className={`flex flex-col items-center justify-center p-2 text-slate-400 dark:text-slate-500 transition-all ${isUploading ? 'opacity-50' : 'group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>
           {fileType === 'PDF' && <FileText size={32} className="text-red-500 dark:text-red-400" />}
           {fileType === 'TXT' && <FileText size={32} className="text-slate-500 dark:text-slate-400" />}
           {!['PDF', 'TXT'].includes(fileType) && <FileIcon size={32} className="text-aptus-500 dark:text-aptus-400" />}
        </div>
      )}
      
      {/* Uploading Overlay */}
      {isUploading && (
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-2 z-10">
           <Loader2 size={20} className="text-white animate-spin mb-1" />
           <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
             <div 
               className="h-full bg-aptus-400 transition-all duration-300 ease-out" 
               style={{ width: `${progress}%` }} 
             />
           </div>
        </div>
      )}

      {/* Success Badge */}
      {!isUploading && (
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-4 opacity-0 group-hover:opacity-100 transition-opacity flex justify-center z-10">
           <span className="text-[10px] font-bold text-white uppercase tracking-wider">{fileType}</span>
        </div>
      )}

      {!isUploading && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute top-1 right-1 rtl:right-auto rtl:left-1 bg-white/90 text-slate-500 p-1 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-sm opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0 z-20"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
};

const InputCard: React.FC<InputCardProps> = ({ inputState, setInputState, onSubmit, isLoading, t }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [dragActive, setDragActive] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      if (isCameraOpen) {
        setCameraError(null);
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error("Camera access error:", err);
          setCameraError(t.cameraError);
        }
      }
    };
    startCamera();
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [isCameraOpen, t.cameraError]);

  const simulateUpload = (file: File) => {
    const fileId = getFileId(file);
    setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
    const sizeFactor = Math.min(file.size / (1024 * 1024), 20);
    const tickRate = 50 + (sizeFactor * 10); 
    const increment = 100 / (20 + (sizeFactor * 5));

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        const current = prev[fileId] ?? 0;
        if (current >= 100) {
          clearInterval(interval);
          return { ...prev, [fileId]: 100 };
        }
        const next = Math.min(current + increment + (Math.random() * 5), 100);
        return { ...prev, [fileId]: next };
      });
    }, tickRate);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFiles = (files: File[]) => {
    setValidationErrors([]);
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.push(`"${file.name}" exceeds ${MAX_FILE_SIZE_MB}MB.`);
        return;
      }
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';
      const isTxt = file.type === 'text/plain';

      if (isImage || isPdf || isTxt) {
        validFiles.push(file);
        simulateUpload(file);
      } else {
        errors.push(`"${file.name}" is not supported.`);
      }
    });
    
    if (errors.length > 0) setValidationErrors(errors);
    if (validFiles.length > 0) {
      setInputState(prev => ({ ...prev, files: [...prev.files, ...validFiles] }));
    }
  };

  const removeFile = (index: number) => {
    const fileToRemove = inputState.files[index];
    if (fileToRemove) {
      const id = getFileId(fileToRemove);
      setUploadProgress(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
    setInputState(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const capturePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
            handleFiles([file]);
            setIsCameraOpen(false);
          }
        }, 'image/jpeg', 0.95);
      }
    }
  };

  const toggleCamera = (e: React.MouseEvent) => {
    e.stopPropagation();
    setValidationErrors([]);
    setCameraError(null);
    setIsCameraOpen(!isCameraOpen);
  };

  // Keyboard accessibility handler for the upload area
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !isCameraOpen) {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  const hasContent = inputState.text.trim().length > 0 || inputState.files.length > 0;
  const isUploading = inputState.files.some(f => (uploadProgress[getFileId(f)] ?? 0) < 100);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-card border border-white/50 dark:border-slate-800 backdrop-blur-sm overflow-hidden mb-8 transition-colors hover:shadow-2xl duration-500">
      <div className="p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
                <span className="bg-aptus-100 dark:bg-slate-800 p-2 rounded-lg text-aptus-600 dark:text-aptus-400 mr-3">
                    <FileText size={20} />
                </span>
                {t.docInputTitle}
            </h2>
            {inputState.files.length > 0 && (
                <span className="text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full animate-scale-in flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    {inputState.files.length} {t.filesAttached}
                </span>
            )}
        </div>

        {/* Upload / Camera Area */}
        <div
          role="button"
          tabIndex={!isCameraOpen ? 0 : -1}
          aria-label={t.uploadDesc}
          className={`relative group rounded-2xl transition-all duration-300 ease-out flex flex-col items-center justify-center text-center mb-6 overflow-hidden min-h-[220px] focus:outline-none focus:ring-4 focus:ring-aptus-200 dark:focus:ring-aptus-800
            ${isCameraOpen 
              ? "bg-black p-0 h-[450px]" 
              : dragActive 
                ? "bg-aptus-50 dark:bg-slate-800/50 border-2 border-dashed border-aptus-500 scale-[1.01]" 
                : "bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-aptus-300 dark:hover:border-aptus-500 hover:bg-aptus-50/30 dark:hover:bg-slate-800"
            }`}
          onDragEnter={!isCameraOpen ? handleDrag : undefined}
          onDragLeave={!isCameraOpen ? handleDrag : undefined}
          onDragOver={!isCameraOpen ? handleDrag : undefined}
          onDrop={!isCameraOpen ? handleDrop : undefined}
          onClick={!isCameraOpen ? () => fileInputRef.current?.click() : undefined}
          onKeyDown={handleKeyDown}
        >
          {isCameraOpen ? (
            <div className="relative w-full h-full flex flex-col items-center justify-center bg-black">
              {cameraError ? (
                <div className="p-6 text-center">
                  <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
                  <p className="text-white text-lg font-bold mb-2">{t.cameraUnavailable}</p>
                  <p className="text-gray-400 mb-6">{cameraError}</p>
                  <button 
                    onClick={() => setIsCameraOpen(false)}
                    className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-full transition-colors"
                  >
                    {t.close}
                  </button>
                </div>
              ) : (
                <>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  <div className="absolute bottom-8 flex items-center gap-8 z-10">
                    <button 
                      onClick={toggleCamera} 
                      className="bg-white/10 backdrop-blur-md p-4 rounded-full text-white hover:bg-white/20 transition-all border border-white/10"
                    >
                      <X size={24} />
                    </button>
                    <button 
                      onClick={capturePhoto} 
                      className="bg-white p-5 rounded-full text-aptus-600 shadow-glow hover:scale-110 active:scale-95 transition-all border-4 border-aptus-500/30"
                    >
                      <Camera size={32} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center p-8 transition-transform duration-300 group-hover:-translate-y-1">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*, .pdf, .txt"
                multiple
                onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
              />
              <div className="relative mb-4">
                 <div className="absolute inset-0 bg-aptus-400 blur-xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
                 <div className="relative bg-white dark:bg-slate-700 p-4 rounded-2xl shadow-lg text-aptus-500 dark:text-aptus-400 group-hover:text-aptus-600 dark:group-hover:text-aptus-300 group-hover:scale-110 transition-all duration-300">
                    <UploadCloud size={32} />
                 </div>
              </div>
              <p className="text-slate-800 dark:text-slate-200 font-bold text-lg mb-1">{t.uploadTitle}</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm mb-6 max-w-xs">{t.uploadDesc}</p>
              
              <div className="flex gap-3 relative z-10">
                 <div className="relative group/tooltip">
                   <button 
                     tabIndex={-1}
                     className="flex items-center space-x-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-600 hover:border-slate-300 dark:hover:border-slate-500 transition-all shadow-sm hover:shadow-md"
                     onClick={(e) => {
                       e.stopPropagation();
                       fileInputRef.current?.click();
                     }}
                   >
                     <FileIcon size={16} />
                     <span>{t.browse}</span>
                   </button>
                 </div>

                 <div className="relative group/tooltip">
                   <button 
                     tabIndex={-1}
                     className="flex items-center space-x-2 bg-aptus-50 dark:bg-slate-800 text-aptus-700 dark:text-aptus-300 border border-aptus-200 dark:border-slate-700 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-aptus-100 dark:hover:bg-slate-700 hover:border-aptus-300 dark:hover:border-slate-600 transition-all shadow-sm hover:shadow-md"
                     onClick={toggleCamera}
                   >
                     <Camera size={16} />
                     <span>{t.camera}</span>
                   </button>
                 </div>
              </div>
            </div>
          )}
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 rounded-xl p-4 animate-scale-in">
            <div className="flex items-start space-x-3 text-red-600 dark:text-red-400">
              <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-bold mb-1">{t.uploadIssue}</p>
                <ul className="list-disc list-inside space-y-1 text-red-500 dark:text-red-300 opacity-90">
                  {validationErrors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* File Previews */}
        {inputState.files.length > 0 && (
          <div className="flex flex-wrap gap-4 mb-8">
            {inputState.files.map((file, idx) => (
              <FilePreview 
                key={getFileId(file)} 
                file={file} 
                progress={uploadProgress[getFileId(file)] ?? 0}
                onRemove={() => removeFile(idx)}
              />
            ))}
          </div>
        )}

        {/* Text Input */}
        <div className="relative mb-8">
          <textarea
            value={inputState.text}
            onChange={(e) => setInputState(prev => ({ ...prev, text: e.target.value }))}
            placeholder={t.textPlaceholder}
            className="w-full min-h-[140px] p-5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-aptus-200 dark:focus:ring-aptus-900 focus:border-aptus-400 dark:focus:border-aptus-600 transition-all outline-none resize-none text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 text-base leading-relaxed"
          />
          <div className="absolute bottom-4 right-4 pointer-events-none rtl:left-4 rtl:right-auto">
             <div className="bg-white/50 dark:bg-slate-700/50 backdrop-blur px-2 py-1 rounded text-xs text-slate-400 dark:text-slate-400 font-medium border border-slate-100 dark:border-slate-600">{t.textInputLabel}</div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={onSubmit}
          disabled={!hasContent || isLoading || isUploading}
          className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center space-x-3 group relative overflow-hidden ${
            isLoading || isUploading
              ? "text-white cursor-wait shadow-lg shadow-aptus-500/25" 
              : hasContent
                ? "text-white shadow-lg shadow-aptus-500/25 hover:shadow-aptus-500/40 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                : "bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed"
          }`}
        >
          {(hasContent || isLoading || isUploading) && (
            <div className={`absolute inset-0 bg-gradient-to-r from-aptus-600 to-violet-600 transition-all duration-300 ${
              isLoading || isUploading
                ? "animate-gradient-x animate-pulse bg-[length:200%_200%]" 
                : "group-hover:scale-105"
            }`} />
          )}
          
          <div className="relative flex items-center space-x-2">
            {isLoading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 rtl:ml-2 rtl:mr-0" />
                <span>{t.analyzing}</span>
              </>
            ) : isUploading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 rtl:ml-2 rtl:mr-0" />
                <span>{t.processingUploads}</span>
              </>
            ) : (
              <>
                <Scale size={22} className="group-hover:rotate-12 transition-transform duration-300 rtl:flip-x" />
                <span>{t.interpretButton}</span>
                <ArrowRight size={18} className="opacity-70 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform rtl:rotate-180" />
              </>
            )}
          </div>
        </button>
      </div>
    </div>
  );
};

export default InputCard;