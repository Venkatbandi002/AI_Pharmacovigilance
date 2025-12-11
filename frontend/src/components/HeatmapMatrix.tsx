import React from 'react';

// --- Interface Definitions (Replacing ../types/models) ---

export interface HeatmapEntry {
    adverse_event: string;
    trial_frequency_percent: number; // ge=0.0, le=100.0
    post_market_severity_score: number; // ge=1, le=5
    contradiction_level: 'Low' | 'Medium' | 'High' | 'Critical' | string;
}

export interface ContradictionResponse {
    contradiction_detected: 'Yes' | 'No' | string;
    signal_confidence_score: number; // ge=0.0, le=1.0
    contradiction_reasoning: string;
    safety_contradiction_heatmap: HeatmapEntry[];
    regulatory_reporting_draft: string;

    // <-- ADDED: session_id is required by the UI/history components
    session_id: string;
}

export interface ContradictionRequest {
    trial_claim: string;
    case_report: string;
    session_id: string;
}

// --- Component Props ---

interface HeatmapMatrixProps {
  heatmap: HeatmapEntry[] | null;
}

// Helper function to get Tailwind background class based on severity score (1-5)
const getSeverityColorClass = (score: number): string => {
  if (score >= 4.5) return 'bg-red-800 text-white';
  if (score >= 4.0) return 'bg-red-700 text-white';
  if (score >= 3.5) return 'bg-red-600 text-white';
  if (score >= 3.0) return 'bg-red-500 text-gray-900';
  if (score >= 2.0) return 'bg-red-400 text-gray-900';
  if (score >= 1.0) return 'bg-red-300 text-gray-900';
  return 'bg-gray-200 text-gray-700';
};

const HeatmapMatrix: React.FC<HeatmapMatrixProps> = ({ heatmap }) => {
  if (!heatmap || heatmap.length === 0) {
    return (
      <p className="text-gray-500 p-4 border rounded-lg bg-white">
        No specific adverse events detailed in the heatmap.
      </p>
    );
  }

  const sources = ['Trial Claim', 'Post-Market'];

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-inner">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 uppercase tracking-wider w-1/4">
              Adverse Event
            </th>
            {sources.map(source => (
              <th
                key={source}
                className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider"
                style={{ minWidth: '100px', maxWidth: '120px' }}
              >
                <div className="whitespace-nowrap transform origin-top-left inline-block">
                  {source}
                </div>
              </th>
            ))}
            <th className="px-4 py-3 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">
              Contradiction Level
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {heatmap.map((item, index) => {
            const severityClass = getSeverityColorClass(item.post_market_severity_score);

            return (
              <tr key={index}>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 bg-gray-50">
                  {item.adverse_event}
                </td>

                <td className={`px-4 py-3 whitespace-nowrap text-sm text-center font-bold bg-white`}>
                  {item.trial_frequency_percent.toFixed(2)}%
                </td>

                <td
                  className={`px-4 py-3 whitespace-nowrap text-sm text-center font-bold transition-all duration-300 ${severityClass}`}
                  title={`Severity: ${item.post_market_severity_score}/5`}
                >
                  {item.post_market_severity_score}/5
                </td>

                <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                      item.contradiction_level.toLowerCase() === 'critical'
                        ? 'bg-red-100 text-red-800'
                        : item.contradiction_level.toLowerCase() === 'high'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {item.contradiction_level}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default HeatmapMatrix;
