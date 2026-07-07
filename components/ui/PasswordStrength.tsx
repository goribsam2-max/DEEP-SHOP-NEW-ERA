import React from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

export const PasswordStrength: React.FC<{ password?: string }> = ({ password = '' }) => {
  const reqs = [
    { id: 'length', label: '8+ characters', test: (p: string) => p.length >= 8 },
    { id: 'lower', label: 'Lowercase letter', test: (p: string) => /[a-z]/.test(p) },
    { id: 'upper', label: 'Uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
    { id: 'number', label: 'Number', test: (p: string) => /[0-9]/.test(p) },
    { id: 'special', label: 'Special symbol', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
  ];

  const metCount = reqs.filter(r => r.test(password)).length;
  const strengthPercentage = (metCount / reqs.length) * 100;

  return (
    <div className="mt-3 text-xs border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50">
      <div className="flex justify-between items-center mb-2 px-1">
        <span className="font-semibold text-zinc-700 dark:text-zinc-300">Password Strength</span>
        <span className="font-mono text-zinc-500">{Math.round(strengthPercentage)}%</span>
      </div>
      <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden mb-4">
        <motion.div 
          className={`h-full ${metCount === 5 ? 'bg-green-500' : metCount > 2 ? 'bg-amber-500' : 'bg-red-500'}`}
          initial={{ width: 0 }}
          animate={{ width: `${strengthPercentage}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {reqs.map(req => {
          const isMet = req.test(password);
          return (
            <div key={req.id} className={`flex items-center gap-2 transition-colors duration-300 ${isMet ? 'text-green-600 dark:text-green-400 font-medium' : 'text-zinc-500 dark:text-zinc-500'}`}>
              <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors duration-300 ${isMet ? 'bg-green-100 dark:bg-green-900/30' : 'bg-zinc-200 dark:bg-zinc-800'}`}>
                 {isMet ? <Check className="w-2.5 h-2.5" strokeWidth={3} /> : <X className="w-2.5 h-2.5 opacity-50" />}
              </div>
              <span>{req.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
