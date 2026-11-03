import React, { useState } from 'react';
import { TopNav } from './TopNav';
import { GovernanceTree } from './GovernanceTree';
import { ArchitectureMap } from './ArchitectureMap';
import { FlowStepper } from './FlowStepper';
import { TabId } from './explainerConfig';
import { motion, AnimatePresence } from 'framer-motion';

export const ExplainerLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('governance');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col font-sans selection:bg-primary/30">
      <TopNav activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="flex-grow relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
        <AnimatePresence mode="wait">
          {activeTab === 'governance' && (
            <motion.div
              key="governance"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 overflow-y-auto"
            >
              <GovernanceTree />
            </motion.div>
          )}
          
          {activeTab === 'architecture' && (
            <motion.div
              key="architecture"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 overflow-y-auto"
            >
              <ArchitectureMap />
            </motion.div>
          )}
          
          {activeTab === 'userFlow' && (
            <motion.div
              key="userFlow"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 overflow-y-auto"
            >
              <FlowStepper />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
