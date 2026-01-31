import { useMemo, useState, useRef, useEffect } from 'react';
// @ts-ignore
import DefaultAvatar from '../../../assets/Icon.svg';
import { useAuthStatus } from '../hooks/useAuthStatus';
import { navigateTo } from '@devvit/web/client';
import { CirclePlusIcon, Plus, SquarePlusIcon } from 'lucide-react';
import { CreateTierListDialog } from './CreateTierListDialog';

const navStyles = {
  container: 'fixed top-0 left-0 z-50 w-full bg-[#0E1113] border-b border-[#2A3236] text-white',
  inner:
    'max-w-6xl mx-auto px-2 sm:px-4  lg:px-6 h-auto min-h-8 py-1 flex items-center justify-between gap-1 sm:gap-2 flex-nowrap',
  brand: 'flex items-center gap-1 min-w-0 flex-1 items-center',
  logoBox: 'h-5 w-5 flex items-center justify-center text-xs font-bold text-white cursor-pointer',
  links:
    'flex items-center gap-0.5 sm:gap-1 text-sm sm:text-sm overflow-x-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent min-w-0',
  linkBase:
    'text-sm sm:text-sm font-semibold px-2 sm:px-2.5 py-1  transition-colors cursor-pointer',
  linkActive: 'text-white',
  linkIdle: 'text-white hover:text-white',
  statsButton:
    'inline-flex items-center gap-1 rounded-full px-1 sm:text-sm sm:px-2 py-1 text-sm font-semibold text-white cursor-pointer whitespace-nowrap',
  menuButton:
    'inline-flex h-5 w-5 items-center justify-center rounded-md cursor-pointer hover:bg-white/10 transition-colors flex-shrink-0',
  dropdown:
    'absolute right-0 top-12 w-48 rounded-md border border-[#3E4142] bg-[#0b0b0b] shadow-xl py-2 flex flex-col gap-1',
  dropdownHeader: 'flex items-center gap-2 px-2 py-1 rounded-md text-slate-100',
  dropdownAvatar:
    'h-6 w-6 rounded-full flex items-center justify-center text-base font-semibold text-white overflow-hidden shrink-0',
  dropdownDivider: 'my-1 h-px w-full bg-[#3E4142]',
  dropdownRow:
    'flex items-center gap-2 px-2 py-1 cursor-pointer rounded-md text-slate-100 hover:bg-white/5 text-left transition-colors',
  dropdownIcon: 'h-4 w-4 flex items-center justify-center text-white',
  dropdownText: 'text-sm font-medium',
  dropdownFooter: 'mt-1 pt-2 pb-1 border-t border-[#3E4142] flex items-center justify-between px-3',
  footerLink:
    'text-xs text-white hover:text-white underline cursor-pointer bg-transparent border-none p-0 transition-colors',
  actions: 'flex items-center gap-2 sm:gap-2 relative flex-shrink-0 ml-auto',
};

interface NavbarProps {
  currentScreen: string;
  onNavigate: (
    screen:
      | 'home'
      | 'voting'
      | 'tierList'
      | 'profile'
      | 'settings'
      | 'modQueue'
      | 'terms'
      | 'privacy'
  ) => void;
  canModerate: boolean;
  statsLabel?: string;
  userName?: string;
  avatarUrl?: string;
  feedbackHref?: string;
  onSuggestItem: () => void;
  isExpired?: boolean;
  isAutoSkipping?: boolean;
}

