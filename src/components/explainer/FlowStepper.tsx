import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { USER_FLOW_STEPS, IconMap } from './explainerConfig';

export const FlowStepper: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <div className="p-6 max-w-5xl mx-auto min-h-[60vh] flex flex-col md:flex-row gap-8">
      {/* Stepper Navigation */}
      <div className="w-full md:w-1/3 flex flex-col justify-center space-y-2">
        {USER_FLOW_STEPS.map((step, index) => {
          const isActive = index === activeStep;
          const isPast = index < activeStep;
          const Icon = IconMap[step.iconName];

          return (
            <button
              key={step.id}
              onClick={() => setActiveStep(index)}
              className={`relative flex items-center p-4 rounded-xl text-left transition-all ${
                isActive 
                  ? 'bg-primary/10 border-primary/30 border' 
                  : 'hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 shrink-0 transition-colors ${
                isActive ? 'bg-primary text-primary-foreground' :
                isPast ? 'bg-slate-700 text-slate-300' : 'bg-slate-800 text-slate-500'
              }`}>
                {Icon && <Icon size={18} />}
              </div>
              
              <div>
                <span className={`text-[10px] uppercase font-bold tracking-wider ${isActive ? 'text-primary' : 'text-slate-500'}`}>
                  {step.stage}
                </span>
                <h3 className={`font-semibold ${isActive ? 'text-white' : 'text-slate-400'}`}>
                  {step.title}
                </h3>
              </div>

              {index !== USER_FLOW_STEPS.length - 1 && (
                <div className="absolute left-9 top-14 bottom-[-16px] w-[2px] bg-slate-800 -z-10 hidden md:block" />
              )}
            </button>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="w-full md:w-2/3 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-8 w-full shadow-xl"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-primary/20 text-primary rounded-xl">
                {React.createElement(IconMap[USER_FLOW_STEPS[activeStep].iconName], { size: 32 })}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {USER_FLOW_STEPS[activeStep].title}
                </h2>
                <p className="text-primary font-medium">Stage: {USER_FLOW_STEPS[activeStep].stage}</p>
              </div>
            </div>

            <p className="text-slate-300 text-lg mb-8 leading-relaxed">
              {USER_FLOW_STEPS[activeStep].description}
            </p>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Key Details</h4>
              <ul className="space-y-3">
                {USER_FLOW_STEPS[activeStep].details.map((detail, idx) => (
                  <motion.li 
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + (idx * 0.1) }}
                    className="flex items-center text-slate-300 bg-slate-800/50 p-3 rounded-lg"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary mr-3" />
                    {detail}
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
