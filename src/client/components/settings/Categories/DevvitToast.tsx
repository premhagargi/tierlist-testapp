import { useEffect } from 'react';

export type DevvitToastType = 'info' | 'error';

interface DevvitToastProps {
  message: string;
  type?: DevvitToastType;
  onClose: () => void;
  duration?: number;
}

export const DevvitToast = ({
  message,
  type = 'info',
  onClose,
  duration = 3000,
}: DevvitToastProps) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const toneStyles =
    type === 'error'
      ? 'bg-[#2a0f12] border-[#ff7373] text-[#ffdcdc]'
      : 'bg-[#0f1a23] border-[#5D6263] text-slate-100';

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <div
        className={`min-w-[240px] max-w-md rounded-2xl border px-4 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.45)] ${toneStyles}`}
      >
        <p className="text-sm font-semibold">{message}</p>
      </div>
    </div>
  );
};
