import { useEffect, useState, useRef, FormEvent, DragEvent, useMemo } from 'react';
import { showForm } from '@devvit/web/client';
import { Category } from '@/../../src/shared/types/api';
import { LoadingSpinner } from '../../LoadingSpinner';
import { normalizeRedditImageUrl } from '../../../utils/normalizeRedditImageUrl';
import { UploadCloud } from 'lucide-react';
import { useCategories } from '../../../hooks/useCategories';
import { useListings } from '../../../hooks/useListings';

interface ListingFormValues {
  name: string;
  imageUrl: string;
  categoryId: string;
  category?: string | undefined;
  customCategory?: string | undefined;
  url?: string | undefined;
}

interface ListingFormDialogProps {
  isOpen: boolean;
  isEditing: boolean;
  appId: string;
  initialValues?: ListingFormValues | undefined;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (values: ListingFormValues) => Promise<void>;
}

const NAME_LIMIT = 25;
const OTHERS_ID = '__others__';

export const ListingFormDialog = ({
  isOpen,
  isEditing,
  appId,
  initialValues,
  submitting,
  onClose,
  onSubmit,
}: ListingFormDialogProps) => {
  const { categories, refetch: refetchCategories } = useCategories(appId);
  const { listings, fetchListings } = useListings(appId);
  const [name, setName] = useState(initialValues?.name ?? '');
  const [imageUrl, setImageUrl] = useState(initialValues?.imageUrl ?? '');
  const [categoryId, setCategoryId] = useState(initialValues?.categoryId ?? OTHERS_ID);
  const [customCategory, setCustomCategory] = useState(initialValues?.customCategory ?? '');
  const [url, setUrl] = useState(initialValues?.url ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const categoryMenuRef = useRef<HTMLDivElement | null>(null);

  // Get actual custom 'Others' categories from listings (not DB categories)
  const otherCategories = useMemo(() => {
    const customCats = listings
      .filter((l) => l.categoryId === '__others__' && l.category?.startsWith('Others - '))
      .map((l) => l.category as string);
    return Array.from(new Set(customCats)).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    );
  }, [listings]);

  useEffect(() => {
    if (!categoryMenuOpen) return undefined;
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
        setCategoryMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [categoryMenuOpen]);

  useEffect(() => {
    if (isOpen) {
      refetchCategories();
      fetchListings();
    }
  }, [isOpen, refetchCategories, fetchListings]);

  useEffect(() => {
    if (isOpen && !submitting) {
      const initialName = initialValues?.name ?? '';
      const initialImageUrl = initialValues?.imageUrl ?? '';
      const initialCategoryId = initialValues?.categoryId ?? OTHERS_ID;
      const initialUrl = initialValues?.url ?? '';

      setName(initialName);
      setImageUrl(initialImageUrl);
      setCategoryId(initialCategoryId);
      setCustomCategory(initialValues?.customCategory ?? '');
      setUrl(initialUrl);
      setError(null);
    }
  }, [initialValues, isOpen, submitting]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const trimmedImageUrl = imageUrl.trim();

    if (!trimmedImageUrl) {
      setError('Please add an image via Reddit uploader.');
      return;
    }

    const normalizedImageUrl = normalizeRedditImageUrl(trimmedImageUrl);
    if (!normalizedImageUrl) {
      setError('Please add an image via Reddit uploader.');
      return;
    }

    setError(null);

    let categoryDisplay = undefined;
    if (categoryId === OTHERS_ID && customCategory.trim()) {
      categoryDisplay = `Others - ${customCategory.trim()}`;
    }

    await onSubmit({
      name: name.trim() || '',
      imageUrl: normalizedImageUrl,
      categoryId: categoryId || OTHERS_ID,
      category: categoryDisplay || undefined,
      customCategory: categoryId === OTHERS_ID ? customCategory.trim() : undefined,
      url: url.trim() || undefined,
    });
  };

  const handleImageDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const transfer = event.dataTransfer;
    if (!transfer) return;

    if (transfer.files && transfer.files.length) {
      const file = transfer.files[0];
      if (file && file.size > 5 * 1024 * 1024) {
        setError(
          'Image must be 5MB or smaller. Please compress and re-upload through the uploader.'
        );
        return;
      }
      setError('Drag-and-drop supports Reddit-hosted image links. Use the uploader for files.');
      return;
    }

    const droppedUrl = (transfer.getData('text/uri-list') || transfer.getData('text/plain')).trim();
    if (!droppedUrl) return;

    const normalized = normalizeRedditImageUrl(droppedUrl);
    if (normalized) {
      setImageUrl(normalized);
      setError(null);
    } else {
      setError('Please drop a Reddit-hosted image URL or use Upload image.');
    }
  };

  const handleDevvitImageUpload = async () => {
    try {
      const rawResult = (await showForm({
        title: 'Upload an image!',
        fields: [
          {
            name: 'myImage',
            type: 'image',
            label: 'Image goes here',
            required: true,
          },
        ],
      })) as any;

      let picked: string | undefined;

      if (!rawResult) {
        return;
      }

      if (typeof rawResult === 'string') {
        picked = rawResult;
      } else if (typeof rawResult.myImage === 'string') {
        picked = rawResult.myImage;
      } else if (typeof rawResult.image === 'string') {
        picked = rawResult.image;
      } else if (typeof rawResult.value === 'string') {
        picked = rawResult.value;
      }

      if (!picked) {
        const fields =
          rawResult.fields || rawResult.values || rawResult.data || rawResult.form || rawResult;

        if (fields && typeof fields === 'object') {
          if (typeof fields.myImage === 'string') {
            picked = fields.myImage;
          } else {
            for (const key of Object.keys(fields)) {
              const val = (fields as any)[key];
              if (typeof val === 'string') {
                picked = val;
                break;
              }
            }
          }
        }
      }

      if (picked) {
        const normalized = normalizeRedditImageUrl(picked);
        setImageUrl(normalized);
        setError(null);
      } else {
        setError('Could not read the image URL from the uploader. Please try again.');
      }
    } catch (err) {
      console.error('Devvit image upload failed', err);
      setError('Failed to open the Reddit image uploader. Please try again.');
    }
  };

  const nameCount = `${name.length}/${NAME_LIMIT}`;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-3 sm:px-4 py-6 bg-black/70 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/20 bg-[#0b0f11] px-4 py-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)] mt-4">
        <button
          onClick={onClose}
          type="button"
          className="absolute top-3 right-3 h-9 w-9 rounded-full text-slate-100 hover:text-white hover:border-white transition-colors"
          aria-label="Close listing dialog"
        >
          ✕
        </button>

        <div className="space-y-1.5">
          <h3 className="text-xl font-semibold text-white">
            {isEditing ? 'Edit Item' : 'Add Item'}
          </h3>
          <p className="text-sm text-slate-300">
            Add the item details and upload the image directly here.
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-400/40 bg-red-500/10 text-red-100 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-white">
              <span>
                Image<span className="text-red-500 ml-0.5">*</span>
              </span>
            </div>
            <div
              className={`w-full rounded-lg cursor-pointer  border border-dashed px-3 py-4 text-sm text-gray-500 transition flex flex-col gap-3 ${isDragging ? 'border-white/60 bg-white/5' : 'border-white/30'}`}
              onDragEnter={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                const nextTarget = event.relatedTarget as Node | null;
                if (nextTarget && event.currentTarget.contains(nextTarget)) return;
                setIsDragging(false);
              }}
              onDrop={handleImageDrop}
              role="button"
              tabIndex={0}
              onClick={(event) => {
                event.preventDefault();
                void handleDevvitImageUpload();
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  void handleDevvitImageUpload();
                }
              }}
            >
              {imageUrl ? (
                <div className="w-full justify-center flex items-center gap-3">
                  <div className="w-24 rounded-md overflow-hidden border border-white/20 flex items-center justify-center">
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 py-4 text-gray-500">
                  <span className="text-sm font-medium">Drag and Drop images or</span>
                  <UploadCloud className="h-5 w-5 text-white" strokeWidth={1.6} />
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-gray-500">
                <span>Formats: JPG, PNG, GIF, WEBP</span>
                <span>Max size: 5MB</span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-white">
              <span>Item Name</span>
              <span className="text-slate-300">{nameCount}</span>
            </div>
            <input
              type="text"
              value={name}
              maxLength={NAME_LIMIT}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-white/30  px-3 py-3 text-sm text-white placeholder:text-gray-500 focus:border-white focus:outline-none focus:ring-0"
              placeholder="Enter Name"
            />
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-white">Category</label>
              <div className="relative" ref={categoryMenuRef}>
                <button
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={categoryMenuOpen}
                  onClick={() => setCategoryMenuOpen((open) => !open)}
                  className="inline-flex items-center justify-between w-full rounded-lg border border-white/30 bg-[#0b0f11] px-3 py-3 text-sm font-medium text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2A3236] cursor-pointer"
                >
                  <span className="truncate text-left">
                    {categoryId === OTHERS_ID
                      ? customCategory.trim()
                        ? `Others - ${customCategory}`
                        : 'Others'
                      : (categories.find((c) => c.id === categoryId)?.name ?? 'Others')}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform ${categoryMenuOpen ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {categoryMenuOpen && (
                  <div
                    className="absolute z-10 mt-2 w-full max-h-60 overflow-y-auto bg-[#0b0f11] rounded-lg border border-white/10 shadow-xl animate-in fade-in-0 zoom-in-95 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
                    role="listbox"
                  >
                    {[...categories]
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          role="option"
                          className={`w-full px-4 py-3 text-left text-sm transition-colors bg-[#0b0f11] hover:bg-white/5 ${
                            categoryId === cat.id ? 'text-white bg-white/5' : 'text-slate-200'
                          } focus:outline-none focus:ring-2 focus:ring-[#2A3236]`}
                          onClick={() => {
                            setCategoryId(cat.id);
                            setCategoryMenuOpen(false);
                          }}
                        >
                          {cat.name}
                        </button>
                      ))}
                    <button
                      key={OTHERS_ID}
                      type="button"
                      role="option"
                      className={`w-full px-4 py-3 text-left text-sm transition-colors bg-[#0b0f11] hover:bg-white/5 ${
                        categoryId === OTHERS_ID ? 'text-white bg-white/5' : 'text-slate-200'
                      } focus:outline-none focus:ring-2 focus:ring-[#2A3236]`}
                      onClick={() => {
                        setCategoryId(OTHERS_ID);
                        setCategoryMenuOpen(false);
                      }}
                    >
                      Others
                    </button>
                    {otherCategories.map((cat, idx) => (
                      <button
                        key={`other-${idx}`}
                        type="button"
                        role="option"
                        className="w-full px-4 py-3 text-left text-sm transition-colors bg-[#0b0f11] hover:bg-white/5 text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2A3236] pl-8"
                        onClick={() => {
                          setCategoryId(OTHERS_ID);
                          // Extract the custom category part after "Others - "
                          const customPart = cat.replace(/^Others - /, '');
                          setCustomCategory(customPart);
                          setCategoryMenuOpen(false);
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {categoryId === OTHERS_ID && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-white">
                  <span>Specify Category</span>
                  <span className="text-slate-300">{`${customCategory.length}/${NAME_LIMIT}`}</span>
                </div>
                <input
                  type="text"
                  value={customCategory}
                  maxLength={NAME_LIMIT}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full rounded-lg border border-white/30 px-3 py-3 text-sm text-white placeholder:text-gray-500 focus:border-white focus:outline-none focus:ring-0"
                  placeholder="Enter category"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-medium text-white">Link</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full rounded-lg border border-white/30 px-3 py-3 text-sm text-white placeholder:text-gray-500 focus:border-white focus:outline-none focus:ring-0"
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-white rounded-full border border-white/40 hover:bg-white/5 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="allow-white-bg px-5 py-2.5 text-sm font-semibold text-black rounded-full shadow-[0_10px_30px_-12px_rgba(0,0,0,0.5)] border border-white disabled:cursor-wait disabled:opacity-70 inline-flex items-center justify-center gap-2"
            >
              {submitting && <LoadingSpinner size={16} />}
              <span>{submitting ? 'Saving…' : isEditing ? 'Update' : 'Submit'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
