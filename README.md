# Resume-Rank-AI

A modern AI-powered Resume Ranking and Screening System built with React and Flask. The platform helps recruiters efficiently analyze resumes, match candidates against job descriptions, rank applicants based on relevance, and visualize recruitment insights through an interactive dashboard.

---

## Project Structure

```text
Resume-Rank-AI/
├── frontend/                     # React + Vite Frontend
│   ├── src/
│   │   ├── components/           # Reusable UI Components
│   │   ├── pages/                # Page Components
│   │   ├── contexts/             # React Context Providers
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
│
├── backend/                      # Flask Backend
│   ├── app.py
│   ├── parser_engine.py
│   ├── requirements.txt
│   └── uploads/
│
├── README.md
└── .gitignore
```

---

## Features

### Frontend

* Secure Login Authentication
* Modern Dashboard Interface
* Resume Upload System
* Drag & Drop File Support
* Real-Time Resume Analysis
* Candidate Ranking Dashboard
* Selection & Rejection Tracking
* Interactive Charts and Analytics
* Dark Mode Support
* Mobile Responsive Design
* Toast Notifications
* Progress Indicators

### Backend

* Flask REST API
* Resume Parsing Engine
* PDF, DOCX, JPG, JPEG and PNG Support
* OCR-Based Text Extraction
* NLP-Powered Resume Processing
* Skill Extraction and Matching
* TF-IDF Vectorization
* Cosine Similarity Matching
* Semantic Resume Scoring
* Candidate Ranking Algorithm

### AI & NLP Features

* Automated Skill Extraction
* Resume-Job Description Matching
* Keyword Analysis
* Semantic Similarity Scoring
* Candidate Suitability Ranking
* Intelligent Resume Screening

---

## Tech Stack

### Frontend

* React.js
* Vite
* Tailwind CSS
* JavaScript
* Chart.js / Recharts

### Backend

* Python
* Flask

### Machine Learning & NLP

* Scikit-Learn
* TF-IDF Vectorization
* Cosine Similarity
* SpaCy
* Natural Language Processing (NLP)

### Document Processing

* PyMuPDF
* Python-docx
* OCR Support for Image Resumes

---

## Installation

### Clone Repository

```bash
git clone https://github.com/adityagoswami004/Resume-Rank-AI.git
cd Resume-Rank-AI
```

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## API Endpoints

| Method | Endpoint                  | Description          |
| ------ | ------------------------- | -------------------- |
| GET    | /api/health               | Health Check         |
| POST   | /api/auth/login           | User Login           |
| POST   | /api/resume/parse         | Resume Parsing       |
| POST   | /api/job-description/save | Save Job Description |

---

## How It Works

1. Upload a candidate resume.
2. Enter the target job description.
3. System extracts resume content using NLP techniques.
4. Skills are identified and matched against job requirements.
5. Semantic similarity score is calculated.
6. Candidates are ranked automatically.
7. Dashboard displays analytics and selection insights.

---

## Future Enhancements

* Multi-Domain Recruitment Support
* Deep Learning-Based Resume Understanding
* LLM-Powered Candidate Evaluation
* ATS Compatibility Analysis
* Interview Question Generation
* Resume Improvement Suggestions
* Cloud Deployment
* Database Integration
* Multi-User Authentication System

---

## Applications

* HR Recruitment Teams
* Talent Acquisition Platforms
* Campus Placement Drives
* Resume Screening Automation
* Candidate Ranking Systems
* Recruitment Analytics

---


