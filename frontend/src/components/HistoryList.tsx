import React from "react";
import type { AnalysisHistoryItem } from "../api";

interface HistoryListProps {
  items: AnalysisHistoryItem[];
  onSelect: (item: AnalysisHistoryItem) => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ items, onSelect }) => {
  if (items.length === 0) {
    return (
      <p className="text-xs text-slate-500">
        No local history yet. Upload a PDF to see previous analyses here.
      </p>
    );
  }

  return (
    <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
      {items.map((item) => {
        const isContradiction = item.contradiction_detected === "Yes";
        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect(item)}
              className="w-full text-left flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.fileName}</p>
                <p className="text-[10px] text-slate-400 truncate">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
              <span
                className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full border
                ${
                  isContradiction
                    ? "border-red-500/40 text-red-300"
                    : "border-emerald-500/40 text-emerald-300"
                }`}
              >
                {isContradiction ? "Yes" : "No"}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
};

export default HistoryList;
