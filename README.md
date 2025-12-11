# **AI PV Contradiction Tracker**

An end-to-end **AI-powered pharmacovigilance signal detection system** combining:

* **FastAPI + Gemini 2.5 Flash backend** for PDF/text ingestion, field extraction, and contradiction analysis
* **React + Vite frontend** for a clean user workflow, heatmaps, and history management

This tool enables rapid identification of contradictions between **clinical trial safety claims** and **post-market adverse event reports**.

---

# 🚀 **Application Screenshots**

## **Homepage — Mode Selection**

Users can choose:

* **Primary: PDF Upload** (automated extraction + analysis)
* **Secondary: Manual Text** (enter trial claim + ADR narrative directly)

---

## **PDF Upload Mode**

* Upload a **Case Report / Trial PDF**
* System requires a file to proceed
* Button triggers PDF parsing → Gemini extraction → contradiction analysis

<img width="600" alt="Screenshot 2025-12-11 173212" src="https://github.com/user-attachments/assets/eef20826-3ebc-47b3-9579-136ed2db2783" />

---

## **Manual Text Mode**

Inputs:

1. **Trial Claim / Label Safety Statement**
2. **Post-Market Case Report / ADR Narrative**
3. **Session ID** (auto-populated for continued history tracking)

<img width="600" alt="Screenshot 2025-12-11 173222" src="https://github.com/user-attachments/assets/52a144e5-0396-4264-a973-32093b368a47" />

---

## **Analysis History Panel**

* Stores previous analyses locally
* Each report displays a **SIGNAL badge** when contradiction was detected
* "Clear History" removes all entries

<img width="600" alt="Screenshot 2025-12-11 173232" src="https://github.com/user-attachments/assets/05edf7fe-86d1-4bb8-a71c-afdc5a7e2958" />

---

## **Analysis Result — Contradiction Detected**

Result includes:

* **Overall Verdict**
* **Signal Confidence Score**
* **Detailed Contradiction Reasoning**

<img width="600" alt="Screenshot 2025-12-11 173252" src="https://github.com/user-attachments/assets/6732372f-ed96-4215-a8f4-62c3b601ebf8" />

---

## **Heatmap Matrix + Auto-Draft Regulatory Report**

Two major outputs:

### ✔ **Safety Contradiction Heatmap Matrix**

* Shows each adverse event category
* Trial claim vs. post-market signal strength
* Severity classification: *Low / High / Critical*

### ✔ **Regulatory Reporting Auto-Draft**

* Auto-generated safety signal narrative
* Intended for PSURs, RMP updates, or internal signal triage workflows

<img width="600" alt="Screenshot 2025-12-11 173303" src="https://github.com/user-attachments/assets/acbdaad2-879e-4a6e-88cd-be5cf79a087b" />

---

# ⚙️ **System Overview**

The **AI PV Contradiction Tracker** identifies contradictions between:

### **Clinical Trial Safety Claims**

(e.g., “No statistically significant risk of arrhythmia.”)

**vs.**

### **Post-Market Case Report Narratives**

(e.g., “Patient developed ventricular fibrillation requiring ICU admission.”)

The backend uses **Gemini 2.5 Flash** to:

* Extract structured fields from PDFs
* Evaluate contradictions using deterministic prompting
* Generate reasoned reports + heatmaps

---

# 🧠 **Backend Architecture (FastAPI + Gemini)**

### **Key Features**

* PDF text extraction with **PyPDF**
* LLM-powered field extraction:

  * `trial_claim`
  * `case_report`
  * `session_id`
* Contradiction scoring + severity classification
* Simple in-memory session-based **RAG-lite context**

### **Run Backend**

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Create `.env`:

```
GEMINI_API_KEY=your_api_key_here
```

### **API Endpoints**

| Method | Endpoint              | Description                        |
| ------ | --------------------- | ---------------------------------- |
| `POST` | `/api/v1/analyze`     | Manual text contradiction analysis |
| `POST` | `/api/v1/analyze-pdf` | PDF → Extract → Analyze            |

---

# 🖥️ **Frontend (React + Vite)**

### **Install & Run**

```bash
cd frontend
npm install
npm run dev
```

`.env` file:

```
VITE_API_BASE_URL=http://localhost:8000
```

### **Frontend Features**

* PDF upload + manual text modes
* Session-based history
* Heatmap visualization
* Auto-generated regulatory narrative
* JSON export for compliance teams

---

# 📊 **How the Analysis Works**

### **1. PDF Parsing**

Extracts all readable text.

### **2. LLM Field Extraction**

Gemini extracts:

* Trial claim
* Case report summary
* Adverse events
* Patient details

### **3. Contradiction Analysis**

LLM determines:

* Whether contradiction exists
* Severity (Low → Critical)
* Confidence score
* Explanation of mismatch

### **4. Output Rendering**

Frontend displays:

* Verdict
* Confidence score
* Detailed reasoning
* Heatmap
* Auto-generated regulatory draft

---
