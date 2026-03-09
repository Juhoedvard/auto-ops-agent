
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
    <div className="w-full max-w-2xl mx-auto py-8">
      <div className="flex justify-between relative">

        <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-200 -z-10" />
        
        {steps.map((step, index) => {
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={step.key} className="flex flex-col items-center">
              <motion.div 
                animate={{ scale: isCurrent ? 1.2 : 1 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  isActive ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300 text-slate-400'
                }`}
              >
                {isActive && index < currentIndex ? '✓' : index + 1}
              </motion.div>
              <span className={`mt-2 text-xs font-medium ${isActive ? 'text-blue-600' : 'text-slate-500'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}