




import { motion } from 'framer-motion';

export default function Benefits({ benefits }: { benefits: string[] }) {
  return (
    <motion.details
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="group border border-gray-800 rounded-lg mb-4 shadow-sm bg-[#1c2128] overflow-hidden"
    >
      <summary className="accordion-summary cursor-pointer">
        <span className="border-b text-sm sm:text-base">Key Benefits</span>
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
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
            {benefits.map((benefit, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
                className="flex items-center gap-2 text-sm sm:text-base"
              >
                <span className="text-green-500 flex-shrink-0">✔</span> {benefit}
              </motion.li>
            ))}
          </ul>
        </div>
      </motion.div>
    </motion.details>
  );
}