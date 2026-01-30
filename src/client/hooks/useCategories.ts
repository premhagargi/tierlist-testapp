import { useState, useCallback, useEffect } from 'react';
import { Category } from '../../shared/types/api';

export const useCategories = (appId: string) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    if (!appId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/categories/${appId}`);
      const data = await response.json();

      if (data.status === 'success' && data.data) {
        setCategories(data.data);
      } else {
        setError(data.message || 'Failed to fetch categories');
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  }, [appId]);

  // Create category
  const createCategory = useCallback(
    async (name: string) => {
      try {
        const response = await fetch(`/api/categories/${appId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        });

        const data = await response.json();

        if (data.status === 'success' && data.category) {
          setCategories((prev) => [...prev, data.category]);
          return data.category;
        } else {
          setError(data.message || 'Failed to create category');
          return null;
        }
      } catch (err) {
        console.error('Error creating category:', err);
        setError('Failed to create category');
        return null;
      }
    },
    [appId]
  );

  // Update category
  const updateCategory = useCallback(
    async (categoryId: string, updates: { name?: string }) => {
      try {
        const response = await fetch(`/api/categories/${appId}/${categoryId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });

        const data = await response.json();

        if (data.status === 'success' && data.category) {
          setCategories((prev) =>
            prev.map((c) => (c.id === categoryId ? { ...c, ...data.category } : c))
          );
          return data.category;
        } else {
          setError(data.message || 'Failed to update category');
          return null;
        }
      } catch (err) {
        console.error('Error updating category:', err);
        setError('Failed to update category');
        return null;
      }
    },
    [appId]
  );

  // Delete category
  const deleteCategory = useCallback(
    async (categoryId: string) => {
      try {
        const response = await fetch(`/api/categories/${appId}/${categoryId}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (data.status === 'success') {
          setCategories((prev) => prev.filter((c) => c.id !== categoryId));
          return true;
        } else {
          setError(data.message || 'Failed to delete category');
          return false;
        }
      } catch (err) {
        console.error('Error deleting category:', err);
        setError('Failed to delete category');
        return false;
      }
    },
    [appId]
  );

  // Merge category into another
  const mergeCategory = useCallback(
    async (fromCategoryId: string, toCategoryId: string) => {
      try {
        const response = await fetch(`/api/categories/${appId}/merge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fromCategoryId, toCategoryId }),
        });

        const data = await response.json();

        if (data.status === 'success' && data.data) {
          setCategories(data.data);
          return true;
        } else {
          setError(data.message || 'Failed to merge categories');
          return false;
        }
      } catch (err) {
        console.error('Error merging categories:', err);
        setError('Failed to merge categories');
        return false;
      }
    },
    [appId]
  );

  // Initial fetch
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    mergeCategory,
    refetch: fetchCategories,
  };
};
