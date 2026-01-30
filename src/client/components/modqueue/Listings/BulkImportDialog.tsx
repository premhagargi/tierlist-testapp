import { useState, FormEvent } from 'react';
import { LoadingSpinner } from '../../LoadingSpinner';
import { Category } from '@/../../src/shared/types/api';

export interface BulkImportDialogProps {
  isOpen: boolean;
  appId: string;
  categories: Category[];
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedItem {
  imageUrl: string;
  name: string;
  category: string;
  link?: string;
}

const OTHERS_ID = '__others__';

export const BulkImportDialog = ({
  isOpen,
  appId,
  categories,
  onClose,
  onSuccess,
}: BulkImportDialogProps) => {
  const [csvData, setCsvData] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [progress, setProgress] = useState('');

  if (!isOpen) return null;

  const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  };

  const parseItems = (data: string): ParsedItem[] => {
    const lines = data
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const items: ParsedItem[] = [];

    for (const line of lines) {
      const parts = parseCsvLine(line);

      if (parts.length < 3) {
        continue; // Skip invalid lines
      }

      const [imageUrl, name, category, link] = parts;

      if (!imageUrl) {
        continue;
      }

      items.push({
        imageUrl: imageUrl.trim(),
        name: name.trim(),
        category: category?.trim() || 'Others',
        link: link?.trim(),
      });
    }

    return items;
  };

  const findCategoryId = (categoryName: string): string => {
    if (!categoryName || categoryName.toLowerCase() === 'others') {
      return OTHERS_ID;
    }

    const found = categories.find((c) => c.name.toLowerCase() === categoryName.toLowerCase());

    return found ? found.id : OTHERS_ID;
  };

