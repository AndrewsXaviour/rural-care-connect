import React from 'react';
import { motion } from 'framer-motion';
import { TABS, TabId } from './explainerConfig';

interface TopNavProps {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
}

export const TopNav: React.FC<TopNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="w-full bg-slate-950 border-b border-slate-800 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-shrink-0">
            <h1 className="text-xl font-bold text-white tracking-tight">System Design Map</h1>
            <p className="text-sm text-slate-400 mt-1">Rural Care Connect architecture & flow</p>
          </div>
          
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`relative flex flex-col items-start p-3 rounded-lg text-left transition-colors min-w-[200px] ${
                    isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 bg-slate-800/80 border border-slate-700 rounded-lg -z-10"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span className="font-semibold text-sm">{tab.title}</span>
                  <span className="text-[10px] mt-1 line-clamp-2 opacity-80 leading-tight">
                    {tab.subtext}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
