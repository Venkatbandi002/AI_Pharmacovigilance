import React, { useState } from "react";

interface ContradictionResponse {
  contradiction_detected: string;
  signal_confidence_score: number;
  contradiction_reasoning: string;
}

interface AnalysisHistoryItem extends ContradictionResponse {
  id: string;
  fileName: string;
  createdAt: string;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://ai-pharmacovigilance.onrender.com";

async function analyzePdf(file: File): Promise<ContradictionResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/api/v1/analyze-pdf`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function heatColor(score: number, contradiction: string) {
  // If no contradiction → always green
  if (contradiction === "No") return "bg-green-500";

  // If contradiction → severity-based colors  
  if (score < 0.3) return "bg-green-500";
  if (score < 0.6) return "bg-yellow-400";
  return "bg-red-500";
}


function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ContradictionResponse | null>(null);
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const res = await analyzePdf(selectedFile);
      setResult(res);

      setHistory((prev) => [
        {
          id: `${Date.now()}`,
          fileName: selectedFile.name,
          createdAt: new Date().toISOString(),
          ...res,
        },
        ...prev,
      ]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadJson = () => {
    if (!result || !selectedFile) return;

    const data = {
      fileName: selectedFile.name,
      analysisDate: new Date().toISOString(),
      ...result,
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `${selectedFile.name.replace(/\.pdf$/i, "")}_analysis.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 flex justify-center">
      <div className="w-full max-w-3xl space-y-6">

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-center">
          AI Pharmacovigilance Tracker
        </h1>

        {/* Upload Section */}
        <form
          onSubmit={handleAnalyze}
          className="p-5 sm:p-6 bg-slate-900 rounded-xl space-y-5"
        >
          <label className="text-base sm:text-lg font-medium">
            Upload PDF Report
          </label>

          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="text-sm sm:text-base bg-slate-800 p-2 rounded-lg w-full"
          />

          <button
            type="submit"
            disabled={loading || !selectedFile}
            className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-400 text-sm sm:text-base font-medium"
          >
            {loading ? "Analyzing…" : "Analyze PDF"}
          </button>

          {error && (
            <p className="text-red-400 text-sm sm:text-base">{error}</p>
          )}
        </form>

        {/* Result Section */}
        {result && (
          <div className="p-5 sm:p-6 bg-slate-900 rounded-xl space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg sm:text-xl font-semibold">
                Analysis Result
              </h2>

              <button
                type="button"
                onClick={handleDownloadJson}
                className="flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm rounded-lg bg-slate-700 hover:bg-slate-600"
              >
                Download JSON
              </button>
            </div>

            {/* Contradiction */}
            <div className="flex items-center gap-2 text-base sm:text-lg">
              <span className="font-medium">Contradiction:</span>
              <span
                className={`px-2 py-1 rounded-md text-sm sm:text-base ${
                  result.contradiction_detected === "Yes"
                    ? "bg-red-600/30 text-red-300"
                    : "bg-green-600/30 text-green-300"
                }`}
              >
                {result.contradiction_detected}
              </span>
            </div>

            {/* Heatmap */}
            <div className="space-y-1">
              <span className="text-sm sm:text-base font-medium">
                Severity Heatmap
              </span>
              <div className="w-full h-4 rounded-lg overflow-hidden bg-slate-800">
                <div
                  className={`h-full ${heatColor(
                    result.signal_confidence_score,
                    result.contradiction_detected
                  )}`}
                  style={{
                    width: `${result.signal_confidence_score * 100}%`,
                    transition: "width 0.5s ease",
                  }}
                ></div>
              </div>
              <p className="text-xs sm:text-sm text-slate-400">
                Score: {(result.signal_confidence_score * 100).toFixed(1)}%
              </p>
            </div>

            {/* Reasoning */}
            <div className="text-sm sm:text-base md:text-lg leading-relaxed bg-slate-800 p-4 rounded-lg">
              {result.contradiction_reasoning}
            </div>
          </div>
        )}

        {/* History */}
        <div className="p-5 sm:p-6 bg-slate-900 rounded-xl">
          <h2 className="text-base sm:text-lg font-semibold">History</h2>

          {history.length === 0 && (
            <p className="text-sm sm:text-base text-slate-500 mt-2">
              No analyses yet.
            </p>
          )}

          {history.map((h) => (
            <div
              key={h.id}
              className="mt-2 p-3 bg-slate-800 rounded-md text-sm sm:text-base flex justify-between"
            >
              <span className="truncate pr-4">{h.fileName}</span>
              <span
                className={`px-2 py-0.5 rounded text-xs sm:text-sm ${
                  h.contradiction_detected === "Yes"
                    ? "bg-red-600/30 text-red-300"
                    : "bg-green-600/30 text-green-300"
                }`}
              >
                {h.contradiction_detected}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;