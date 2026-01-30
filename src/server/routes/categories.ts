import { Router } from 'express';
import { redis } from '@devvit/web/server';
import { Listing, Suggestion } from '../../shared/types/api';

export interface Category {
  id: string;
  name: string;
  createdAt: string;
}

export interface CategoryResponse {
  status: string;
  data?: Category[];
  category?: Category;
  message?: string;
}

const router = Router();

/**
 * Get all categories for a specific app
 */
router.get<{ appId: string }, CategoryResponse>(
  '/categories/:appId',
  async (req, res): Promise<void> => {
    try {
      const { appId } = req.params;
      const categoriesKey = `categories:${appId}`;

      let categoriesData = await redis.get(categoriesKey);

      if (!categoriesData) {
        // Initialize with empty array
        categoriesData = JSON.stringify([]);
        await redis.set(categoriesKey, categoriesData);
      }

      res.json({
        status: 'success',
        data: JSON.parse(categoriesData),
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch categories',
      });
    }
  }
);

/**
 * Create a new category for a specific app
 */
router.post<{ appId: string }, CategoryResponse>(
  '/categories/:appId',
  async (req, res): Promise<void> => {
    try {
      const { appId } = req.params;
      const { name } = req.body;

      if (!name || !name.trim()) {
        res.status(400).json({
          status: 'error',
          message: 'Category name is required',
        });
        return;
      }

      const categoriesKey = `categories:${appId}`;
      let categoriesData = await redis.get(categoriesKey);

      if (!categoriesData) {
        categoriesData = JSON.stringify([]);
      }

      const categories: Category[] = JSON.parse(categoriesData);

      // Check for duplicate names
      const exists = categories.some((c) => c.name.toLowerCase() === name.trim().toLowerCase());
      if (exists) {
        res.status(400).json({
          status: 'error',
          message: 'A category with this name already exists',
        });
        return;
      }

      const newCategory: Category = {
        id: `cat-${Date.now()}`,
        name: name.trim(),
        createdAt: new Date().toISOString(),
      };

      categories.push(newCategory);
      await redis.set(categoriesKey, JSON.stringify(categories));

      res.status(201).json({
        status: 'success',
        category: newCategory,
      });
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create category',
      });
    }
  }
);

/**
 * Update a category (change name)
 */
router.put<{ appId: string; categoryId: string }, CategoryResponse>(
  '/categories/:appId/:categoryId',
  async (req, res): Promise<void> => {
    try {
      const { appId, categoryId } = req.params;
      const { name } = req.body;

      if (!name || !name.trim()) {
        res.status(400).json({
          status: 'error',
          message: 'Category name is required',
        });
        return;
      }

      const categoriesKey = `categories:${appId}`;
      let categoriesData = await redis.get(categoriesKey);

      if (!categoriesData) {
        res.status(404).json({
          status: 'error',
          message: 'App not found',
        });
        return;
      }

      const categories: Category[] = JSON.parse(categoriesData);
      const categoryIndex = categories.findIndex((c) => c.id === categoryId);

      if (categoryIndex === -1) {
        res.status(404).json({
          status: 'error',
          message: 'Category not found',
        });
        return;
      }

      // Check for duplicate names (excluding current category)
      const exists = categories.some(
        (c, idx) => idx !== categoryIndex && c.name.toLowerCase() === name.trim().toLowerCase()
      );
      if (exists) {
        res.status(400).json({
          status: 'error',
          message: 'A category with this name already exists',
        });
        return;
      }

      const updatedCategory = categories[categoryIndex];
      if (!updatedCategory) {
        res.status(404).json({
          status: 'error',
          message: 'Category not found',
        });
        return;
      }

      updatedCategory.name = name.trim();

      await redis.set(categoriesKey, JSON.stringify(categories));

      res.json({
        status: 'success',
        category: updatedCategory,
      });
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update category',
      });
    }
  }
);

/**
 * Delete a category
 * - Reassigns all listings and suggestions from this category to "Others" (__others__)
 */
