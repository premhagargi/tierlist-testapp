import { Router } from 'express';
import { redis } from '@devvit/web/server';
import { scheduleBufferedNotification } from '../helpers/notifications';
import { Suggestion, SuggestionsResponse, SuggestionStatus, Listing } from '../../shared/types/api';

const router = Router();

const SUGGESTIONS_KEY_PREFIX = 'suggestions';
const LISTINGS_KEY_PREFIX = 'listings';

const getSuggestionsKey = (appId: string) => `${SUGGESTIONS_KEY_PREFIX}:${appId}`;
const getListingsKey = (appId: string) => `${LISTINGS_KEY_PREFIX}:${appId}`;

export const readSuggestions = async (appId: string): Promise<Suggestion[]> => {
  const key = getSuggestionsKey(appId);
  let data = await redis.get(key);

  if (!data) {
    data = JSON.stringify([]);
    await redis.set(key, data);
  }

  return JSON.parse(data) as Suggestion[];
};

const writeSuggestions = async (appId: string, suggestions: Suggestion[]): Promise<void> => {
  const key = getSuggestionsKey(appId);
  await redis.set(key, JSON.stringify(suggestions));
};

const readListings = async (appId: string): Promise<Listing[]> => {
  const key = getListingsKey(appId);
  let data = await redis.get(key);

  if (!data) {
    data = JSON.stringify([]);
    await redis.set(key, data);
  }

  return JSON.parse(data) as Listing[];
};

const writeListings = async (appId: string, listings: Listing[]): Promise<void> => {
  const key = getListingsKey(appId);
  await redis.set(key, JSON.stringify(listings));
};

const isValidStatus = (status: string): status is SuggestionStatus => {
  return status === 'pending' || status === 'approved' || status === 'rejected';
};

/**
 * Get all suggestions for a specific app
 */
router.get<{ appId: string }, SuggestionsResponse>(
  '/suggestions/:appId',
  async (req, res): Promise<void> => {
    try {
      const { appId } = req.params;
      const suggestions = await readSuggestions(appId);

      res.json({
        status: 'success',
        data: suggestions,
      });
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch suggestions',
      });
    }
  }
);

/**
 * Create a new suggestion for a specific app
 */
router.post<{ appId: string }, SuggestionsResponse>(
  '/suggestions/:appId',
  async (req, res): Promise<void> => {
    try {
      const { appId } = req.params;
      const { name, imageUrl, url, notes, customCategory, categoryId } = req.body as {
        name?: string;
        imageUrl?: string;
        url?: string;
        notes?: string;
        customCategory?: string;
        categoryId?: string;
      };

      if (!imageUrl || !imageUrl.trim()) {
        res.status(400).json({
          status: 'error',
          message: 'Image URL is required',
        });
        return;
      }

      const suggestions = await readSuggestions(appId);

      const now = new Date().toISOString();
      const trimmedUrl = url?.trim();
      const trimmedNotes = notes?.trim();
      const trimmedCustomCategory = customCategory?.trim();

      // Read misc settings to determine auto-approve behavior
      const miscKey = `misc:${appId}`;
      const miscData = await redis.get(miscKey);
      let autoApproveSuggestions = false;
      if (miscData) {
        try {
          const parsed = JSON.parse(miscData) as { autoApproveSuggestions?: boolean };
          autoApproveSuggestions = Boolean(parsed.autoApproveSuggestions);
        } catch {
          autoApproveSuggestions = false;
        }
      }

      const newSuggestion: Suggestion = {
        id: `suggestion-${Date.now()}`,
        appId,
        name: name?.trim() || '',
        imageUrl: imageUrl.trim(),
        categoryId: categoryId?.trim() || '__others__',
        status: autoApproveSuggestions ? 'approved' : 'pending',
        autoApproved: autoApproveSuggestions,
        createdAt: now,
        updatedAt: now,
        ...(trimmedUrl ? { url: trimmedUrl } : {}),
        ...(trimmedNotes ? { notes: trimmedNotes } : {}),
        ...(trimmedCustomCategory ? { customCategory: trimmedCustomCategory } : {}),
      };

      suggestions.push(newSuggestion);
      await writeSuggestions(appId, suggestions);

      // Trigger buffered notification (increment count and schedule if needed)
      await scheduleBufferedNotification(appId);

      // If auto-approve is enabled, immediately create a listing entry
      if (autoApproveSuggestions) {
        const listings = await readListings(appId);

        let categoryDisplay: string | undefined;
        if (newSuggestion.categoryId === '__others__') {
          categoryDisplay = newSuggestion.customCategory
            ? `Others - ${newSuggestion.customCategory}`
            : 'Others';
        }

        const newListing: Listing = {
          id: `listing-${Date.now()}`,
          appId,
          name: newSuggestion.name && newSuggestion.name.trim() ? newSuggestion.name.trim() : '',
          imageUrl: newSuggestion.imageUrl,
          categoryId: newSuggestion.categoryId,
          category: categoryDisplay,
          url: newSuggestion.url,
          createdAt: now,
          updatedAt: now,
          votes: {},
          totalVotes: 0,
        };

        listings.push(newListing);
        await writeListings(appId, listings);
      }

      res.status(201).json({
        status: 'success',
        suggestion: newSuggestion,
      });
    } catch (error) {
      console.error('Error creating suggestion:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create suggestion',
      });
    }
  }
);

