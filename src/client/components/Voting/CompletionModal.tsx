import { X } from 'lucide-react';

export interface CompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuggest: () => void;
}

export const CompletionModal = ({ isOpen, onClose, onSuggest }: CompletionModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-white/20 bg-[#0b0f11] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)] text-center transform transition-all scale-100">
        <button
          onClick={onClose}
          type="button"
          className="absolute top-3 right-3 h-8 w-8 flex items-center justify-center rounded-full border border-white/30 text-slate-100 hover:text-white hover:border-white transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="mb-4 flex justify-center gap-3">
          
          <h2 className="text-2xl font-extrabold text-white mb-4 tracking-tight">
          You’ve ranked ‘em all!
        </h2>
        <span className="text-2xl" role="img" aria-label="trophy">
            🏆
          </span>
        </div>

        

        <p className="text-gray-300 text-md leading-relaxed mb-8">
          You’ve voted on all the items. Help grow the list - add anything that’s missing.
        </p>

        <button
          onClick={() => {
            onClose();
            onSuggest();
          }}
          className="w-full py-3.5 px-6 bg-white text-black font-bold text-lg rounded-full hover:bg-gray-100 active:scale-95 transition-all"
        >
          Suggest an Item
        </button>
      </div>
    </div>
  );
};
