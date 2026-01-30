'use client';

interface PortalTabsProps {
  activeTab: 'nfts' | 'points' | 'leaderboard';
  onTabChange: (tab: 'nfts' | 'points' | 'leaderboard') => void;
}

export function PortalTabs({ activeTab, onTabChange }: PortalTabsProps) {
  const tabs = [
    { id: 'nfts' as const, label: 'My NFTs', icon: '🖼️' },
    { id: 'points' as const, label: 'Points', icon: '⭐' },
    { id: 'leaderboard' as const, label: 'Leaderboard', icon: '🏆' },
  ];

  return (
    <div className="flex justify-center mb-8">
      <div className="inline-flex bg-tmk-gray-900 rounded-xl p-1 border border-tmk-gray-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 sm:px-6 py-3 rounded-lg font-medium transition-all
              ${activeTab === tab.id
                ? 'bg-tmk-red text-white'
                : 'text-tmk-gray-400 hover:text-white hover:bg-tmk-gray-800'
              }
            `}
          >
            <span className="hidden sm:inline">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
