import { Router } from 'express';
import { redis } from '@devvit/web/server';

export interface Tier {
  id: string;
  name: string;
  colour: string;
  order: number;
}

export interface TierResponse {
  status: string;
  data?: Tier[];
  tier?: Tier;
  message?: string;
}

const router = Router();

// Default tiers for new apps
const DEFAULT_TIERS: Tier[] = [
  { id: 'S', name: 'S', colour: '#FF7F7F', order: 0 },
  { id: 'A', name: 'A', colour: '#FFBf7F', order: 1 },
  { id: 'B', name: 'B', colour: '#FFFF7F', order: 2 },
  { id: 'C', name: 'C', colour: '#7FFF7F', order: 3 },
  { id: 'D', name: 'D', colour: '#7FFFFF', order: 4 },
];

/**
 * Get tiers for a specific app
 * Initializes with default tiers if none exist
 */
router.get<{ appId: string }, TierResponse>('/tiers/:appId', async (req, res): Promise<void> => {
  try {
    const { appId } = req.params;
    const tiersKey = `tiers:${appId}`;

    // Check if tiers exist for this app
    let tiers = await redis.get(tiersKey);

    if (!tiers) {
      // Initialize with default tiers
      tiers = JSON.stringify(DEFAULT_TIERS);
      await redis.set(tiersKey, tiers);
    }

    res.json({
      status: 'success',
      data: JSON.parse(tiers),
    });
  } catch (error) {
    console.error('Error fetching tiers:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch tiers',
    });
  }
});

/**
 * Create a new tier for a specific app
 */
router.post<{ appId: string }, TierResponse>('/tiers/:appId', async (req, res): Promise<void> => {
  try {
    const { appId } = req.params;
    const { name, colour } = req.body;

    if (!name || !colour) {
      res.status(400).json({
        status: 'error',
        message: 'Name and colour are required',
      });
      return;
    }

    const tiersKey = `tiers:${appId}`;
    let tiersData = await redis.get(tiersKey);

    if (!tiersData) {
      tiersData = JSON.stringify(DEFAULT_TIERS);
    }

    const tiers: Tier[] = JSON.parse(tiersData);
    const newTier: Tier = {
      id: `tier-${Date.now()}`,
      name,
      colour,
      order: tiers.length,
    };

    tiers.push(newTier);
    await redis.set(tiersKey, JSON.stringify(tiers));

    res.status(201).json({
      status: 'success',
      tier: newTier,
    });
  } catch (error) {
    console.error('Error creating tier:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create tier',
    });
  }
});

/**
 * Update a tier (change name, colour, or order)
 */
router.put<{ appId: string; tierId: string }, TierResponse>(
  '/tiers/:appId/:tierId',
  async (req, res): Promise<void> => {
    try {
      const { appId, tierId } = req.params;
      const { name, colour, order } = req.body;

      const tiersKey = `tiers:${appId}`;
      let tiersData = await redis.get(tiersKey);

      if (!tiersData) {
        res.status(404).json({
          status: 'error',
          message: 'App not found',
        });
        return;
      }

      const tiers: Tier[] = JSON.parse(tiersData);
      const tierIndex = tiers.findIndex((t) => t.id === tierId);

      if (tierIndex === -1) {
        res.status(404).json({
          status: 'error',
          message: 'Tier not found',
        });
        return;
      }

      const updatedTier = tiers[tierIndex];
      if (!updatedTier) {
        res.status(404).json({
          status: 'error',
          message: 'Tier not found',
        });
        return;
      }

      const oldName = updatedTier.name;

      // Update tier properties
      if (name !== undefined) updatedTier.name = name;
      if (colour !== undefined) updatedTier.colour = colour;
      if (order !== undefined) {
        // Handle order change (reorder tiers)
        const tier = tiers.splice(tierIndex, 1)[0];
        if (tier) {
          tiers.splice(order, 0, tier);
          // Update order values for all tiers
          tiers.forEach((t, idx) => (t.order = idx));
        }
      }

      const newName = updatedTier.name;

      // If name changed, migrate listings
      if (name !== undefined && oldName !== newName) {
        const listingsKey = `listings:${appId}`;
        const listingsData = await redis.get(listingsKey);
        if (listingsData) {
          const listings: any[] = JSON.parse(listingsData);
          let changed = false;

          listings.forEach((listing) => {
            let listingChanged = false;
            // Migrate votes
            if (listing.votes && listing.votes[oldName] !== undefined) {
              const count = listing.votes[oldName];
              delete listing.votes[oldName];
              listing.votes[newName] = (listing.votes[newName] || 0) + count;
              listingChanged = true;
            }

            // Migrate userVotes
            if (listing.userVotes) {
              Object.keys(listing.userVotes).forEach((userId) => {
                if (listing.userVotes[userId] === oldName) {
                  listing.userVotes[userId] = newName;
                  listingChanged = true;
                }
              });
            }

            if (listingChanged) changed = true;
          });

          if (changed) {
            await redis.set(listingsKey, JSON.stringify(listings));
          }
        }
      }

      await redis.set(tiersKey, JSON.stringify(tiers));

      res.json({
        status: 'success',
        tier: updatedTier,
      });
    } catch (error) {
      console.error('Error updating tier:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update tier',
      });
    }
  }
);

/**
 * Delete a tier
 */
router.delete<{ appId: string; tierId: string }, TierResponse>(
  '/tiers/:appId/:tierId',
  async (req, res): Promise<void> => {
    try {
      const { appId, tierId } = req.params;

      const tiersKey = `tiers:${appId}`;
      let tiersData = await redis.get(tiersKey);

      if (!tiersData) {
        res.status(404).json({
          status: 'error',
          message: 'App not found',
        });
        return;
      }

      const tiers: Tier[] = JSON.parse(tiersData);
      const tierIndex = tiers.findIndex((t) => t.id === tierId);

      if (tierIndex === -1) {
        res.status(404).json({
          status: 'error',
          message: 'Tier not found',
        });
        return;
      }

      const deletedTier = tiers.splice(tierIndex, 1)[0];
      if (!deletedTier) {
        res.status(404).json({
          status: 'error',
          message: 'Tier not found',
        });
        return;
      }

      const deletedName = deletedTier.name;

      // Update order values for remaining tiers
      tiers.forEach((t, idx) => (t.order = idx));

      // Clean up listings
      const listingsKey = `listings:${appId}`;
      const listingsData = await redis.get(listingsKey);
      if (listingsData) {
        const listings: any[] = JSON.parse(listingsData);
        let changed = false;

        listings.forEach((listing) => {
          let listingChanged = false;
          // Remove votes
          if (listing.votes && listing.votes[deletedName] !== undefined) {
            delete listing.votes[deletedName];
            listingChanged = true;
            // Recalculate total
            listing.totalVotes = Object.values(listing.votes).reduce(
              (sum: number, val: any) => sum + (val || 0),
              0
            );
          }

          // Remove userVotes
          if (listing.userVotes) {
            Object.keys(listing.userVotes).forEach((userId) => {
              if (listing.userVotes[userId] === deletedName) {
                delete listing.userVotes[userId];
                listingChanged = true;
              }
            });
          }

          if (listingChanged) changed = true;
        });

        if (changed) {
          await redis.set(listingsKey, JSON.stringify(listings));
        }
      }

      await redis.set(tiersKey, JSON.stringify(tiers));

      res.json({
        status: 'success',
        message: 'Tier deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting tier:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete tier',
      });
    }
  }
);

export const tiersRouter = router;
