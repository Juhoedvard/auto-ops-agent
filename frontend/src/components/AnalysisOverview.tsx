import { motion } from 'framer-motion';

interface Props {
  text: string;
}

export default function Overview({ text }: Props) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="border-l-4 border-white px-5 py-4 sm:px-7 sm:py-6 mb-4 sm:mb-6 rounded-r-lg bg-[#1c2128] border-gray-700"
    >
      <h3 className="font-bold uppercase text-xs sm:text-sm mb-1 text-gray-400">Project Overview</h3>
      <p className="text-shadow-white leading-relaxed italic text-sm sm:text-base text-gray-200">"{text}"</p>
    </motion.section>
  );
}