export const Navbar = ({
  currentScreen,
  onNavigate,
  canModerate,
  userName,
  avatarUrl,
  onSuggestItem,
  isExpired,
  isAutoSkipping,
}: NavbarProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleCreateTierList = (postUrl: string) => {
    navigateTo(postUrl);
  };

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);
  const auth = useAuthStatus();

  const navLinks = useMemo(
    () =>
      [
        { id: 'tierList', label: 'Tier List', action: () => onNavigate('tierList') },
        { id: 'voting', label: 'Vote', action: () => onNavigate('voting') },
      ] as Array<{ id: 'tierList' | 'voting'; label: string; action: () => void }>,
    [onNavigate]
  );

  const resolvedAvatar = avatarUrl ?? auth.avatarUrl ?? DefaultAvatar;
  const resolvedName =
    userName ?? auth.displayName ?? (auth.username ? `u/${auth.username}` : 'u/username');

  return (
    <nav className={navStyles.container}>
      <div className={navStyles.inner}>
        <div className={navStyles.brand}>
          <div
            className={navStyles.logoBox}
            aria-label="Logo placeholder"
            role="button"
            tabIndex={0}
            onClick={() => onNavigate('home')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onNavigate('home');
            }}
          >
            <img src={DefaultAvatar} alt="" />
          </div>
          <div className={navStyles.links}>
            {navLinks.map((link) => {
              const isTier = link.id === 'tierList';
              const isVotingLink = link.id === 'voting';

              const isActive = isTier
                ? currentScreen === 'home' || currentScreen === 'tierList'
                : isVotingLink
                  ? currentScreen === 'voting'
                  : currentScreen === link.id;

              const activeExtra = '';

              return (
                <div className="flex items-center gap-1">
                  <button
                    key={link.id}
                    onClick={link.action}
                    disabled={isVotingLink && isExpired}
                    className={`${navStyles.linkBase} ${
                      isActive ? navStyles.linkActive : navStyles.linkIdle
                    } ${
                      isVotingLink && isExpired ? 'opacity-50 grayscale cursor-not-allowed' : ''
                    }${activeExtra} flex items-center`}
                  >
                    {link.label}
                    {isVotingLink && !isExpired && (
                      <span className="relative flex h-1.25 w-1.25 ml-1.5 -mt-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.25 w-1.25 bg-[#0079D3]"></span>
                      </span>
                    )}
                  </button>
                  {isVotingLink && (
                    <button
                      type="button"
                      className={`${navStyles.statsButton}`}
                      aria-label="Add an item"
                      onClick={onSuggestItem}
                      disabled={isExpired}
                    >
                      <span>Add Item</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className={navStyles.actions}>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold text-white cursor-pointer whitespace-nowrap border border-gray-500"
            aria-label="Create new tier list"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus strokeWidth={1.5} className="h-4 w-4" />
            <span>Create</span>
          </button>

          <button
            type="button"
            className={navStyles.menuButton}
            aria-label="Open menu"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-menu-icon lucide-menu"
            >
              <path d="M4 5h16" />
              <path d="M4 12h16" />
              <path d="M4 19h16" />
            </svg>
          </button>

          {menuOpen && (
            <div className={navStyles.dropdown} ref={dropdownRef}>
              <div className={navStyles.dropdownHeader}>
                <div className={navStyles.dropdownAvatar} aria-hidden="true">
                  {resolvedAvatar ? (
                    <img src={resolvedAvatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <img src={DefaultAvatar} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold text-white truncate max-w-[160px]">
                    {resolvedName}
                  </span>
                </div>
              </div>

              <div className={navStyles.dropdownDivider} />

              {canModerate && (
                <>
                  <button
                    onClick={() => {
                      onNavigate('settings');
                      setMenuOpen(false);
                    }}
                    className={navStyles.dropdownRow}
                  >
                    <span className={navStyles.dropdownIcon} aria-hidden="true">
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
                        className="lucide lucide-settings-icon lucide-settings"
                      >
                        <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </span>

                    <span className={navStyles.dropdownText}>Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      onNavigate('modQueue');
                      setMenuOpen(false);
                    }}
                    className={navStyles.dropdownRow}
                  >
                    <span className={navStyles.dropdownIcon} aria-hidden="true">
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
                        className="lucide lucide-shield-icon lucide-shield"
                      >
                        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                      </svg>
                    </span>
                    <span className={navStyles.dropdownText}>Moderation</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('https://tally.so/r/xXrOKo');
                  setMenuOpen(false);
                }}
                className={navStyles.dropdownRow}
              >
                <span className={navStyles.dropdownIcon} aria-hidden="true">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    className="lucide lucide-message-square-icon lucide-message-square"
                  >
                    <path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z" />
                  </svg>
                </span>
                <span className={navStyles.dropdownText}>Feedback</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('https://links.cebe.fyi/tierlist-app/instructions');
                  setMenuOpen(false);
                }}
                className={navStyles.dropdownRow}
              >
                <span className={navStyles.dropdownIcon} aria-hidden="true">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    className="lucide lucide-info-icon lucide-info"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4" />
                    <path d="M12 8h.01" />
                  </svg>
                </span>
                <span className={navStyles.dropdownText}>Instructions</span>
              </button>

              <div className={navStyles.dropdownFooter}>
                <button
                  type="button"
                  className={navStyles.footerLink}
                  onClick={() => {
                    onNavigate('terms');
                    setMenuOpen(false);
                  }}
                >
                  Terms of Use
                </button>
                <button
                  type="button"
                  className={navStyles.footerLink}
                  onClick={() => {
                    onNavigate('privacy');
                    setMenuOpen(false);
                  }}
                >
                  Privacy Policy
                </button>
              </div>
            </div>
          )}
        </div>

        <CreateTierListDialog
          isOpen={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onCreated={handleCreateTierList}
        />
      </div>
      {isAutoSkipping && (
        <div className="h-1 w-full bg-[#3EA6FF] animate-progress-loader" />
      )}
    </nav>
  );
};
