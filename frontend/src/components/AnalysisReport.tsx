import React from 'react';
import type { AnalysisResult } from '../types/analysis';
import Overview from './AnalysisOverview';
import TechStack from './TechStack';
import DetailedAnalysis from './DetailedAnalysis';
import AccordionGroup from './AccordionGroup';
import YamlConfig from './YamlConfig';
import Benefits from './Benefits';
import ImplementationSteps from './ImplementationSteps';
import LoadingButton from './LoadingButton';

interface AnalysisReportProps {
  analysis: AnalysisResult;
  isRefetching: boolean;
  onRefetchYaml: (e: React.MouseEvent) => void;
}

export default function AnalysisReport({ analysis, isRefetching, onRefetchYaml }: AnalysisReportProps) {
  return (
    <div className="max-w-4xl mx-auto mt-4 p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4 text-slate-100">CI/CD Recommendation</h2>
      <Overview text={analysis.overview} />
      <TechStack techs={analysis.tech_stack} />
      <DetailedAnalysis content={analysis.analysis} />
      <AccordionGroup data={analysis} />
      
      {analysis.yaml_config ? (
        <YamlConfig code={analysis.yaml_config} />
      ) : (
        <div className="py-12 text-center flex flex-col items-center gap-4">
          <div className="text-slate-400 text-sm">
            <span className="text-amber-400/80 block mb-1 font-semibold">No YAML configuration found.</span>
            <p className="italic opacity-70">The analysis might have skipped this part or failed.</p>
          </div>
          
          <LoadingButton
            onClick={onRefetchYaml}
            loading={isRefetching}
            loadingText="Regenerating..."
            className="px-6 py-2 bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-cyan-500/25 active:scale-95 border border-cyan-400/20"
          >
            <span>↻</span> Refetch YAML
          </LoadingButton>
        </div>
      )}
      
      <Benefits benefits={analysis.benefits} />
      <ImplementationSteps steps={analysis.implementation_steps} />
    </div>
  );
}