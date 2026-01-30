import { Dialog } from './Dialog';

interface DeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  itemName: string;
  tip?: string;
  onConfirm: () => void | Promise<void>;
  isDeleting?: boolean;
  confirmLabel?: string;
}

export const DeleteDialog = ({
  isOpen,
  onClose,
  title,
  message,
  itemName,
  tip,
  onConfirm,
  isDeleting = false,
  confirmLabel = 'Delete',
}: DeleteDialogProps) => {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-2">
        <p className="text-sm text-slate-200 leading-6">
          {message.includes('{itemName}') ? (
            <>
              {message.split('{itemName}').map((part, index, array) => (
                <span key={index}>
                  {part}
                  {index < array.length - 1 && <span className="font-semibold">"{itemName}"</span>}
                </span>
              ))}
            </>
          ) : (
            <>
              {message} <span className="font-semibold">"{itemName}"</span>
            </>
          )}
        </p>
        {tip && (
          <div className="rounded-lg border border-white/30 bg-[#3a3b3d] px-3 py-2 text-sm text-slate-100">
            <span className="font-semibold">Tip:</span> {tip}
          </div>
        )}
      </div>

      <div className="mt-5 flex justify-between gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-full border border-white px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/5 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={isDeleting}
          onClick={handleConfirm}
          className="flex-1 rounded-full px-4 py-2.5 text-sm font-semibold text-[#0b0f11] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.5)] transition disabled:opacity-70 disabled:cursor-wait cursor-pointer"
          style={{ backgroundColor: '#ff7f7f' }}
        >
          {isDeleting ? 'Deleting…' : confirmLabel}
        </button>
      </div>
    </Dialog>
  );
};
