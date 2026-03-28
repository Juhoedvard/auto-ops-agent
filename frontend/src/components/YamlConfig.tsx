
import type { MouseEvent } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface YamlConfigProps {
  code: string;
}

export default function YamlConfig({ code }: YamlConfigProps) {



  const copyToClipboard = () => {
    if (!code) return;
    
    const textArea = document.createElement("textarea");
    textArea.value = code;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');

    } catch (err) {
      console.error("Kopiointi epäonnistui", err);
    }
    document.body.removeChild(textArea);
  };


  return (
    <details className="group border border-gray-800 rounded-lg mb-4 shadow-sm bg-[#1c2128] overflow-hidden">
      <summary className="accordion-summary">
        <div className="flex items-center gap-2">
          <span className="text-blue-400 text-lg">📄</span>
          <span>GitHub Actions Workflow (.yml)</span>
        </div>
        <span className="text-gray-500 group-open:rotate-180 transition-transform duration-200">
          ▼
        </span>
      </summary>
      
      <div className="p-4 border-t border-gray-800 bg-[#0d1117] relative">
          <>
            <div className="flex justify-end mb-2">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  copyToClipboard();
                }}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-[10px] px-3 py-1 rounded border border-gray-700 transition-colors uppercase font-bold tracking-wider"
              >
                Copy Code
              </button>
            </div>
            <div className="rounded-md overflow-hidden border border-gray-800">
              <SyntaxHighlighter
                language="yaml"
                style={vscDarkPlus}
                customStyle={{ 
                  margin: 0, 
                  padding: '1.25rem',
                  fontSize: '0.85rem',
                  lineHeight: '1.5',
                  background: '#010409'
                }}
              >
                {code}
              </SyntaxHighlighter>
            </div>
          </>
      </div>
    </details>
  );
}