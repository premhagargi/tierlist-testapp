import { useState, useEffect, useMemo } from 'react';
import { showToast } from '@devvit/web/client';
import { useAuthStatus } from '../hooks/useAuthStatus';
import { useAppId } from '../hooks/useAppId';
import { Navbar } from '../components/Navbar';
import { PageLoader } from '../components/PageLoader';
import { HomePage } from '../pages/HomePage';
import { SettingsPage } from '../pages/SettingsPage';
import { ModQueuePage } from '../pages/ModQueuePage';
import { VotingPage } from '../pages/VotingPage';
import { TermsPage } from '../pages/TermsPage';
import { PrivacyPage } from '../pages/PrivacyPage';
import { useModerators } from '../hooks/useModerators';
import { useSuggestions } from '../hooks/useSuggestions';
import { useCategories } from '../hooks/useCategories';
import { useListings } from '../hooks/useListings';
import { SuggestionFormDialog } from '../components/modqueue/Suggestions/SuggestionFormDialog';
import { Listing } from '../../shared/types/api';

type Page = 'home' | 'voting' | 'tierList' | 'profile' | 'settings' | 'modQueue' | 'terms' | 'privacy';

export const App = () => {
  const auth = useAuthStatus();
  const { authenticated, displayName, avatarUrl, karma, loading, userId, username } = auth;
  const { appId, installerUsername, loading: appLoading, error: appError } = useAppId();
  const { isModerator, loading: moderatorsLoading } = useModerators(
    appId || '',
    username,
    installerUsername
  );

  const [currentPage, setCurrentPage] = useState<Page>('home');

  const [showNavSuggestion, setShowNavSuggestion] = useState(false);
  const [navSubmitting, setNavSubmitting] = useState(false);
  const addSuggestionRequestId = 0;

  const { categories, refetch: refetchCategories } = useCategories(appId || '');
  const { listings, fetchListings } = useListings(appId || '');
  const { createSuggestion } = useSuggestions(appId || '');
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);

  useEffect(() => {
    if (!appId) return;
    const fetchSettings = async () => {
      try {
        const res = await fetch(`/api/misc/${appId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success' && data.data?.expiryDate) {
            setExpiryDate(new Date(data.data.expiryDate));
          }
        }
      } catch (error) {
        console.error('Failed to fetch settings', error);
      }
    };
    fetchSettings();
  }, [appId]);

  const isExpired = useMemo(() => {
    if (!expiryDate) return false;
    return new Date() > expiryDate;
  }, [expiryDate]);

  useEffect(() => {
    if (showNavSuggestion) {
      refetchCategories();
      fetchListings();
    }
  }, [showNavSuggestion, refetchCategories, fetchListings]);

  const otherCategories = useMemo(() => {
    return Array.from(new Set(
      listings
        .filter((l: Listing) => l.category && l.category.startsWith('Others - '))
        .map((l: Listing) => l.category as string)
    )).sort();
  }, [listings]);


  if (loading || appLoading || !authenticated || !appId) {
    return <PageLoader />;
  }

  if (appError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0E1113] text-[--color-text] px-4 text-center">
        <div className="space-y-2 max-w-md">
          <h1 className="text-xl font-bold text-[--color-text]">App unavailable</h1>
          <p className="text-sm text-[--color-text-subtle]">{appError}</p>
        </div>
      </div>
    );
  }

  const handleNavigate = (page: Page) => {
    const restricted = page === 'settings' || page === 'modQueue';
    if (restricted && !moderatorsLoading && !isModerator) {
      alert('Only moderators can access this area.');
      return;
    }

    const targetPage = page === 'tierList' ? 'home' : page;
    setCurrentPage(targetPage);
  };



  const renderPage = () => {
    switch (currentPage) {
      case 'settings':
        return (
          <SettingsPage
            appId={appId}
            username={username}
            canModerate={isModerator}
            checkingModerator={moderatorsLoading}
            installerUsername={installerUsername ?? null}
          />
        );
      case 'modQueue':
        return (
          <ModQueuePage
            displayName={displayName}
            appId={appId}
            addSuggestionRequestId={addSuggestionRequestId}
            canModerate={isModerator}
            checkingModerator={moderatorsLoading}
          />
        );
      case 'voting':
        return (
          <VotingPage
            displayName={displayName}
            avatarUrl={avatarUrl}
            userId={userId}
            appId={appId}
          />
        );
      case 'terms':
        return <TermsPage />;
      case 'privacy':
        return <PrivacyPage />;
      case 'home':
      case 'profile':
      case 'tierList':
      default:
        return (
          <HomePage
            displayName={displayName}
            avatarUrl={avatarUrl}
            appId={appId}
            userId={userId}
            onStartVoting={() => handleNavigate('voting')}
            onViewTierList={() => handleNavigate('tierList')}
          />
        );
    }
  };

  const canModerate = !moderatorsLoading && isModerator;

  return (
    <div className="bg-[#0E1113] text-white min-h-screen">
      <Navbar
        currentScreen={currentPage}
        onNavigate={handleNavigate}
        canModerate={canModerate}
        statsLabel={karma ? `${karma.total.toLocaleString()} Votes` : 'Votes'}
        onSuggestItem={() => setShowNavSuggestion(true)}
        isExpired={isExpired}
      />
      <div className="pt-8">{renderPage()}</div>

      <SuggestionFormDialog
        isOpen={showNavSuggestion}
        isEditing={false}
        categories={categories}
        otherCategories={otherCategories}
        initialValues={undefined}
        submitting={navSubmitting}
        onClose={() => setShowNavSuggestion(false)}
        onSubmit={async (values) => {
          setNavSubmitting(true);
          const created = await createSuggestion({
            ...values,
            url: values.url || '',
            notes: values.notes || '',
            customCategory: values.customCategory || ''
          });
          setNavSubmitting(false);
          if (created) {
            setShowNavSuggestion(false);
            showToast({ text: 'Submitted Sucessfully', appearance: 'success' });
          } else {
            showToast('Failed to suggest item. Please try again.');
          }
        }}
        titleOverride="Suggest an Item"
        subtitleOverride="Upload an image, name it, and place it in a category. We'll route it to moderators."
      />
    </div>
  );
};
