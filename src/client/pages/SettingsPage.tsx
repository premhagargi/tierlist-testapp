import { useState } from 'react';
import { Settings } from 'lucide-react';
import { TiersSection } from '../components/settings/Tiers/TiersSection';
import { CategoriesSection } from '../components/settings/Categories/CategoriesSection';
import { ModsSection } from '../components/settings/Mods/ModsSection';
import { PageLoader } from '../components/PageLoader';
import { MiscSection } from '../components/settings/Misc/MiscSection';

interface SettingsPageProps {
  appId: string;
  username: string | null;
  canModerate: boolean;
  checkingModerator: boolean;
  installerUsername: string | null;
}

type SettingsTab = 'tiers' | 'categories' | 'mods' | 'misc';

export const SettingsPage = (props: SettingsPageProps) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('tiers');
  const { appId, username, canModerate, checkingModerator, installerUsername } = props;

  if (checkingModerator) {
    return <PageLoader />;
  }

  if (!canModerate) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#0E1113] flex items-center justify-center px-4 text-slate-100">
        <div className="max-w-md text-center space-y-2">
          <h1 className="text-xl font-bold text-slate-100">Access restricted</h1>
          <p className="text-sm text-slate-300">
            Only added moderators can view settings. Ask a moderator to add your username to the
            moderators list.
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'tiers' as SettingsTab, label: 'Tiers' },
    { id: 'categories' as SettingsTab, label: 'Categories' },
    { id: 'mods' as SettingsTab, label: 'Admins' },
    { id: 'misc' as SettingsTab, label: 'Misc' },
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0E1113]">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 pt-4 pb-6">
        <div className="border-b border-[#343536] px-2">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div className="pb-3 flex items-center gap-2">
              <Settings size={18} />
              <h1 className="text-xl font-semibold text-white">Settings</h1>
            </div>

            <nav
              className="flex items-center gap-3 sm:gap-5 text-sm font-medium w-full sm:w-auto -mb-[1px]"
              aria-label="Tabs"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="relative pb-3 sm:pb-4 px-2 text-white transition-colors cursor-pointer text-left"
                >
                  <span>{tab.label}</span>
                  <span
                    className={`absolute bottom-0 left-0 right-0 h-[2px] transition-transform duration-200 ${
                      activeTab === tab.id ? 'bg-[#648EFC] scale-x-100' : 'bg-transparent scale-x-0'
                    }`}
                  />
                </button>
              ))}
            </nav>
          </div>
        </div>

          <div className="mt-4">
            {activeTab === 'tiers' && <TiersSection appId={appId} />}
            {activeTab === 'categories' && <CategoriesSection appId={appId} />}
            {activeTab === 'mods' && (
              <ModsSection
                appId={appId}
                currentUsername={username}
                installerUsername={installerUsername}
              />
            )}
            {activeTab === 'misc' && <MiscSection appId={appId} />}
        </div>
      </div>
    </div>
  );
};
