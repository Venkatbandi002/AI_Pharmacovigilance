// src/api.ts

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://ai-pharmacovigilance.onrender.com";

export interface ContradictionResponse {
  contradiction_detected: string; // "Yes" | "No"
  signal_confidence_score: number; // 0.0–1.0
  contradiction_reasoning: string;
}

export interface AnalysisHistoryItem extends ContradictionResponse {
  id: string;
  fileName: string;
  createdAt: string; // ISO string
}

export async function analyzePdf(
  file: File
): Promise<ContradictionResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/api/v1/analyze-pdf`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      text || `Backend error: ${res.status} ${res.statusText}`
    );
  }

  return res.json();
}
