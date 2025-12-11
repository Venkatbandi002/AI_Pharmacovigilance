// src/components/AnalysisResult.tsx
import React from 'react';
import HeatmapMatrix, { 
    type ContradictionResponse 
} from './HeatmapMatrix';

// Define the shape of the component's props
interface AnalysisResultProps {
  result: ContradictionResponse | null;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ result }) => {
  if (!result) return null;

  const scoreColor = result.signal_confidence_score > 0.7 
    ? 'bg-red-500' 
    : result.signal_confidence_score > 0.4 
    ? 'bg-yellow-500' 
    : 'bg-green-500';

  const contradictionText = result.contradiction_detected === 'Yes' ? 'Contradiction Detected' : 'No Contradiction';
  const contradictionClass = result.contradiction_detected === 'Yes' ? 'text-red-600' : 'text-green-600';

  return (
    <div className="mt-8 p-6 bg-white shadow-xl rounded-lg border border-gray-100">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Analysis Result</h2>
      
      {/* Signal Confidence Score & Verdict */}
      <div className="flex items-center justify-between mb-6 border-b pb-4">
        <div className="flex flex-col">
          <p className="text-lg font-semibold text-gray-600">Overall Verdict:</p>
          <p className={`text-3xl font-extrabold ${contradictionClass}`}>{contradictionText}</p>
        </div>
        
        <div className="text-right">
          <p className="text-lg font-semibold text-gray-600">Signal Confidence Score</p>
          <div className="w-24 h-24 rounded-full flex items-center justify-center border-4 border-gray-100 shadow-inner">
            <span className={`text-2xl font-bold text-white ${scoreColor} rounded-full w-20 h-20 flex items-center justify-center`}>
              {(result.signal_confidence_score * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Contradiction Reasoning */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2 text-gray-700">Contradiction Reasoning</h3>
        <p className="p-3 bg-gray-50 border rounded-md text-gray-700 whitespace-pre-wrap">{result.contradiction_reasoning}</p>
      </div>

      {/* Safety Contradiction Heatmap */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-3 text-gray-700">Safety Contradiction Heatmap Matrix</h3>
        <HeatmapMatrix heatmap={result.safety_contradiction_heatmap} />
      </div>

      {/* Regulatory Reporting Auto-Draft */}
      <div>
        <h3 className="text-xl font-semibold mb-2 text-gray-700">Regulatory Reporting Auto-Draft</h3>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md text-blue-800 italic">
          <p className="whitespace-pre-wrap">{result.regulatory_reporting_draft}</p>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResult;