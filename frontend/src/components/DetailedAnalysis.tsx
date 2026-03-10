


import Markdown from 'react-markdown';

export default function DetailedAnalysis({ content }: { content: string }) {


  
  return (
    <details className="group border border-gray-200 rounded-lg mb-4 shadow-sm">
      <summary className="accordion-summary">
        <span className='border-b'>Detailed CI/CD Analysis</span>
        <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
      </summary>
      <div className="p-4  prose-sm max-w-none">
        <Markdown>{content}</Markdown>
      </div>
    </details>
  );
}