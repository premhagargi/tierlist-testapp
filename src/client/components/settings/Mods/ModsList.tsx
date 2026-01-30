import { Moderator } from '../../../../shared/types/api';
import { ModCard } from './ModCard';

interface ModsListProps {
  moderators: Moderator[];
  subreddit: string | null;
  onRequestRemove: (moderator: Moderator) => void | Promise<void>;
  removingId: string | null;
  showEmptyState?: boolean;
  installerUsername?: string | null;
}

export const ModsList = ({
  moderators,
  subreddit,
  onRequestRemove,
  removingId,
  showEmptyState = true,
  installerUsername,
}: ModsListProps) => {
  if (!moderators.length && showEmptyState) {
    return <p className="text-center text-slate-400 py-8">No admins added yet.</p>;
  }

  return (
    <div className="mt-3 shadow-sm overflow-hidden">
      <div className="divide-y divide-[#5D6263] bg-transparent">
        {subreddit && (
          <div className="flex items-center gap-3 px-2 py-2 bg-white/5">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-100">r/{subreddit}</p>
            </div>
            <span className="rounded-full border border-amber-500/80 px-2 py-1 text-[11px] font-semibold text-amber-300 bg-amber-500/10">
              Subreddit Moderators
            </span>
          </div>
        )}
        {moderators.map((moderator) => (
          <ModCard
            key={moderator.id}
            moderator={moderator}
            onRequestRemove={onRequestRemove}
            removing={removingId === moderator.id}
            isInstaller={Boolean(
              installerUsername &&
                moderator.username.toLowerCase() === installerUsername.toLowerCase()
            )}
          />
        ))}
      </div>
    </div>
  );
};
