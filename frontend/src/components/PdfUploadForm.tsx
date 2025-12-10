import React from "react";

interface PdfUploadFormProps {
  onFileSelected: (file: File | null) => void;
  onSubmit: () => void;
  loading: boolean;
  selectedFile: File | null;
}

const PdfUploadForm: React.FC<PdfUploadFormProps> = ({
  onFileSelected,
  onSubmit,
  loading,
  selectedFile,
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    onFileSelected(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-1">
          Upload safety / clinical PDF
        </label>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-200
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-lg file:border-0
                       file:text-sm file:font-semibold
                       file:bg-indigo-600 file:text-white
                       hover:file:bg-indigo-500
                       cursor-pointer"
          />
          {selectedFile && (
            <span className="text-xs text-slate-400 truncate max-w-xs">
              Selected: {selectedFile.name}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Backend:{" "}
          <span className="font-mono">
            {import.meta.env.VITE_API_BASE_URL}
          </span>
        </p>
      </div>

      <button
        type="submit"
        disabled={loading || !selectedFile}
        className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition
        ${
          loading || !selectedFile
            ? "bg-slate-700 text-slate-400 cursor-not-allowed"
            : "bg-indigo-600 hover:bg-indigo-500 text-white"
        }`}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-4 w-4 mr-2"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
            Analyzing…
          </>
        ) : (
          "Upload & Analyze PDF"
        )}
      </button>
    </form>
  );
};

export default PdfUploadForm;
