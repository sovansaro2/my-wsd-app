import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Delete } from 'lucide-react';

interface PinPadProps {
  title: string;
  subtitle: string;
  error?: string;
  onComplete: (pin: string) => void;
  onCancel?: () => void;
  onForgotPin?: () => void;
  isLoading?: boolean;
}

export default function PinPad({ title, subtitle, error, onComplete, onCancel, onForgotPin, isLoading }: PinPadProps) {
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (error) {
      setShake(true);
      setPin('');
      const timer = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (pin.length === 4 && !isLoading) {
      onComplete(pin);
    }
  }, [pin, isLoading, onComplete]);

  const handleKeyPress = (key: string) => {
    if (isLoading) return;
    if (key === 'backspace') {
      setPin(prev => prev.slice(0, -1));
    } else if (pin.length < 4) {
      setPin(prev => prev + key);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-sm mx-auto relative">
      <div className="text-center mb-8 relative w-full flex flex-col items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 font-battambang">{title}</h2>
        {onForgotPin && (
          <button 
            onClick={onForgotPin}
            className="absolute top-4 right-4 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline font-battambang"
          >
            ភ្លេច PIN?
          </button>
        )}
        <p className="text-sm text-gray-500 dark:text-slate-400 font-battambang">{subtitle}</p>
      </div>

      <motion.div 
        className="flex gap-4 mb-10 h-8 items-center"
        animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        {[0, 1, 2, 3].map((index) => (
          <div 
            key={index}
            className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
              index < pin.length 
                ? 'bg-orange-500 border-orange-500 scale-110' 
                : 'border-gray-300 dark:border-slate-600 bg-transparent'
            }`}
          />
        ))}
      </motion.div>

      {error && (
        <p className="text-red-500 text-sm font-medium mb-6 font-battambang -mt-4">{error}</p>
      )}

      <div className="grid grid-cols-3 gap-x-8 gap-y-4 w-full px-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleKeyPress(num.toString())}
            disabled={isLoading}
            className="w-16 h-16 rounded-full flex items-center justify-center text-3xl font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 active:bg-gray-300 dark:active:bg-slate-600 transition-colors mx-auto"
          >
            {num}
          </button>
        ))}
        
        {onCancel ? (
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="w-16 h-16 rounded-full flex items-center justify-center text-sm font-medium text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors mx-auto font-battambang"
          >
            បោះបង់
          </button>
        ) : (
          <div />
        )}
        
        <button
          onClick={() => handleKeyPress('0')}
          disabled={isLoading}
          className="w-16 h-16 rounded-full flex items-center justify-center text-3xl font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 active:bg-gray-300 dark:active:bg-slate-600 transition-colors mx-auto"
        >
          0
        </button>
        
        <button
          onClick={() => handleKeyPress('backspace')}
          disabled={isLoading || pin.length === 0}
          className="w-16 h-16 rounded-full flex items-center justify-center text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white active:bg-gray-200 dark:active:bg-slate-700 transition-colors mx-auto"
        >
          <Delete className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
}
