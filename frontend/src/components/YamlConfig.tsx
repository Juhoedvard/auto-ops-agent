
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface YamlConfigProps {
  code: string;
}

export default function YamlConfig({ code }: YamlConfigProps) {
  const copyToClipboard = async () => {
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
      toast.success('YAML configuration copied to clipboard!', { duration: 2000 });
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        toast.success('YAML configuration copied to clipboard!', { duration: 2000 });
      } catch (fallbackErr) {
        console.error("Copy failed", fallbackErr);
        toast.error('Failed to copy to clipboard');
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <motion.details
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="group border border-gray-800 rounded-lg mb-4 shadow-sm bg-[#1c2128] overflow-hidden"
    >
      <summary className="accordion-summary cursor-pointer">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-blue-400 text-base sm:text-lg">📄</span>
          <span className="text-sm sm:text-base">GitHub Actions Workflow (.yml)</span>
        </div>
        <span className="text-gray-500 group-open:rotate-180 transition-transform duration-200">
          ▼
        </span>
      </summary>

      <motion.div
        initial={{ height: 0 }}
        animate={{ height: 'auto' }}
        exit={{ height: 0 }}
        transition={{ duration: 0.3 }}
        className="border-t border-gray-800 bg-[#0d1117] relative overflow-hidden"
      >
        <div className="p-3 sm:p-4">
          <div className="flex justify-end mb-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.preventDefault();
                copyToClipboard();
              }}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs px-3 py-2 rounded border border-gray-700 transition-all uppercase font-bold tracking-wider shadow-sm"
            >
              Copy Code
            </motion.button>
          </div>
          <div className="rounded-md overflow-hidden border border-gray-800 shadow-lg">
            <SyntaxHighlighter
              language="yaml"
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                padding: '1rem',
                fontSize: '0.8rem',
                lineHeight: '1.5',
                background: '#010409'
              }}
            >
              {code}
            </SyntaxHighlighter>
          </div>
        </div>
      </motion.div>
    </motion.details>
  );
}