# backend/main.py
import os
import json
import traceback
from contextlib import asynccontextmanager
from io import BytesIO

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
from pypdf import PdfReader

# Import the updated models
from .models import ContradictionRequest, ContradictionResponse

# --- Initialization ---
load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable not set.")

# Using Gemini Client for API calls
client = genai.Client(api_key=API_KEY)
MODEL_NAME = "gemini-2.5-flash"

# In-memory replacement for Memo0 (Redis + PostgreSQL)
SESSION_HISTORY: dict[str, list[dict]] = {}


def store_result(session_id: str, result: ContradictionResponse) -> None:
    """
    Stores the latest analysis result, keeping only the last 5.
    (Simple in-memory implementation of Memo0/Redis tracking).
    """
    if session_id not in SESSION_HISTORY:
        SESSION_HISTORY[session_id] = []

    # Store a dict representation of the Pydantic model
    SESSION_HISTORY[session_id].append(result.model_dump())
    # Keep only the last 5 results
    SESSION_HISTORY[session_id] = SESSION_HISTORY[session_id][-5:]


def get_rag_context() -> str:
    """
    Reads the minimal RAG corpus from a local file.
    (Simple implementation of RAG on FAERS + PubMed).
    """
    base_dir = os.path.dirname(__file__)
    rag_path = os.path.join(base_dir, "rag_corpus.txt")
    try:
        # NOTE: A real system would use FAISS/Pinecone to find relevant chunks
        # based on the drug/ADR, not load the whole file.
        with open(rag_path, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return "No external safety data available (rag_corpus.txt not found). RAG context is empty."

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context for startup/shutdown messages."""
    print("Application Startup: AI Pharmacovigilance Tracker MVP is online.")
    # In a real app, you might initialize Celery workers or Redis connections here.
    yield
    print("Application Shutdown.")


app = FastAPI(lifespan=lifespan)

origins = [
    "http://localhost:3000",
    "http://localhost:5173", 
    "https://ai-pharmacovigilance.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Helper Functions for PDF Upload ---

def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    """Extracts plain text from a PDF byte stream using pypdf."""
    try:
        reader = PdfReader(BytesIO(pdf_bytes))
        pages_text: list[str] = []
        for page in reader.pages:
            page_text = page.extract_text() or ""
            pages_text.append(page_text)
        return "\n\n".join(pages_text)
    except Exception as e:
        print(f"PDF parsing error: {e}")
        raise HTTPException(status_code=400, detail="Could not read PDF content.")

async def extract_request_from_pdf_text(pdf_text: str) -> ContradictionRequest:
    """
    Uses Gemini to read the PDF text and extract the required fields 
    into a ContradictionRequest object.
    """
    system_instruction = """
    You are an information extraction assistant for pharmacovigilance.
    You will be given the raw text of a clinical / pharmacovigilance PDF.
    
    Your task is to extract THREE fields required by the ContradictionRequest schema:

    - trial_claim: The primary safety claim from the trial, label, or clinical summary. 
      Focus on statements about safety, tolerability, or the frequency of specific ADRs.

    - case_report: The description of post-market adverse event(s) or safety signal(s).
      This is typically the patient case description or pharmacovigilance narrative.

    - session_id: A short identifier string. Use a natural ID (e.g., case ID, trial ID) 
      from the document if present. Otherwise, create a concise snake_case identifier 
      based on the drug name and a short label, e.g. "drugX_case_1".

    IMPORTANT:
    - Always return valid JSON that matches the ContradictionRequest Pydantic schema.
    - Never return null values. If you cannot find a field, set a best-effort value
      (e.g., "Unknown claim", "Unknown case", or "auto_session_1").
    """

    user_prompt = f"""
    --- BEGIN PDF TEXT ---
    {pdf_text}
    --- END PDF TEXT ---

    Extract the required fields: trial_claim, case_report, and session_id. 
    Respond ONLY with JSON compatible with the ContradictionRequest schema.
    """

    try:
        response = await client.aio.models.generate_content(
            model=MODEL_NAME,
            contents=[user_prompt],
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=ContradictionRequest,
            ),
        )

        extracted_request = ContradictionRequest.model_validate_json(response.text)
        return extracted_request

    except Exception as e:
        traceback.print_exc()
        print(f"Gemini PDF extraction error: {e}")
        raise HTTPException(status_code=500, detail="Failed to extract data from PDF.")


# --- Core Analysis Logic (LLM for causal reasoning) ---

async def analyze_with_gemini(request: ContradictionRequest) -> ContradictionResponse:
    """
    Calls the Gemini LLM to detect contradictions and generate all structured outputs.
    """
    rag_context = get_rag_context()
    session_history = SESSION_HISTORY.get(
        request.session_id, "No prior history for this session."
    )

    system_instruction = """
    You are a highly-experienced Pharmacovigilance Analyst and Regulatory Writing AI.
    Your core goal is to critically compare Document A (Trial Claim/Safety Label) and 
    Document B (Case Report/Post-market ADR) to detect a definitive safety contradiction.
    
    You must leverage the provided RAG Context (FAERS/PubMed data) and Session History 
    (Memo0) to support your analysis.

    Your output MUST be a JSON response that strictly adheres to the ContradictionResponse 
    Pydantic schema, including all required fields:
    1. contradiction_detected ('Yes' or 'No').
    2. signal_confidence_score (0.0 to 1.0, based on the strength and unexpectedness).
    3. contradiction_reasoning (Detailed justification, referencing context/history).
    4. safety_contradiction_heatmap (A structured list of 1-3 key contradicting events/metrics).
    5. regulatory_reporting_draft (A concise, formal narrative draft for reporting the signal, max 200 words).
    """

    user_prompt = f"""
    --- RAG Context (FAERS/PubMed External Safety Data) ---
    {rag_context}
    
    --- Session History (Memo0: Last 5 Analyses for session {request.session_id}) ---
    Prior analysis results help you track the drug's longitudinal safety profile:
    {json.dumps(session_history, indent=2)}

    --- Current Analysis Request ---
    Document A (Trial Claim/Label): "{request.trial_claim}"
    Document B (Case Report/ADR): "{request.case_report}"

    Analyze the contradiction and generate ALL five required structured outputs in the JSON schema.
    """

    try:
        response = await client.aio.models.generate_content(
            model=MODEL_NAME,
            contents=[user_prompt],
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=ContradictionResponse,
            ),
        )

        llm_output = ContradictionResponse.model_validate_json(response.text)
        return llm_output

    except Exception as e:
        traceback.print_exc()
        print(f"Gemini API Error: {e}")
        raise HTTPException(status_code=500, detail="LLM analysis failed.")


# --- API Endpoints ---

@app.post("/api/v1/analyze", response_model=ContradictionResponse)
async def analyze_contradiction(request: ContradictionRequest):
    """
    Accepts two text snippets and a session ID, analyzes for contradictions, 
    and returns a structured result.
    """
    analysis_result = await analyze_with_gemini(request)

    store_result(request.session_id, analysis_result)

    return analysis_result

@app.post("/api/v1/analyze-pdf", response_model=ContradictionResponse)
async def analyze_contradiction_from_pdf(file: UploadFile = File(...)):
    """
    Accepts a PDF upload, extracts the necessary fields using Gemini, 
    then runs the contradiction analysis pipeline.
    """
    if file.content_type not in ("application/pdf",):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    pdf_bytes = await file.read()
    if not pdf_bytes:
        raise HTTPException(status_code=400, detail="Empty file.")

    # 1. Extract text from PDF
    pdf_text = extract_text_from_pdf_bytes(pdf_bytes)
    if not pdf_text.strip():
        raise HTTPException(
            status_code=400,
            detail="No extractable text found in PDF (it may be a scanned image).",
        )

    # 2. Use Gemini to extract structured request data
    extracted_request = await extract_request_from_pdf_text(pdf_text)

    # 3. Run the core contradiction analysis
    analysis_result = await analyze_with_gemini(extracted_request)

    # 4. Store result (Memo0)
    store_result(extracted_request.session_id, analysis_result)

    return analysis_result