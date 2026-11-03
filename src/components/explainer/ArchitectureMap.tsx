import React from 'react';
import { motion } from 'framer-motion';
import { ARCHITECTURE_BOUNDARIES, IconMap } from './explainerConfig';

export const ArchitectureMap: React.FC = () => {
  return (
    <div className="p-6 max-w-6xl mx-auto min-h-[60vh]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full text-center mb-12"
      >
        <h2 className="text-2xl font-bold text-white mb-4">Tech Stack Boundaries</h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Mapping the separation of concerns across the client edge, cloud services, and primary persistence layers.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {ARCHITECTURE_BOUNDARIES.map((boundary, index) => {
          const Icon = IconMap[boundary.iconName];
          return (
            <motion.div
              key={boundary.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`border rounded-2xl p-6 flex flex-col h-full ${boundary.colorClass.split(' ')[0]} bg-slate-900 shadow-sm`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${boundary.colorClass.split(' ')[1]} ${boundary.colorClass.split(' ')[2]}`}>
                {Icon && <Icon size={24} />}
              </div>
              
              <h3 className="text-lg font-bold text-white mb-4">{boundary.name}</h3>
              
              <div className="space-y-4 flex-grow">
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Technologies</h4>
                  <div className="flex flex-wrap gap-2">
                    {boundary.technologies.map(tech => (
                      <span key={tech} className="text-xs px-2 py-1 bg-slate-800 text-slate-300 rounded-md">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Responsibilities</h4>
                  <ul className="space-y-1">
                    {boundary.responsibilities.map(resp => (
                      <li key={resp} className="text-sm text-slate-400 flex items-start">
                        <span className="mr-2 mt-1 block w-1 h-1 rounded-full bg-slate-600 flex-shrink-0" />
                        {resp}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