/**
 * Update a suggestion (edit fields or change status)
 */
router.put<{ appId: string; suggestionId: string }, SuggestionsResponse>(
  '/suggestions/:appId/:suggestionId',
  async (req, res): Promise<void> => {
    try {
      const { appId, suggestionId } = req.params;
      const { name, imageUrl, url, notes, customCategory, categoryId, status } = req.body as {
        name?: string;
        imageUrl?: string;
        url?: string;
        notes?: string;
        customCategory?: string;
        categoryId?: string;
        status?: string;
      };

      const suggestions = await readSuggestions(appId);
      const index = suggestions.findIndex((s) => s.id === suggestionId);

      if (index === -1) {
        res.status(404).json({
          status: 'error',
          message: 'Suggestion not found',
        });
        return;
      }

      const suggestion = suggestions[index];

      if (!suggestion) {
        res.status(404).json({
          status: 'error',
          message: 'Suggestion not found',
        });
        return;
      }

      if (name !== undefined) {
        suggestion.name = name.trim();
      }

      if (imageUrl !== undefined) {
        if (!imageUrl.trim()) {
          res.status(400).json({
            status: 'error',
            message: 'Image URL cannot be empty',
          });
          return;
        }
        suggestion.imageUrl = imageUrl.trim();
      }

      if (url !== undefined) {
        const trimmedUrl = url.trim();
        if (trimmedUrl) {
          suggestion.url = trimmedUrl;
        } else {
          delete suggestion.url;
        }
      }

      if (notes !== undefined) {
        const trimmedNotes = notes.trim();
        if (trimmedNotes) {
          suggestion.notes = trimmedNotes;
        } else {
          delete suggestion.notes;
        }
      }

      if (customCategory !== undefined) {
        const trimmedCustom = customCategory.trim();
        if (trimmedCustom) {
          suggestion.customCategory = trimmedCustom;
        } else {
          delete suggestion.customCategory;
        }
      }

      if (categoryId !== undefined) {
        if (!categoryId.trim()) {
          res.status(400).json({
            status: 'error',
            message: 'Category cannot be empty',
          });
          return;
        }
        suggestion.categoryId = categoryId.trim();
      }

      if (status !== undefined) {
        if (!isValidStatus(status)) {
          res.status(400).json({
            status: 'error',
            message: 'Invalid status value',
          });
          return;
        }
        suggestion.status = status;
        // Mark as manually approved if status is being changed to approved
        if (status === 'approved' && suggestion.autoApproved !== true) {
          suggestion.autoApproved = false;
        }
      }

      suggestion.updatedAt = new Date().toISOString();

      suggestions[index] = suggestion;
      await writeSuggestions(appId, suggestions);

      res.json({
        status: 'success',
        suggestion,
      });
    } catch (error) {
      console.error('Error updating suggestion:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update suggestion',
      });
    }
  }
);

/**
 * Delete a suggestion
 */
router.delete<{ appId: string; suggestionId: string }, SuggestionsResponse>(
  '/suggestions/:appId/:suggestionId',
  async (req, res): Promise<void> => {
    try {
      const { appId, suggestionId } = req.params;

      const suggestions = await readSuggestions(appId);
      const index = suggestions.findIndex((s) => s.id === suggestionId);

      if (index === -1) {
        res.status(404).json({
          status: 'error',
          message: 'Suggestion not found',
        });
        return;
      }

      const updatedSuggestions = suggestions.filter((s) => s.id !== suggestionId);
      await writeSuggestions(appId, updatedSuggestions);

      res.json({
        status: 'success',
        message: 'Suggestion deleted',
      });
    } catch (error) {
      console.error('Error deleting suggestion:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete suggestion',
      });
    }
  }
);

export const suggestionsRouter = router;