  const uploadImage = async (url: string): Promise<string> => {
    try {
      // Check if it's already a Reddit media URL
      if (url.includes('redd.it') || url.includes('reddit.com')) {
        return url;
      }

      // Upload external image via server endpoint
      const response = await fetch('/api/listings/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();

      if (data.status !== 'success' || !data.mediaUrl) {
        throw new Error('Invalid upload response');
      }

      return data.mediaUrl;
    } catch (err) {
      throw new Error(`Failed to upload image: ${url}`);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!csvData.trim()) {
      setError('Please paste CSV data');
      return;
    }

    setProcessing(true);
    setError(null);
    setSuccess(null);
    setProgress('Parsing CSV data...');

    try {
      const items = parseItems(csvData);

      if (items.length === 0) {
        throw new Error('No valid items found in CSV data');
      }

      if (items.length > 100) {
        throw new Error('Maximum 100 items allowed per import');
      }

      setProgress(`Processing ${items.length} items...`);

      // First, collect all unique new categories that need to be created
      const newCategoryNames = new Set<string>();
      for (const item of items) {
        if (item.category && item.category !== 'Others') {
          const categoryId = findCategoryId(item.category);
          if (categoryId === OTHERS_ID) {
            newCategoryNames.add(item.category);
          }
        }
      }

      // Create new categories and fetch updated list
      let updatedCategories = categories;
      if (newCategoryNames.size > 0) {
        setProgress(`Creating ${newCategoryNames.size} new categories...`);
        for (const categoryName of newCategoryNames) {
          try {
            await fetch(`/api/categories/${appId}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: categoryName }),
            });
          } catch (err) {
            console.warn(`Failed to create category ${categoryName}:`, err);
          }
        }

        // Fetch updated categories list
        try {
          const categoriesResponse = await fetch(`/api/categories/${appId}`);
          if (categoriesResponse.ok) {
            const categoriesData = await categoriesResponse.json();
            if (categoriesData.status === 'success' && categoriesData.data) {
              updatedCategories = categoriesData.data;
            }
          }
        } catch (err) {
          console.warn('Failed to fetch updated categories:', err);
        }
      }

      // Helper to find category ID from updated list
      const findUpdatedCategoryId = (categoryName: string): string => {
        if (!categoryName || categoryName.toLowerCase() === 'others') {
          return OTHERS_ID;
        }

        const found = updatedCategories.find(
          (c) => c.name.toLowerCase() === categoryName.toLowerCase()
        );

        return found ? found.id : OTHERS_ID;
      };

      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        setProgress(`Processing item ${i + 1} of ${items.length}`);

        try {
          // Upload image
          const uploadedImageUrl = await uploadImage(item.imageUrl);

          // Determine category - use updated categories list
          const categoryId = findUpdatedCategoryId(item.category);
          const customCategory = categoryId === OTHERS_ID ? item.category : undefined;

          // Create listing
          const response = await fetch(`/api/listings/${appId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: item.name,
              imageUrl: uploadedImageUrl,
              categoryId,
              category: customCategory && customCategory !== 'Others' ? customCategory : undefined,
              url: item.link || undefined,
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to create listing for ${item.name}`);
          }

          successCount++;
        } catch (err) {
          console.error(`Failed to import item ${item?.name || 'unknown'}:`, err);
          failCount++;
        }
      }

      setProgress('');

      if (failCount > 0) {
        setError(`Import complete: ${successCount} succeeded, ${failCount} failed`);
      } else {
        setSuccess(`Import complete: ${successCount} items imported successfully`);
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import items');
      setProgress('');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-3 sm:px-4 py-6 bg-black/70 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/20 bg-[#0b0f11] px-4 py-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)] mt-4">
        <button
          onClick={onClose}
          type="button"
          disabled={processing}
          className="absolute top-3 right-3 h-9 w-9 rounded-full text-slate-100 hover:text-white hover:border-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Close bulk import dialog"
        >
          ✕
        </button>

        <div className="space-y-1.5">
          <h3 className="text-xl font-semibold text-white">Bulk Import Items</h3>
          <p className="text-sm text-slate-300">
            Import upto 100 items at once by pasting structured csv data.
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-400/40 bg-red-500/10 text-red-100 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 rounded-lg border border-green-400/40 bg-green-500/10 text-green-100 px-3 py-2 text-sm">
            {success}
          </div>
        )}

        {progress && (
          <div className="mt-4 rounded-lg border border-blue-400/40 bg-blue-500/10 text-blue-100 px-3 py-2 text-sm flex items-center gap-2">
            <LoadingSpinner size={16} />
            <span>{progress}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-white">
              <span>
                CSV Data<span className="text-red-500 ml-0.5">*</span>
              </span>
            </div>
            <textarea
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              disabled={processing}
              className="w-full rounded-lg border border-white/30 px-3 py-3 text-sm text-white placeholder:text-gray-500 focus:border-white focus:outline-none focus:ring-0 min-h-[280px] font-mono"
              placeholder="https://example.com/images-1.jpg,Item One,Category A,https://link.com&#x0a;https://example.com/images-2.png,Item Two,,&#x0a;https://example.com/images-3.jpg,,,"
            />
          </div>

          <div className="bg-[#1a1d1f] border border-white/10 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-semibold text-white">Instructions</h4>
            <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
              <li>
                Paste CSV data (no header) in this exact order:{' '}
                <span className="font-mono text-white">image, name, category, link</span>
              </li>
              <li>image is required and must be a direct JPG or PNG or WebP image URL</li>
              <li>name is optional but recommended for identification</li>
              <li>category and link are optional</li>
              <li>New categories will be created automatically if they don't exist</li>
              <li>Rows with invalid image URLs, data or format will be skipped during import</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={processing}
              className="px-4 py-2.5 text-sm font-semibold text-white rounded-full border border-white/40 hover:bg-white/5 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              className="allow-white-bg px-5 py-2.5 text-sm font-semibold text-black rounded-full shadow-[0_10px_30px_-12px_rgba(0,0,0,0.5)] border border-white disabled:cursor-wait disabled:opacity-70 inline-flex items-center justify-center gap-2"
            >
              {processing && <LoadingSpinner size={16} />}
              <span>{processing ? 'Importing…' : 'Import'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