router.delete<{ appId: string; categoryId: string }, CategoryResponse>(
  '/categories/:appId/:categoryId',
  async (req, res): Promise<void> => {
    try {
      const { appId, categoryId } = req.params;

      const categoriesKey = `categories:${appId}`;
      const listingsKey = `listings:${appId}`;
      const suggestionsKey = `suggestions:${appId}`;

      let categoriesData = await redis.get(categoriesKey);

      if (!categoriesData) {
        res.status(404).json({
          status: 'error',
          message: 'App not found',
        });
        return;
      }

      const categories: Category[] = JSON.parse(categoriesData);
      const categoryIndex = categories.findIndex((c) => c.id === categoryId);

      if (categoryIndex === -1) {
        res.status(404).json({
          status: 'error',
          message: 'Category not found',
        });
        return;
      }

      const deletedCategory = categories.splice(categoryIndex, 1)[0];
      if (!deletedCategory) {
        res.status(404).json({
          status: 'error',
          message: 'Category not found',
        });
        return;
      }

      // Remap all listings with this categoryId to __others__
      const listingsData = (await redis.get(listingsKey)) ?? '[]';
      const listings: Listing[] = JSON.parse(listingsData);
      const updatedListings = listings.map((listing) =>
        listing.categoryId === categoryId
          ? { ...listing, categoryId: '__others__', category: undefined }
          : listing
      );
      await redis.set(listingsKey, JSON.stringify(updatedListings));

      // Remap all suggestions with this categoryId to __others__
      const suggestionsData = (await redis.get(suggestionsKey)) ?? '[]';
      const suggestions: Suggestion[] = JSON.parse(suggestionsData);
      const updatedSuggestions = suggestions.map((s) =>
        s.categoryId === categoryId ? { ...s, categoryId: '__others__', category: undefined } : s
      );
      await redis.set(suggestionsKey, JSON.stringify(updatedSuggestions));

      await redis.set(categoriesKey, JSON.stringify(categories));

      res.json({
        status: 'success',
        message: 'Category deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete category',
      });
    }
  }
);

/**
 * Merge one category into another
 * - Deletes the source category
 * - Reassigns listings and suggestions to the target category
 */
router.post<{ appId: string }, CategoryResponse>(
  '/categories/:appId/merge',
  async (req, res): Promise<void> => {
    try {
      const { appId } = req.params;
      const { fromCategoryId, toCategoryId } = req.body as {
        fromCategoryId?: string;
        toCategoryId?: string;
      };

      if (!fromCategoryId || !toCategoryId) {
        res.status(400).json({
          status: 'error',
          message: 'fromCategoryId and toCategoryId are required',
        });
        return;
      }

      if (fromCategoryId === toCategoryId) {
        res.status(400).json({
          status: 'error',
          message: 'Cannot merge a category into itself',
        });
        return;
      }

      const categoriesKey = `categories:${appId}`;
      const listingsKey = `listings:${appId}`;
      const suggestionsKey = `suggestions:${appId}`;

      const categoriesData = await redis.get(categoriesKey);

      if (!categoriesData) {
        res.status(404).json({
          status: 'error',
          message: 'App not found',
        });
        return;
      }

      const categories: Category[] = JSON.parse(categoriesData);
      const fromIndex = categories.findIndex((c) => c.id === fromCategoryId);
      const toIndex = categories.findIndex((c) => c.id === toCategoryId);

      if (fromIndex === -1 || toIndex === -1) {
        res.status(404).json({
          status: 'error',
          message: 'Category not found',
        });
        return;
      }

      // Remove source category
      categories.splice(fromIndex, 1);

      // Reassign listings
      const listingsData = (await redis.get(listingsKey)) ?? '[]';
      const listings: Listing[] = JSON.parse(listingsData);
      const updatedListings = listings.map((listing) =>
        listing.categoryId === fromCategoryId ? { ...listing, categoryId: toCategoryId } : listing
      );
      await redis.set(listingsKey, JSON.stringify(updatedListings));

      // Reassign suggestions
      const suggestionsData = (await redis.get(suggestionsKey)) ?? '[]';
      const suggestions: Suggestion[] = JSON.parse(suggestionsData);
      const updatedSuggestions = suggestions.map((s) =>
        s.categoryId === fromCategoryId ? { ...s, categoryId: toCategoryId } : s
      );
      await redis.set(suggestionsKey, JSON.stringify(updatedSuggestions));

      await redis.set(categoriesKey, JSON.stringify(categories));

      res.json({
        status: 'success',
        data: categories,
        message: 'Category merged successfully',
      });
    } catch (error) {
      console.error('Error merging categories:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to merge categories',
      });
    }
  }
);

export const categoriesRouter = router;
