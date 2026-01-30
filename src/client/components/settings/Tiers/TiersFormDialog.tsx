import { useEffect, useRef, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Dialog } from '../../Dialog';

interface TiersFormDialogProps {
  isOpen: boolean;
  isEditing: boolean;
  initialName?: string;
  initialColour?: string;
  onClose: () => void;
  onSubmit: (name: string, colour: string) => Promise<void>;
  submitting: boolean;
}

export const TiersFormDialog = ({
  isOpen,
  isEditing,
  initialName = '',
  initialColour = '#FF6B6B',
  onClose,
  onSubmit,
  submitting,
}: TiersFormDialogProps) => {
  const [name, setName] = useState(initialName);
  const [colour, setColour] = useState(initialColour);
  const [showPicker, setShowPicker] = useState(false);
  const colorFieldRef = useRef<HTMLDivElement | null>(null);

  const handleHexInput = (value: string) => {
    const next = value.startsWith('#') ? value : `#${value}`;
    setColour(next);
  };

  const handleHexPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text')?.trim();
    if (pasted) {
      handleHexInput(pasted);
      setShowPicker(true);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setColour(initialColour);
      setShowPicker(false);
    }
  }, [initialColour, initialName, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (!showPicker) return;
      const target = event.target as Node | null;
      if (colorFieldRef.current && target && !colorFieldRef.current.contains(target)) {
        setShowPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showPicker]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(name, colour);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Tier' : 'Add Tier'}
      maxWidth="md"
    >
      <p className="text-sm text-slate-300">Set the tier name and pick a color.</p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
            <span>Tier Name</span>
            <span className="text-slate-400">{name.length}/25</span>
          </div>
          <input
            type="text"
            value={name}
            maxLength={25}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-white/70 bg-transparent px-3 py-3 text-white placeholder:text-slate-400 focus:border-white focus:outline-none focus:ring-0 cursor-text"
            placeholder="Evergreen Movie"
            required
          />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-200">Tier Color</span>
          <div ref={colorFieldRef} className="relative bg-transparent">
            <div className="flex items-center gap-2">
              <div
                className="h-11 w-11 rounded-lg border border-white/70 shadow-inner cursor-pointer"
                style={{
                  backgroundColor: colour,
                }}
                role="button"
                aria-label="Open color picker"
                tabIndex={0}
                onClick={() => setShowPicker(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setShowPicker(true);
                  }
                }}
              />
              <input
                type="text"
                value={colour}
                onChange={(e) => handleHexInput(e.target.value)}
                onFocus={() => setShowPicker(true)}
                onClick={() => setShowPicker(true)}
                onPaste={handleHexPaste}
                className="flex-1 h-11 rounded-md border border-white/70 bg-transparent px-3 text-sm text-white placeholder:text-slate-400 focus:border-white focus:outline-none focus:ring-0 cursor-text"
                placeholder="#ff6b6b"
                aria-label="Tier hex color"
              />
            </div>

            {showPicker && (
              <div className="absolute left-1/2 bottom-full z-10 w-[240px] max-w-[calc(100%-16px)] -translate-x-1/2 mb-3 rounded-xl border border-white/20 bg-[#0b0f11] p-3 shadow-[0_20px_40px_rgba(0,0,0,0.45)]">
                <HexColorPicker color={colour} onChange={setColour} className="w-full" />
              </div>
            )}
          </div>
        </div>

        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-white px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/5 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="allow-white-bg flex-1 rounded-full border border-white px-4 py-2.5 text-sm font-semibold text-black shadow-[0_10px_30px_-12px_rgba(0,0,0,0.5)] transition disabled:cursor-wait disabled:opacity-70 cursor-pointer"
          >
            {submitting ? 'Saving…' : isEditing ? 'Update' : 'Save'}
          </button>
        </div>
      </form>
    </Dialog>
  );
};
