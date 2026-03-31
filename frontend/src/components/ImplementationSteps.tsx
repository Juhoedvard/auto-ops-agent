




import { motion } from 'framer-motion';

export default function ImplementationSteps({ steps }: { steps: string[] }) {
  return (
    <motion.details
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="group border border-gray-800 rounded-lg mb-4 shadow-sm bg-[#1c2128] overflow-hidden"
    >
      <summary className="accordion-summary cursor-pointer">
        <span className="border-b text-sm sm:text-base">Step-by-Step Implementation</span>
        <span className="text-gray-500 group-open:rotate-180 transition-transform duration-200">▼</span>
      </summary>
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: 'auto' }}
        exit={{ height: 0 }}
        transition={{ duration: 0.3 }}
        className="border-t border-gray-800"
      >
        <div className="p-3 sm:p-4">
          <ol className="space-y-2 sm:space-y-3">
            {steps.map((step, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
                className="flex gap-2 sm:gap-3 text-sm sm:text-base"
              >
                <span className="font-bold text-blue-500 flex-shrink-0 text-sm sm:text-base">{i + 1}.</span>
                {step}
              </motion.li>
            ))}
          </ol>
        </div>
      </motion.div>
    </motion.details>
  );
}