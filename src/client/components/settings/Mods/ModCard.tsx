import { Trash, UserRound } from 'lucide-react';
import { Moderator } from '../../../../shared/types/api';

interface ModCardProps {
  moderator: Moderator;
  onRequestRemove: (moderator: Moderator) => void | Promise<void>;
  removing: boolean;
  isInstaller?: boolean;
}

export const ModCard = ({
  moderator,
  onRequestRemove,
  removing,
  isInstaller = false,
}: ModCardProps) => (
  <div className="flex items-center gap-3 px-2 py-2 transition-colors hover:bg-white/5">
    <div className="text-slate-200">
      <UserRound size={18} />
    </div>

    <div className="flex-1 min-w-0">
      <p className="font-semibold text-slate-100 truncate">u/{moderator.username}</p>
    </div>

    {isInstaller && (
      <span className="rounded-full border border-[#5D6263] px-2 py-1 text-[11px] font-semibold text-slate-200">
        Installer
      </span>
    )}

    <button
      type="button"
      onClick={() => {
        void onRequestRemove(moderator);
      }}
      disabled={removing || isInstaller}
      className="p-1.5 text-slate-300 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      aria-label={
        isInstaller ? `${moderator.username} is the installer` : `Remove ${moderator.username}`
      }
      title={isInstaller ? 'Installer cannot be removed' : undefined}
    >
      <Trash size={18} />
    </button>
  </div>
);
