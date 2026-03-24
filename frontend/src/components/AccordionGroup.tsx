
import Markdown from 'react-markdown';
import type { AnalysisResult } from '../types/analysis';

interface Props {
  data: AnalysisResult;
}

export default function AccordionGroup ({ data }: Props)  {
  console.log(data)
 return (

      <details className="group border border-gray-200 rounded-lg mb-4 shadow-sm">
        <summary className='accordion-summary'>
          <span className="border-b">Detailed Implementation Plan</span>
          <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div className="p-4">
          <Markdown>{data.analysis}</Markdown>
        </div>
      </details>
      

  ); 
  };