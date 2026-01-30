import { FormEvent, useState } from 'react';
import { showToast } from '@devvit/web/client';
import { Moderator } from '../../../../shared/types/api';
import { useModerators } from '../../../hooks/useModerators';
import { LoadingSpinner } from '../../LoadingSpinner';
import { ModsAddForm } from './ModsAddForm';
import { ModsErrorAlert } from './ModsErrorAlert';
import { ModsHeader } from './ModsHeader';
import { ModsList } from './ModsList';
import { DeleteDialog } from '../../DeleteDialog';

interface ModsSectionProps {
  appId: string;
  currentUsername?: string | null;
  installerUsername?: string | null;
}

export const ModsSection = ({ appId, currentUsername, installerUsername }: ModsSectionProps) => {
  const {
    moderators,
    subreddit,
    loading,
    error,
    adding,
    removingId,
    addModerator,
    removeModerator,
  } = useModerators(appId, currentUsername, installerUsername);
  const [username, setUsername] = useState('');
  const [confirmModerator, setConfirmModerator] = useState<Moderator | null>(null);

  const handleAdd = async (event: FormEvent) => {
    event.preventDefault();

    // Validate username format - Reddit usernames are alphanumeric, underscore, and hyphen only
    const trimmedUsername = username.trim().replace(/^u\//, ''); // Remove u/ prefix if present

    if (!trimmedUsername) {
      showToast('Please enter a username.');
      return;
    }

    // Reddit username validation: 3-20 characters, alphanumeric, underscore, hyphen
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!usernameRegex.test(trimmedUsername)) {
      showToast('Invalid username');
      return;
    }

    const success = await addModerator(trimmedUsername);
    if (success) {
      setUsername('');
      showToast({ text: 'Admin Added', appearance: 'success' });
    } else {
      showToast('Failed to add admin. Please try again.');
    }
  };

  const handleRemove = async (id: string) => {
    const ok = await removeModerator(id);

    if (!ok) {
      showToast('Failed to remove moderator. Please try again.');
    } else {
      showToast({ text: 'Admin Removed', appearance: 'success' });
      setConfirmModerator(null);
    }
  };

  if (loading) {
    return <LoadingSpinner size={40} centered />;
  }

  return (
    <div className="space-y-5 px-2 sm:px-2">
      <ModsHeader />

      {error && <ModsErrorAlert message={error} />}

      <ModsAddForm
        username={username}
        onUsernameChange={setUsername}
        onSubmit={handleAdd}
        submitting={adding}
      />

      <ModsList
        moderators={moderators}
        subreddit={subreddit}
        onRequestRemove={setConfirmModerator}
        removingId={removingId}
        showEmptyState={!error}
        installerUsername={installerUsername ?? null}
      />

      {confirmModerator && (
        <DeleteDialog
          isOpen={Boolean(confirmModerator)}
          onClose={() => setConfirmModerator(null)}
          title="Remove Admin"
          message="Are you sure you want to remove {itemName} from admin list."
          itemName={`u/${confirmModerator.username}`}
          onConfirm={async () => {
            if (confirmModerator) {
              await handleRemove(confirmModerator.id);
            }
          }}
          isDeleting={removingId === confirmModerator.id}
          confirmLabel="Remove"
        />
      )}
    </div>
  );
};
