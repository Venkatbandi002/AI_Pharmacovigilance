# backend/main.py
import os
import json
from contextlib import asynccontextmanager
from io import BytesIO

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
from pypdf import PdfReader

from models import ContradictionRequest, ContradictionResponse

load_dotenv()


API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable not set.")

client = genai.Client(api_key=API_KEY)
MODEL_NAME = "gemini-2.5-flash"

SESSION_HISTORY: dict[str, list[dict]] = {}


def store_result(session_id: str, result: ContradictionResponse) -> None:
    """Stores the latest analysis result, keeping only the last 5."""
    if session_id not in SESSION_HISTORY:
        SESSION_HISTORY[session_id] = []

    SESSION_HISTORY[session_id].append(result.model_dump())
    SESSION_HISTORY[session_id] = SESSION_HISTORY[session_id][-5:]


def get_rag_context() -> str:
    """Reads the minimal RAG corpus from a local file."""
    base_dir = os.path.dirname(__file__)
    rag_path = os.path.join(base_dir, "rag_corpus.txt")
    try:
        with open(rag_path, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return "No external safety data available (rag_corpus.txt not found)."

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Application Startup: AI Pharmacovigilance Tracker MVP is online.")
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

def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    """
    Extracts plain text from a PDF byte stream using pypdf.
    NOTE: Works for text-based PDFs. Scanned-image PDFs will appear empty.
    """
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
    Uses Gemini to read the PDF text and extract:
      - trial_claim
      - case_report
      - session_id
    into a ContradictionRequest object.
    """
    system_instruction = """
    You are an information extraction assistant for pharmacovigilance.
    You will be given the raw text of a clinical / pharmacovigilance PDF.

    Your task is to extract THREE fields required by the ContradictionRequest schema:

    - trial_claim: The primary safety claim from a trial, label, SmPC, or key clinical summary.
      This is usually a statement that the drug is safe, well-tolerated, or free
      from specific adverse events or safety risks.

    - case_report: The description of post-market adverse event(s) or safety signal(s)
      that are being reported in the document. This will usually look like a patient
      case description, adverse event report, or pharmacovigilance narrative.

    - session_id: A short identifier string that can be used to track this PDF.
      If there is a natural ID in the document (e.g. case ID, report ID, trial ID),
      use that. Otherwise, create a concise snake_case identifier based on the drug
      name and a short label, e.g. "drugX_case_1".

    IMPORTANT:
    - Always return valid JSON that matches the ContradictionRequest Pydantic schema.
    - Never return null values. If you truly cannot find a field, set a best-effort value
      like "Unknown trial claim" or "Unknown case report" or "auto_session_1".
    """

    user_prompt = f"""
    Below is the extracted text from a single PDF document.

    --- BEGIN PDF TEXT ---
    {pdf_text}
    --- END PDF TEXT ---

    Extract and return:
    - trial_claim
    - case_report
    - session_id

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
        import traceback

        traceback.print_exc()
        print(f"Gemini PDF extraction error: {e}")
        raise HTTPException(status_code=500, detail="Failed to extract data from PDF.")


async def analyze_with_gemini(request: ContradictionRequest) -> ContradictionResponse:
    """Calls the Gemini LLM to detect contradictions."""
    rag_context = get_rag_context()
    session_history = SESSION_HISTORY.get(
        request.session_id, "No prior history for this session."
    )

    system_instruction = """
    You are a highly-experienced Pharmacovigilance Analyst.
    Your task is to critically compare Document A (Trial Claim) and Document B (Case Report)
    to detect a definitive contradiction regarding the drug's safety profile, grounded by the
    provided RAG Context. You must provide a JSON response that strictly adheres to the
    ContradictionResponse Pydantic schema.
    """

    user_prompt = f"""
    --- RAG Context (External Safety Data) ---
    {rag_context}

    --- Session History (Last 5 Analyses) ---
    {json.dumps(session_history, indent=2)}

    --- Analysis Request ---
    Document A (Trial Claim): "{request.trial_claim}"
    Document B (Case Report/ADR): "{request.case_report}"

    Based on the documents and context, is there a material safety contradiction?
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
        import traceback

        traceback.print_exc()
        print(f"Gemini API Error: {e}")
        raise HTTPException(status_code=500, detail="LLM analysis failed.")


@app.post("/api/v1/analyze", response_model=ContradictionResponse)
async def analyze_contradiction(request: ContradictionRequest):
    """
    Accepts two text snippets and a session ID, analyzes for contradictions using Gemini,
    and returns a structured result.
    """
    analysis_result = await analyze_with_gemini(request)

    store_result(request.session_id, analysis_result)

    return analysis_result

@app.post("/api/v1/analyze-pdf", response_model=ContradictionResponse)
async def analyze_contradiction_from_pdf(file: UploadFile = File(...)):
    """
    Accepts a single PDF upload, extracts trial_claim, case_report, and session_id
    using Gemini, then runs the existing contradiction analysis pipeline.

    Frontend can call this with multipart/form-data:
      - file: the PDF
    """
    if file.content_type not in ("application/pdf",):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    pdf_bytes = await file.read()
    if not pdf_bytes:
        raise HTTPException(status_code=400, detail="Empty file.")

    pdf_text = extract_text_from_pdf_bytes(pdf_bytes)
    if not pdf_text.strip():
        raise HTTPException(
            status_code=400,
            detail="No extractable text found in PDF (it may be a scanned image).",
        )

    extracted_request = await extract_request_from_pdf_text(pdf_text)

    analysis_result = await analyze_with_gemini(extracted_request)

    store_result(extracted_request.session_id, analysis_result)

    return analysis_result


