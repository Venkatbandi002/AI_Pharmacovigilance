// src/components/AnalysisHistory.tsx
import React from 'react';
import { type ContradictionResponse } from './HeatmapMatrix';

// Define props for the History component
interface AnalysisHistoryProps {
  history: ContradictionResponse[];
  onSelectReport: (report: ContradictionResponse) => void;
  onClearHistory: () => void;
}

const formatDateTime = (sessionId: string): string => {
  // Assuming sessionId is in the format "session_1678886400000"
  try {
    const timestamp = parseInt(sessionId.split('_')[1], 10);
    if (!isNaN(timestamp)) {
      return new Date(timestamp).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  } catch (e) {
    // Fallback if session ID format is unexpected
  }
  return sessionId;
};

const AnalysisHistory: React.FC<AnalysisHistoryProps> = ({ history, onSelectReport, onClearHistory }) => {
  if (history.length === 0) {
    return (
      <div className="p-4 mt-6 bg-white border border-gray-200 rounded-lg shadow-inner">
        <p className="text-gray-500 italic">No previous analysis reports found in history.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h3 className="text-xl font-bold text-gray-800">📜 Analysis History ({history.length})</h3>
        <button
          onClick={onClearHistory}
          className="px-3 py-1 text-sm text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition"
        >
          Clear History
        </button>
      </div>

      <div className="space-y-3">
        {history.map((report, index) => {
          const contradictionClass = report.contradiction_detected === 'Yes' ? 'text-red-700 bg-red-100' : 'text-green-700 bg-green-100';
          
          return (
            <div
              key={index}
              onClick={() => onSelectReport(report)}
              className="p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-white transition-colors flex justify-between items-center"
            >
              <div>
                <p className="text-sm font-semibold text-indigo-600">
                  {formatDateTime(report.session_id || `Report ${index + 1}`)}
                </p>
                <p className="text-xs text-gray-500 truncate max-w-xs">
                  Session ID: {report.session_id}
                </p>
              </div>
              <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${contradictionClass}`}>
                {report.contradiction_detected === 'Yes' ? 'SIGNAL' : 'NO SIGNAL'}
              </span>
            </div>
          );
        }).reverse()} {/* Display newest reports first */}
      </div>
    </div>
  );
};

export default AnalysisHistory;