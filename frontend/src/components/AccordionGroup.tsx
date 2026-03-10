
import Markdown from 'react-markdown';
import type { AnalysisResult } from '../types/analysis';

interface Props {
  data: AnalysisResult;
}

export default function AccordionGroup ({ data }: Props)  {
  console.log(data)
  return (
    <div className="accordion-group">
      <details>
        <summary>Detailed Implementation Plan</summary>
        <div className="p-4">
          <Markdown>{data.analysis}</Markdown>
        </div>
      </details>
      
      {/* Muut osiot tästä eteenpäin... */}
    </div>
  );
};