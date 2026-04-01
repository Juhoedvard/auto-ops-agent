
import { motion } from 'framer-motion';

interface Props {
  techs: string[];
}

export default function TechStack({ techs }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="flex flex-wrap gap-2 my-3 sm:my-4"
    >
      {techs.map((tech, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: i * 0.1 }}
          className="px-2 sm:px-3 py-1 sm:py-1 bg-blue-100 text-blue-700 rounded-full text-xs sm:text-sm font-medium border border-blue-200 hover:bg-blue-200 transition-colors"
        >
          {tech}
        </motion.span>
      ))}
    </motion.div>
  );
}