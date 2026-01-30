import { Router } from 'express';
import { redis, reddit } from '@devvit/web/server';
import { media } from '@devvit/media';
import { Listing, ListingsResponse } from '../../shared/types/api';

const router = Router();

const LISTINGS_KEY_PREFIX = 'listings';

const getListingsKey = (appId: string) => `${LISTINGS_KEY_PREFIX}:${appId}`;

const ensureVotes = (listing: Listing): Listing => {
  if (!listing.votes) {
    listing.votes = {};
  }

  if (!listing.userVotes) {
    listing.userVotes = {};
  }

  if (listing.totalVotes === undefined) {
    listing.totalVotes = Object.values(listing.votes).reduce((sum, count) => sum + (count || 0), 0);
  }

  return listing;
};

const normalizeListings = (listings: Listing[]): Listing[] =>
  listings.map((listing) => ensureVotes({ ...listing }));

const readListings = async (appId: string): Promise<Listing[]> => {
  const key = getListingsKey(appId);
  let data = await redis.get(key);

  if (!data) {
    data = JSON.stringify([]);
    await redis.set(key, data);
  }

  const parsed = JSON.parse(data) as Listing[];
  return normalizeListings(parsed);
};

const writeListings = async (appId: string, listings: Listing[]): Promise<void> => {
  const key = getListingsKey(appId);
  await redis.set(key, JSON.stringify(listings));
};

/**
 * Upload an image using the media API
 */
router.post<{}, { status: string; mediaUrl?: string; message?: string }>(
  '/listings/upload-image',
  async (req, res): Promise<void> => {
    try {
      const { url } = req.body;

      if (!url) {
        res.status(400).json({
          status: 'error',
          message: 'Image URL is required',
        });
        return;
      }

      // Check if it's already a Reddit media URL
      if (url.includes('redd.it') || url.includes('reddit.com')) {
        res.json({
          status: 'success',
          mediaUrl: url,
        });
        return;
      }

      // Upload external image via media.upload
      const response = await media.upload({
        url,
        type: 'image',
      });

      res.json({
        status: 'success',
        mediaUrl: response.mediaUrl,
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to upload image',
      });
    }
  }
);

/**
 * Get all listings for a specific app
 */
router.get<{ appId: string }, ListingsResponse>(
  '/listings/:appId',
  async (req, res): Promise<void> => {
    try {
      const { appId } = req.params;
      const listings = await readListings(appId);

      res.json({
        status: 'success',
        data: listings,
      });
    } catch (error) {
      console.error('Error fetching listings:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch listings',
      });
    }
  }
);

/**
 * Create a new listing for a specific app
 */
router.post<{ appId: string }, ListingsResponse>(
  '/listings/:appId',
  async (req, res): Promise<void> => {
    try {
      const { appId } = req.params;
      const { name, imageUrl, categoryId, category, url } = req.body as {
        name?: string;
        imageUrl?: string;
        categoryId?: string;
        category?: string;
        url?: string;
      };

      if (!imageUrl || !imageUrl.trim()) {
        res.status(400).json({
          status: 'error',
          message: 'Image URL is required',
        });
        return;
      }

      const listings = await readListings(appId);

      const now = new Date().toISOString();
      const newListing: Listing = {
        id: `listing-${Date.now()}`,
        appId,
        name: name?.trim() || '',
        imageUrl: imageUrl.trim(),
        categoryId: categoryId?.trim() || '__others__',
        category: category?.trim() || undefined,
        url: url?.trim() || undefined,
        createdAt: now,
        updatedAt: now,
        votes: {},
        totalVotes: 0,
      };

      listings.push(newListing);
      await writeListings(appId, listings);

      res.status(201).json({
        status: 'success',
        listing: newListing,
      });
    } catch (error) {
      console.error('[POST /listings] error', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create listing',
      });
    }
  }
);

/**
 * Update a listing
 */
