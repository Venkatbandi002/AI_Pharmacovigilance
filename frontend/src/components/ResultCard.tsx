import React from "react";
import type { ContradictionResponse } from "../api";

interface ResultCardProps {
  result: ContradictionResponse;
}

const ResultCard: React.FC<ResultCardProps> = ({ result }) => {
  const isContradiction = result.contradiction_detected === "Yes";

  return (
    <section className="space-y-4 border border-slate-800 rounded-2xl p-4 sm:p-5 bg-slate-950/70">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Analysis Result</h2>
          <p className="text-xs text-slate-400">
            Derived from LLM comparison of trial claim vs case report.
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border
          ${
            isContradiction
              ? "bg-red-500/10 text-red-400 border-red-500/40"
              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/40"
          }`}
        >
          {isContradiction
            ? "Contradiction Detected"
            : "No Material Contradiction"}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
        <span className="font-medium">Signal confidence:</span>
        <span className="font-mono">
          {(result.signal_confidence_score * 100).toFixed(1)}%
        </span>
      </div>

      <div className="text-sm text-slate-100 leading-relaxed whitespace-pre-wrap bg-slate-900/70 border border-slate-800 rounded-xl px-3 py-3">
        {result.contradiction_reasoning}
      </div>
    </section>
  );
};

export default ResultCard;
