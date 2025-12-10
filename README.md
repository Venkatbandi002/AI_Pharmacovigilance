# AI_Pharmacovigilance

## **Overview**

The **AI Pharmacovigilance** is a two-part application consisting of:

### **1. FastAPI Backend**

* Accepts *clinical / safety PDF files*
* Extracts text using **PyPDF**
* Uses **Google Gemini 2.5 Flash** to:

  * Extract structured fields from PDFs
  * Compare trial claims with post-market case reports
  * Detect potential contradictions in safety signals
* Maintains lightweight session-based RAG-context history

### **2. React + Vite Frontend**

* Clean PDF upload UI
* Displays contradiction analysis results
* Shows severity heatmap
* Maintains local analysis history
* Allows JSON export of results

This tool is intended as an MVP for **AI-assisted pharmacovigilance signal detection**.

---

# ⚙️ **Backend Setup (FastAPI + Gemini)**

### **1. Create Virtual Environment**

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
```

### **2. Install dependencies**

```bash
pip install -r requirements.txt
```

packages include:

* `fastapi`
* `uvicorn`
* `pypdf`
* `python-dotenv`
* `google-genai`

### **3. Environment Variable**

Create `.env` inside `backend/`:

```
GEMINI_API_KEY=your_gemini_key_here
```

### **4. Run Backend**

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### **Backend API Endpoints**

| Method | Endpoint              | Description                                         |
| ------ | --------------------- | --------------------------------------------------- |
| `POST` | `/api/v1/analyze`     | Analyze text (trial claim + case report)            |
| `POST` | `/api/v1/analyze-pdf` | Upload PDF → extract fields → analyze contradiction |

Request/response schema is defined in **models.py**.

---

# **Frontend Setup (React + Vite)**

### **1. Install dependencies**

```bash
cd frontend
npm install
```

### **2. Environment Variables**

Create `.env` in the frontend root:

```
VITE_API_BASE_URL=http://localhost:8000
```


### **3. Run Dev Server**

```bash
npm run dev
```

---

# **How the System Works**

### **Workflow**

1. User uploads a **clinical / safety PDF**
2. Backend extracts text using **PyPDF**
3. Gemini LLM extracts:

   * `trial_claim`
   * `case_report`
   * `session_id`
4. Backend passes these to the contradiction analysis LLM
5. Result returned as JSON
6. Frontend shows:

   * Contradiction verdict ("Yes" / "No")
   * Heatmap based on signal confidence score
   * Detailed reasoning
   * Downloadable JSON
   * History stored locally

---

# **Frontend UI Highlights**

* TailwindCSS styling

* Responsive layout

* Severity-based heatmap:

  | Condition                    | Color  |
  | ---------------------------- | ------ |
  | No contradiction             | Green  |
  | Low confidence contradiction | Green  |
  | Medium confidence            | Yellow |
  | High confidence              | Red    |

* Clean components:

  * `PdfUploadForm`
  * `HistoryList`
  * `ResultCard`

---

# **Backend Logic Summary**

### **PDF Extraction**

```python
reader = PdfReader(BytesIO(pdf_bytes))
text = "\n".join(page.extract_text() for page in reader.pages)
```

### **LLM Field Extraction**

Backend sends PDF text to Gemini to extract fields needed for analysis.

### **Contradiction Analysis**

Gemini compares:

* Trial safety claim
* Case report adverse event
* RAG corpus context
* Session memory (last 5 analyses)

Returns a **ContradictionResponse** object:

```json
{
  "contradiction_detected": "Yes",
  "signal_confidence_score": 0.82,
  "contradiction_reasoning": "..."
}
```
 ### Outputs:

 <img width="600" alt="Screenshot 2025-12-10 150132" src="https://github.com/user-attachments/assets/d137b1d1-d9cf-499d-8aaf-b2e87849563e" />

 <img width="600" alt="Screenshot 2025-12-10 162043" src="https://github.com/user-attachments/assets/2be85fb2-02fe-4bed-9daf-f82da90976e7" />


---

