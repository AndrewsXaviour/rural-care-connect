import React from 'react';
import { motion } from 'framer-motion';
import { GOVERNANCE_DATA, IconMap } from './explainerConfig';

export const GovernanceTree: React.FC = () => {
  return (
    <div className="p-6 max-w-5xl mx-auto min-h-[60vh] flex flex-col items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full text-center mb-12"
      >
        <h2 className="text-2xl font-bold text-white mb-4">System Governance & Invariants</h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          The core rules engine that dictates data authority, prevents invalid states, and ensures regulatory compliance.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        {GOVERNANCE_DATA.map((item, index) => {
          const Icon = IconMap[item.iconName];
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden group hover:border-slate-700 transition-colors"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                {Icon && <Icon size={80} />}
              </div>
              
              <div className="flex items-center gap-4 mb-4 relative z-10">
                <div className="p-3 bg-slate-800 rounded-lg text-primary">
                  {Icon && <Icon size={24} />}
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">
                    {item.category}
                  </span>
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                </div>
              </div>
              
              <p className="text-sm text-slate-400 relative z-10 leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
