


import { motion } from 'framer-motion';
import Markdown from 'react-markdown';
import ErrorBoundary from './ErrorBoundary';

export default function DetailedAnalysis({ content }: { content: string }) {
  return (
    <motion.details
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="group border border-gray-800 rounded-lg mb-4 shadow-sm bg-[#1c2128] overflow-hidden"
    >
      <summary className="accordion-summary cursor-pointer">
        <span className='border-b text-sm sm:text-base'>Detailed CI/CD Analysis</span>
        <span className="text-gray-500 group-open:rotate-180 transition-transform duration-200">▼</span>
      </summary>
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: 'auto' }}
        exit={{ height: 0 }}
        transition={{ duration: 0.3 }}
        className="border-t border-gray-800"
      >
        <div className="p-3 sm:p-4 prose prose-invert prose-sm max-w-none text-sm sm:text-base">
          <ErrorBoundary>
            <Markdown>{content}</Markdown>
          </ErrorBoundary>
        </div>
      </motion.div>
    </motion.details>
  );
}