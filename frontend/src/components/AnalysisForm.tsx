// src/components/AnalysisForm.tsx
import React, { useState, useEffect, useCallback } from 'react'; 
import AnalysisResult from './AnalysisResult';
import AnalysisHistory from './AnalysisHistory'; 
import { 
    type ContradictionResponse, 
    type ContradictionRequest 
} from './HeatmapMatrix';

// NOTE: Update this to your FastAPI server URL
const API_BASE_URL = "https://ai-pharmacovigilance.onrender.com/api/v1";
const HISTORY_STORAGE_KEY = 'pv_tracker_history'; 

// Helper to save history to localStorage
const saveHistoryToLocalStorage = (history: ContradictionResponse[]) => {
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
};

// Helper to load history from localStorage
const loadHistoryFromLocalStorage = (): ContradictionResponse[] => {
  const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as ContradictionResponse[];
    } catch (e) {
      console.error("Failed to parse history from localStorage", e);
      return [];
    }
  }
  return [];
};


const AnalysisForm: React.FC = () => {
    // --- State Initialization ---
    // NEW: Use a state to control the view mode (true for PDF, false for Text)
    const [isPdfMode, setIsPdfMode] = useState<boolean>(true); 

    const [trialClaim, setTrialClaim] = useState<string>('');
    const [caseReport, setCaseReport] = useState<string>('');
    const [sessionId, setSessionId] = useState<string>(`session_${Date.now()}`);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [result, setResult] = useState<ContradictionResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<ContradictionResponse[]>([]);

    // Load history on component mount
    useEffect(() => {
        setHistory(loadHistoryFromLocalStorage());
    }, []);

    const handleSaveResult = useCallback((newResult: ContradictionResponse) => {
        setResult(newResult);
        setHistory(prevHistory => {
            const updatedHistory = [...prevHistory, newResult];
            saveHistoryToLocalStorage(updatedHistory);
            return updatedHistory;
        });
    }, []);

    const handleClearHistory = () => {
        if (window.confirm("Are you sure you want to clear all analysis history?")) {
            setHistory([]);
            saveHistoryToLocalStorage([]);
            setResult(null); 
        }
    };

    const handleSelectReport = (report: ContradictionResponse) => {
        setResult(report);
        setError(null);
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResult(null); 

        try {
            let url = `${API_BASE_URL}/analyze`;
            let data: ContradictionRequest | FormData = { trial_claim: trialClaim, case_report: caseReport, session_id: sessionId };
            let headers: HeadersInit = { 'Content-Type': 'application/json' };

            if (isPdfMode && pdfFile) { // Check for PDF mode
                url = `${API_BASE_URL}/analyze-pdf`;
                const formData = new FormData();
                formData.append('file', pdfFile);
                // If needed, append other fields. Keeping it simple for PDF upload endpoint.
                data = formData;
                headers = {}; 
            } else if (isPdfMode && !pdfFile) {
                // Prevent submission if in PDF mode but no file is selected
                 throw new Error("Please select a PDF file for analysis.");
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                // Use data based on mode
                body: isPdfMode ? (data as FormData) : JSON.stringify(data as ContradictionRequest),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Analysis failed due to a server error.');
            }

            const jsonResult: ContradictionResponse = await response.json();
            
            handleSaveResult(jsonResult); 
            
            if (!isPdfMode) {
                setSessionId(`session_${Date.now()}`);
            } else {
                setPdfFile(null); // Clear PDF file state after successful upload/analysis
            }

        } catch (err) {
            console.error('API Error:', err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setLoading(false);
        }
    };
    
    // --- Helper Functions for Toggling ---
    
    const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === 'application/pdf') {
            setPdfFile(file);
            setTrialClaim('');
            setCaseReport('');
            setError(null);
        } else {
            setPdfFile(null);
            if (e.target.files?.length) {
                setError('Please select a valid PDF file.');
            }
        }
    };

    const handleToggleMode = (mode: 'pdf' | 'text') => {
        setIsPdfMode(mode === 'pdf');
        // Clear inputs and errors when switching modes
        setPdfFile(null);
        setTrialClaim('');
        setCaseReport('');
        setError(null);
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-extrabold mb-6 text-gray-900 border-b pb-2">AI PV Contradiction Tracker</h1>
            
            <form onSubmit={handleSubmit} className="space-y-6 bg-gray-50 p-6 rounded-lg shadow-md">
                
                {/* Toggle between PDF (Primary) and Text (Secondary) Input */}
                <div className="flex space-x-4 border-b pb-4">
                    <button 
                        type="button"
                        onClick={() => handleToggleMode('pdf')}
                        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                            isPdfMode ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-indigo-50'
                        }`}
                    >
                        Primary: PDF Upload
                    </button>
                    <button 
                        type="button"
                        onClick={() => handleToggleMode('text')}
                        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                            !isPdfMode ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-indigo-50'
                        }`}
                    >
                        Secondary: Manual Text
                    </button>
                </div>

                {/* Conditional Input Fields based on isPdfMode */}
                {isPdfMode ? (
                    <div className="p-4 bg-white border border-gray-300 rounded-lg space-y-4">
                        <label className="block text-sm font-medium text-gray-700">
                            1. Select Case Report/Trial PDF
                        </label>
                        <div className="flex items-center space-x-3">
                            <label className="px-4 py-2 text-sm font-medium text-white bg-indigo-500 rounded-md cursor-pointer hover:bg-indigo-600 transition">
                                Choose File
                                <input 
                                    type="file" 
                                    accept="application/pdf" 
                                    onChange={handlePdfChange} 
                                    className="hidden" 
                                    required
                                />
                            </label>
                            <span className="text-gray-600 truncate flex-1">
                                {pdfFile ? pdfFile.name : 'No PDF file selected.'}
                            </span>
                        </div>
                        {pdfFile && (
                            <p className="text-xs text-green-700">File selected. Click Analyze to proceed with extraction.</p>
                        )}
                        {!pdfFile && (
                            <p className="text-xs text-red-500">A PDF file is required in this mode.</p>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Trial Claim Input */}
                        <div>
                            <label htmlFor="trialClaim" className="block text-sm font-medium text-gray-700">
                                1. Trial Claim / Label Safety Statement
                            </label>
                            <textarea
                                id="trialClaim"
                                rows={3}
                                value={trialClaim}
                                onChange={(e) => setTrialClaim(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="E.g., Drug X was safe and well-tolerated; no instances of severe Hepatotoxicity (ALT > 5x ULN) were observed."
                                required={!isPdfMode}
                            />
                        </div>

                        {/* Case Report Input */}
                        <div>
                            <label htmlFor="caseReport" className="block text-sm font-medium text-gray-700">
                                2. Post-Market Case Report / ADR Narrative
                            </label>
                            <textarea
                                id="caseReport"
                                rows={3}
                                value={caseReport}
                                onChange={(e) => setCaseReport(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="E.g., A 55-year-old female patient developed severe jaundice and ALT levels 10x ULN 30 days after starting Drug X."
                                required={!isPdfMode}
                            />
                        </div>
                        
                        {/* Session ID Input (Memo0 key) */}
                        <div>
                            <label htmlFor="sessionId" className="block text-sm font-medium text-gray-700">
                                3. Session ID (Memo0 Key for History)
                            </label>
                            <input
                                type="text"
                                id="sessionId"
                                value={sessionId}
                                onChange={(e) => setSessionId(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="drug_name_case_id"
                                required
                            />
                        </div>
                    </>
                )}

                {error && (
                    <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md" role="alert">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    // Disable if loading OR if in text mode and fields are empty OR if in PDF mode and no file is selected
                    disabled={loading || (!isPdfMode && (!trialClaim || !caseReport)) || (isPdfMode && !pdfFile)}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 transition duration-150"
                >
                    {loading ? (
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : isPdfMode ? (
                        'Analyze PDF for Contradiction'
                    ) : (
                        'Run Text Contradiction Analysis'
                    )}
                </button>
            </form>

            <AnalysisHistory 
                history={history} 
                onSelectReport={handleSelectReport} 
                onClearHistory={handleClearHistory} 
            />

            <AnalysisResult result={result} />
        </div>
    );
};

export default AnalysisForm;