
import { motion } from 'framer-motion';

const steps = [
  { key: 'cloning', label: 'Cloning Repository', duration: '30-60s', description: 'Downloading repository files' },
  { key: 'analyzing', label: 'Analyzing Code', duration: '60-120s', description: 'Scanning codebase structure' },
  { key: 'generating', label: 'Generating Report', duration: '30-90s', description: 'Creating CI/CD recommendations' },
  { key: 'ready', label: 'Ready', duration: 'Complete', description: 'Analysis finished' }
];

export default function AnalysisStepper({ currentStatus }: { currentStatus: string }) {
  const currentIndex = steps.findIndex(s => s.key === currentStatus);
  const currentStep = steps[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto py-6 sm:py-8"
    >
      {/* Progress header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-slate-200 mb-2">Processing Repository</h2>
        {currentStep && (
          <div className="text-sm text-slate-400">
            <div className="font-medium text-cyan-400">{currentStep.label}</div>
            <div className="text-xs mt-1">{currentStep.description}</div>
            <div className="text-xs text-slate-500 mt-1">Estimated time: {currentStep.duration}</div>
          </div>
        )}
      </div>

      <div className="flex justify-between relative">
        <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-200 -z-10 rounded-full" />

        {steps.map((step, index) => {
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const isCompleted = index < currentIndex;

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
                  backgroundColor: isCompleted ? '#10b981' : isCurrent ? '#3b82f6' : '#e2e8f0'
                }}
                transition={{ duration: 0.3 }}
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 shadow-md ${
                  isCompleted ? 'border-green-600 text-white' : 
                  isActive ? 'border-blue-600 text-white' : 'border-slate-300 text-slate-400'
                }`}
              >
                {isCompleted ? '✓' : isCurrent ? (
                  <svg className="animate-spin w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : index + 1}
              </motion.div>
              <span className={`mt-2 text-xs sm:text-sm font-medium text-center ${
                isCompleted ? 'text-green-600' :
                isActive ? 'text-blue-600' : 'text-slate-500'
              }`}>
                {step.label}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Progress percentage */}
      <div className="mt-6 text-center">
        <div className="text-sm text-slate-400">
          Progress: {Math.round(((currentIndex + 1) / steps.length) * 100)}%
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
          <motion.div
            className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </motion.div>
  );
}