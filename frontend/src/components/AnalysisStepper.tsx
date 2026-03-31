
import { motion } from 'framer-motion';

const steps = [
  { key: 'cloning', label: 'Cloning Repository' },
  { key: 'analyzing', label: 'Analyzing Code' },
  { key: 'generating', label: 'Generating Report' },
  { key: 'ready', label: 'Ready' }
];

export default function AnalysisStepper({ currentStatus }: { currentStatus: string }) {
  const currentIndex = steps.findIndex(s => s.key === currentStatus);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto py-6 sm:py-8"
    >
      <div className="flex justify-between relative">
        <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-200 -z-10 rounded-full" />

        {steps.map((step, index) => {
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex flex-col items-center"
            >
              <motion.div
                animate={{
                  scale: isCurrent ? 1.2 : 1,
                  backgroundColor: isActive ? '#3b82f6' : '#e2e8f0'
                }}
                transition={{ duration: 0.3 }}
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 shadow-md ${
                  isActive ? 'border-blue-600 text-white' : 'border-slate-300 text-slate-400'
                }`}
              >
                {isActive && index < currentIndex ? '✓' : index + 1}
              </motion.div>
              <span className={`mt-2 text-xs sm:text-sm font-medium text-center ${
                isActive ? 'text-blue-600' : 'text-slate-500'
              }`}>
                {step.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}