router.put<{ appId: string; listingId: string }, ListingsResponse>(
  '/listings/:appId/:listingId',
  async (req, res): Promise<void> => {
    try {
      const { appId, listingId } = req.params;
      const { name, imageUrl, categoryId, category, url } = req.body as {
        name?: string;
        imageUrl?: string;
        categoryId?: string;
        category?: string;
        url?: string;
      };

      const listings = await readListings(appId);
      const index = listings.findIndex((l) => l.id === listingId);

      if (index === -1) {
        res.status(404).json({
          status: 'error',
          message: 'Listing not found',
        });
        return;
      }

      const listing = listings[index];

      if (!listing) {
        res.status(404).json({
          status: 'error',
          message: 'Listing not found',
        });
        return;
      }

      if (name !== undefined) {
        listing.name = name?.trim() || '';
      }

      if (imageUrl !== undefined) {
        if (!imageUrl.trim()) {
          res.status(400).json({
            status: 'error',
            message: 'Image URL cannot be empty',
          });
          return;
        }
        listing.imageUrl = imageUrl.trim();
      }

      if (categoryId !== undefined) {
        if (!categoryId.trim()) {
          res.status(400).json({
            status: 'error',
            message: 'Category cannot be empty',
          });
          return;
        }
        listing.categoryId = categoryId.trim();
        // When changing categoryId, clear the custom category field unless explicitly set
        if (category === undefined) {
          listing.category = undefined;
        }
      }

      if (category !== undefined) {
        listing.category = category.trim() || undefined;
      }

      if (url !== undefined) {
        listing.url = url.trim() || undefined;
      }

      listing.updatedAt = new Date().toISOString();

      listings[index] = ensureVotes(listing);
      await writeListings(appId, listings);

      res.json({
        status: 'success',
        listing,
      });
    } catch (error) {
      console.error('Error updating listing:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update listing',
      });
    }
  }
);

/**
 * Get a single listing with votes
 */
router.get<{ appId: string; listingId: string }, ListingsResponse>(
  '/listings/:appId/:listingId',
  async (req, res): Promise<void> => {
    try {
      const { appId, listingId } = req.params;
      const listings = await readListings(appId);
      const listing = listings.find((l) => l.id === listingId);

      if (!listing) {
        res.status(404).json({ status: 'error', message: 'Listing not found' });
        return;
      }

      res.json({ status: 'success', listing: ensureVotes(listing) });
    } catch (error) {
      console.error('Error fetching listing:', error);
      res.status(500).json({ status: 'error', message: 'Failed to fetch listing' });
    }
  }
);

/**
 * Vote for a listing tier
 */
router.post<{ appId?: string }, ListingsResponse>('/vote', async (req, res): Promise<void> => {
  try {
    const username = await reddit.getCurrentUsername();
    const user = await reddit.getCurrentUser();

    if (!username || username === 'anonymous') {
      res.status(401).json({ status: 'error', message: 'Authentication required to vote' });
      return;
    }

    const userId = user?.id ?? username;

    const {
      listingId,
      tier,
      appId: bodyAppId,
    } = req.body as {
      listingId?: string;
      tier?: string;
      appId?: string;
    };

    if (!listingId || !tier) {
      res.status(400).json({ status: 'error', message: 'listingId and tier are required' });
      return;
    }

    const appId = bodyAppId;

    if (!appId) {
      res.status(400).json({ status: 'error', message: 'appId is required' });
      return;
    }

    // Check if voting has expired
    const miscKey = `misc:${appId}`;
    const miscData = await redis.get(miscKey);
    if (miscData) {
      const misc = JSON.parse(miscData) as { expiryDate?: string | null };
      if (misc.expiryDate && misc.expiryDate !== null) {
        const expiryDate = new Date(misc.expiryDate);
        const now = new Date();
        if (now > expiryDate) {
          res.status(403).json({
            status: 'error',
            message: 'Voting has expired',
          });
          return;
        }
      }
    }

    const listings = await readListings(appId);
    const index = listings.findIndex((l) => l.id === listingId);

    if (index === -1) {
      res.status(404).json({ status: 'error', message: 'Listing not found' });
      return;
    }

    const listing = ensureVotes({ ...(listings[index] as Listing) });

    if (listing.userVotes?.[userId]) {
      res.status(409).json({
        status: 'error',
        message: 'You have already voted on this listing',
      });
      return;
    }

    const currentVotes = listing.votes?.[tier] || 0;
    listing.votes = {
      ...listing.votes,
      [tier]: currentVotes + 1,
    };
    listing.userVotes = {
      ...listing.userVotes,
      [userId]: tier,
    };
    listing.totalVotes = Object.values(listing.votes).reduce((sum, count) => sum + (count || 0), 0);
    listing.updatedAt = new Date().toISOString();

    listings[index] = listing;
    await writeListings(appId, listings);

    res.json({ status: 'success', listing });
  } catch (error) {
    console.error('Error submitting vote:', error);
    res.status(500).json({ status: 'error', message: 'Failed to submit vote' });
  }
});

