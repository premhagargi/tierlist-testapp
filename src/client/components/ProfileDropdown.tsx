import { useRef, useEffect, useState } from 'react';
import { IoSettingsSharp } from 'react-icons/io5';
import { MdChecklist } from 'react-icons/md';

interface ProfileDropdownProps {
  displayName: string | null;
  avatarUrl: string | null;
  karma: { total: number; post: number; comment: number } | null;
  isDesktop: boolean;
  onNavigate: (page: 'home' | 'profile' | 'settings' | 'modQueue') => void;
  canModerate: boolean;
}

export const ProfileDropdown = ({
  displayName,
  avatarUrl,
  karma,
  isDesktop,
  onNavigate,
  canModerate,
}: ProfileDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigate = (page: 'home' | 'profile' | 'settings' | 'modQueue') => {
    onNavigate(page);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Desktop: Clickable profile area with username + avatar */}
      {isDesktop ? (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors rounded-md cursor-pointer px-3 py-2"
        >
          {avatarUrl && (
            <img
              src={avatarUrl}
              alt={displayName || 'User'}
              className="w-10 h-10 rounded-full border-2 border-purple-300 dark:border-purple-600 shadow-sm  transition-shadow "
            />
          )}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200 max-w-xs truncate">
            {displayName || 'User'}
          </span>
        </button>
      ) : (
        /* Mobile: Only avatar clickable */
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 transition-opacity"
        >
          {avatarUrl && (
            <img
              src={avatarUrl}
              alt={displayName || 'User'}
              className="w-8 h-8 rounded-full border-2 border-purple-300 dark:border-purple-600 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            />
          )}
        </button>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 z-40 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
            <div className="flex items-center gap-3">
              {avatarUrl && (
                <img
                  src={avatarUrl}
                  alt={displayName || 'User'}
                  className="w-10 h-10 rounded-full border-2 border-purple-300 dark:border-purple-600 flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  u/{displayName || 'User'}
                </p>
                {karma && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {karma.total.toLocaleString()} karma
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {canModerate && (
              <>
                <button
                  onClick={() => handleNavigate('settings')}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:cursor-pointer transition-colors flex items-center gap-2"
                >
                  <IoSettingsSharp className="w-4 h-4" />
                  Settings
                </button>

                <button
                  onClick={() => handleNavigate('modQueue')}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:cursor-pointer transition-colors flex items-center gap-2"
                >
                  <MdChecklist className="w-4 h-4" />
                  Mod Queue
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
