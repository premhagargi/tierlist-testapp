import { useEffect, useState } from 'react';
import { showToast } from '@devvit/web/client';
import { MiscHeader } from './MiscHeader';
import { CallToActionField } from './CallToActionField';
import { ShortDescriptionField } from './ShortDescriptionField';
import { VotingExpiryField } from './VotingExpiryField';
import { SuggestionHandlingField } from './SuggestionHandlingField';
import { useListings } from '../../../hooks/useListings';

interface MiscSectionProps {
  appId: string;
}

interface LaunchItem {
  id: string;
  name: string;
}

export const MiscSection = ({ appId }: MiscSectionProps) => {
  const [callToAction, setCallToAction] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [savedExpiry, setSavedExpiry] = useState<Date | null>(null);
  const [autoApproveSuggestions, setAutoApproveSuggestions] = useState(false);

  const [featuredItem, setFeaturedItem] = useState<LaunchItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { listings, loading: listingsLoading } = useListings(appId);

  // Convert listings to LaunchItem format
  const allItems: LaunchItem[] = listings.map((listing) => ({
    id: listing.id,
    name: listing.name || 'Unnamed',
  }));

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`/api/misc/${appId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success' && data.data) {
            const d = data.data;

            setCallToAction(d.callToAction || '');
            setShortDescription(d.shortDescription || '');
            setSavedExpiry(d.expiryDate ? new Date(d.expiryDate) : null);
            if (typeof d.autoApproveSuggestions === 'boolean') {
              setAutoApproveSuggestions(d.autoApproveSuggestions);
            }

            // ✅ NEW
            if (d.featuredItem) {
              setFeaturedItem(d.featuredItem); // { id, name }
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch misc settings:', error);
      }
    };

    fetchSettings();
  }, [appId]);

  const handleSaveCTA = async () => {
    try {
      const res = await fetch(`/api/misc/${appId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callToAction }),
      });
      if (res.ok) {
        showToast({ text: 'Changes Saved', appearance: 'success' });
      } else {
        showToast('Failed to save call-to-action');
      }
    } catch (error) {
      showToast('Failed to save call-to-action');
    }
  };

  const handleSaveShortDescription = async () => {
    try {
      const res = await fetch(`/api/misc/${appId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shortDescription }),
      });
      if (res.ok) {
        showToast({ text: 'Changes Saved', appearance: 'success' });
      } else {
        showToast('Failed to save short description');
      }
    } catch (error) {
      showToast('Failed to save short description');
    }
  };

  const handleSaveSuggestionHandling = async (newFeaturedItem: LaunchItem | null) => {
    setIsSaving(true);
    // Get full listing data if featured item is selected
    const fullFeaturedItem = newFeaturedItem
      ? listings.find((l) => l.id === newFeaturedItem.id) || null
      : null;

    try {
      const res = await fetch(`/api/misc/${appId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          autoApproveSuggestions,
          featuredItemId: newFeaturedItem?.id ?? null,
          featuredItem: fullFeaturedItem, // Store full listing data (null if clearing)
        }),
      });

      if (res.ok) {
        setFeaturedItem(newFeaturedItem); // Can be null to clear
        showToast({ text: 'Settings Updated', appearance: 'success' });
      } else {
        showToast('Failed to update settings');
      }
    } catch (error) {
      console.error('[MiscSection] Error saving suggestion handling:', error);
      showToast('Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };


  const handleSaveExpiry = async (expiryDate: Date | null) => {
    try {
      const payload = { expiryDate: expiryDate ? expiryDate.toISOString() : null };
      const res = await fetch(`/api/misc/${appId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const responseData = await res.json();
        setSavedExpiry(expiryDate);
        showToast({
          text: 'Voting Window Updated',
          appearance: 'success',
        });
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error(
          '[MiscSection] Failed to save expiry, status:',
          res.status,
          'error:',
          errorData
        );
        showToast('Failed to update expiry');
      }
    } catch (error) {
      console.error('[MiscSection] Error saving expiry:', error);
      showToast('Failed to update expiry');
    }
  };

  return (
    <div className="space-y-5 px-2 sm:px-2">
      <MiscHeader />

      <div className="space-y-5">
        <CallToActionField value={callToAction} onChange={setCallToAction} onSave={handleSaveCTA} />

        <ShortDescriptionField
          value={shortDescription}
          onChange={setShortDescription}
          onSave={handleSaveShortDescription}
        />

        <VotingExpiryField savedExpiry={savedExpiry} onSave={handleSaveExpiry} />

        <SuggestionHandlingField
          allItems={allItems}
          fullListings={listings}
          featuredItem={featuredItem}
          onFeaturedChange={setFeaturedItem}
          isSaving={isSaving}
          mode={autoApproveSuggestions ? 'auto-approve' : 'admin-review'}
          onChange={(mode) => setAutoApproveSuggestions(mode === 'auto-approve')}
          onSave={handleSaveSuggestionHandling}
        />
      </div>
    </div>
  );
};