/**
 * Delete a listing
 */
router.delete<{ appId: string; listingId: string }, ListingsResponse>(
  '/listings/:appId/:listingId',
  async (req, res): Promise<void> => {
    try {
      const { appId, listingId } = req.params;

      const listings = await readListings(appId);
      const index = listings.findIndex((l) => l.id === listingId);

      if (index === -1) {
        res.status(404).json({
          status: 'error',
          message: 'Listing not found',
        });
        return;
      }

      const deletedListing = listings[index];
      const updatedListings = listings.filter((l) => l.id !== listingId);
      await writeListings(appId, updatedListings);

      // Delete any suggestions that match this listing (by name and imageUrl)
      try {
        const suggestionsKey = `suggestions:${appId}`;
        const suggestionsData = await redis.get(suggestionsKey);

        if (suggestionsData) {
          const suggestions = JSON.parse(suggestionsData);
          const updatedSuggestions = suggestions.filter(
            (s: { name: string; imageUrl: string }) =>
              !(
                s.name.toLowerCase().trim() === deletedListing.name.toLowerCase().trim() &&
                s.imageUrl === deletedListing.imageUrl
              )
          );

          if (updatedSuggestions.length !== suggestions.length) {
            await redis.set(suggestionsKey, JSON.stringify(updatedSuggestions));
          }
        }
      } catch (error) {
        console.error('Error cleaning up matching suggestions:', error);
        // Don't fail the listing deletion if suggestion cleanup fails
      }

      // If the deleted listing was in an "Others - X" category, check if it's now empty
      if (
        deletedListing.categoryId === '__others__' &&
        deletedListing.category &&
        deletedListing.category.startsWith('Others - ')
      ) {
        const categoryName = deletedListing.category.replace(/^Others - /, '').trim();

        // Check if any other listings still use this category
        const hasOtherListings = updatedListings.some(
          (l) => l.categoryId === '__others__' && l.category === deletedListing.category
        );

        // If no listings use this category anymore, delete it from the categories
        if (!hasOtherListings && categoryName) {
          try {
            const categoriesKey = `categories:${appId}`;
            const categoriesData = await redis.get(categoriesKey);

            if (categoriesData) {
              const categories = JSON.parse(categoriesData);
              const categoryIndex = categories.findIndex(
                (c: { name: string }) => c.name.toLowerCase() === categoryName.toLowerCase()
              );

              if (categoryIndex !== -1) {
                categories.splice(categoryIndex, 1);
                await redis.set(categoriesKey, JSON.stringify(categories));
              }
            }
          } catch (error) {
            console.error('Error cleaning up unused category:', error);
            // Don't fail the listing deletion if category cleanup fails
          }
        }
      }

      res.json({
        status: 'success',
        message: 'Listing deleted',
      });
    } catch (error) {
      console.error('Error deleting listing:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete listing',
      });
    }
  }
);

export const listingsRouter = router;
