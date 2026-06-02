# backend/parser_engine.py
from __future__ import annotations

import pytesseract
from PIL import Image
import json
import os
import re
from typing import Dict, List, Optional, Tuple

import fitz  # PyMuPDF
import spacy
from docx import Document
from PIL import Image
from PIL import ImageEnhance
import pytesseract
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
from sentence_transformers import SentenceTransformer, util
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


# ============================================================
# NLP / ML MODEL LOAD
# ============================================================

try:
    nlp = spacy.load("en_core_web_sm")
except Exception:
    # Safe fallback if model is not available
    nlp = spacy.blank("en")

try:
    semantic_model = SentenceTransformer("all-MiniLM-L6-v2")
except Exception:
    semantic_model = None


# ============================================================
# FILE TEXT EXTRACTION
# ============================================================

def extract_text_from_file(file_path: str) -> Optional[str]:
    """
    Supports: PDF, DOCX, DOC, TXT, PNG, JPG, JPEG, TIFF, BMP
    Returns extracted text or None.
    """
    if not file_path or not os.path.exists(file_path):
        print(f"Error: File not found -> {file_path}")
        return None

    ext = os.path.splitext(file_path)[1].lower().lstrip(".")
    text = ""

    try:
        if ext == "pdf":
            doc = fitz.open(file_path)
            for page in doc:
                text += page.get_text() + "\n"
            doc.close()

        elif ext in {"docx", "doc"}:
            doc = Document(file_path)
            for para in doc.paragraphs:
                text += para.text + "\n"

        elif ext == "txt":
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()

        elif ext in {"png", "jpg", "jpeg", "tiff", "bmp"}:
            image = Image.open(file_path)
            # Convert to grayscale
            image = image.convert("L")

            # Increase contrast
            enhancer = ImageEnhance.Contrast(image)
            image = enhancer.enhance(2)

            # OCR extraction
            text = pytesseract.image_to_string(
            image,
            config="--oem 3 --psm 6"
            )

            print("\n===== OCR EXTRACTED TEXT =====")
            print(text)
            print("=============================\n")
        
        else:
            print(f"Unsupported file format: .{ext}")
            return None

        return text.strip()

    except Exception as e:
        print(f"Error extracting text from file: {e}")
        return None


# ============================================================
# TEXT CLEANING
# ============================================================

def clean_text(text: str) -> str:
    if not text:
        return ""

    text = text.lower()
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"[^a-z0-9@\.\+\-/#\s]", " ", text)

    doc = nlp(text)
    cleaned_tokens: List[str] = []

    for token in doc:
        if token.is_space or token.is_punct or token.is_stop:
            continue

        lemma = token.lemma_.strip() if hasattr(token, "lemma_") else token.text.strip()
        if not lemma or lemma == "-pron-":
            lemma = token.text.strip()

        if lemma:
            cleaned_tokens.append(lemma.lower())

    return " ".join(cleaned_tokens)


# ============================================================
# CONTACT / NAME EXTRACTION
# ============================================================

def extract_contact_info(text: str) -> Dict[str, Optional[str]]:
    email_pattern = r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"
    phone_pattern = r"(\+?\d[\d\s\-\(\)]{8,}\d)"

    email_match = re.search(email_pattern, text or "")
    phone_match = re.search(phone_pattern, text or "")

    phone = phone_match.group(1).strip() if phone_match else None
    if phone:
        phone = re.sub(r"\s+", " ", phone)

    return {
        "email": email_match.group(0) if email_match else None,
        "phone": phone,
    }


def extract_name_robust(text: str) -> str:
    if not text:
        return "Name Not Found"

    top_text = text[:1200]
    lines = [line.strip() for line in top_text.splitlines() if line.strip()]

    email_pattern = r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"
    phone_pattern = r"(\+?\d[\d\s\-\(\)]{8,}\d)"

    # Heuristic 1: name appears near email/phone in the top area
    for i, line in enumerate(lines):
        if re.search(email_pattern, line) or re.search(phone_pattern, line):
            for j in range(max(0, i - 3), i):
                candidate = lines[j]
                clean_name = re.sub(r"[^A-Za-z\s]", "", candidate).strip()
                if 2 <= len(clean_name.split()) <= 4 and len(clean_name) > 3:
                    return clean_name.title()

    # Heuristic 2: use email prefix if available
    email_match = re.search(email_pattern, top_text)
    if email_match:
        prefix = email_match.group(0).split("@")[0]
        prefix = re.sub(r"[._0-9]+", " ", prefix).strip()
        if 2 <= len(prefix.split()) <= 4:
            return prefix.title()

    # Heuristic 3: spaCy PERSON entity
    try:
        doc = nlp(top_text[:1000])
        for ent in doc.ents:
            if ent.label_ == "PERSON":
                cleaned = ent.text.replace("\n", " ").strip()
                if 2 <= len(cleaned.split()) <= 4:
                    return cleaned.title()
    except Exception:
        pass

    # Heuristic 4: first sensible line
    for line in lines[:10]:
        if "@" in line or re.search(r"\d", line):
            continue
        clean_name = re.sub(r"[^A-Za-z\s]", "", line).strip()
        if 2 <= len(clean_name.split()) <= 4 and len(clean_name) > 3:
            return clean_name.title()

    return "Name Not Found"


# ============================================================
# SECTION SEGMENTATION
# ============================================================

def _extract_section(text: str, start_labels: List[str], end_labels: List[str]) -> str:
    upper = text.upper()

    start_positions = []
    for label in start_labels:
        idx = upper.find(label.upper())
        if idx != -1:
            start_positions.append(idx)

    if not start_positions:
        return ""

    start = min(start_positions)
    search_area = upper[start + 1 :]

    end_positions = []
    for label in end_labels:
        idx = search_area.find(label.upper())
        if idx != -1:
            end_positions.append(start + 1 + idx)

    end = min(end_positions) if end_positions else len(text)
    return text[start:end].strip()


def segment_sections(text: str) -> Dict[str, str]:
    return {
        "education": _extract_section(
            text,
            start_labels=["EDUCATION", "ACADEMIC BACKGROUND", "QUALIFICATIONS"],
            end_labels=["WORK EXPERIENCE", "EXPERIENCE", "SKILLS", "CERTIFICATIONS", "CERTIFICATES", "PROJECTS"],
        ),
        "experience": _extract_section(
            text,
            start_labels=["WORK EXPERIENCE", "EXPERIENCE", "PROFESSIONAL EXPERIENCE", "EMPLOYMENT HISTORY"],
            end_labels=["EDUCATION", "SKILLS", "CERTIFICATIONS", "CERTIFICATES", "PROJECTS"],
        ),
        "certifications": _extract_section(
            text,
            start_labels=["CERTIFICATIONS", "CERTIFICATES"],
            end_labels=["EDUCATION", "WORK EXPERIENCE", "EXPERIENCE", "SKILLS", "PROJECTS"],
        ),
        "skills": _extract_section(
            text,
            start_labels=["SKILLS", "TECHNICAL SKILLS", "CORE SKILLS"],
            end_labels=["EDUCATION", "WORK EXPERIENCE", "EXPERIENCE", "CERTIFICATIONS", "PROJECTS"],
        ),
    }


# ============================================================
# SKILL HIERARCHY
# ============================================================

skill_hierarchy = {
    # Core Languages
    "python": ["python", "backend", "scripting"],
    "java": ["java", "backend", "oop"],
    "c++": ["c++", "c", "oop", "systems"],
    "scala": ["scala", "backend", "jvm"],
    "javascript": ["javascript", "js", "frontend"],
    "html": ["html", "frontend", "web"],
    "css": ["css", "frontend", "web"],
    "typescript": ["typescript", "javascript", "frontend"],

    # Frameworks & Libraries
    "spring boot": ["spring boot", "spring", "java", "backend", "framework"],
    "react": ["react", "react.js", "javascript", "frontend", "ui"],
    "django": ["django", "python", "backend", "framework"],
    "flask": ["flask", "python", "backend", "framework"],

    # AI & ML
    "machine learning": ["machine learning", "ml", "ai", "artificial intelligence"],
    "artificial intelligence": ["artificial intelligence", "ai", "machine learning"],
    "ai": ["ai", "machine learning", "artificial intelligence"],
    "rag": ["rag", "llm", "ai", "generative ai"],
    "cnn": ["cnn", "deep learning", "machine learning", "computer vision"],
    "opencv": ["opencv", "computer vision", "image processing"],
    "keras": ["keras", "deep learning", "machine learning"],
    "tensorflow": ["tensorflow", "machine learning", "deep learning"],
    "pytorch": ["pytorch", "machine learning", "deep learning"],
    "scikit learn": ["scikit learn", "machine learning", "ml"],

    # Databases & Cloud
    "postgresql": ["postgresql", "postgres", "sql", "database", "backend"],
    "mysql": ["mysql", "sql", "database", "backend"],
    "sybase": ["sybase", "sql", "database"],
    "sql": ["sql", "database", "querying"],
    "mongodb": ["mongodb", "database", "nosql", "backend"],
    "aws": ["aws", "cloud", "amazon web services", "infrastructure"],
    "s3": ["s3", "aws", "cloud storage"],
    "athena": ["athena", "aws", "data analytics"],
    "gcp": ["gcp", "cloud", "google cloud"],
    "azure": ["azure", "cloud", "microsoft azure"],

    # Tools & Practices
    "git": ["git", "version control"],
    "jira": ["jira", "agile", "project management"],
    "swagger": ["swagger", "api", "documentation"],
    "jest": ["jest", "testing", "javascript"],
    "junit": ["junit", "testing", "java"],
    "docker": ["docker", "containers", "devops"],
    "kubernetes": ["kubernetes", "k8s", "devops"],
    "spark": ["spark", "big data", "data engineering"],
    "hadoop": ["hadoop", "big data", "data engineering"],
    
    "numpy": ["numpy", "python", "data science"], 
    "pandas": ["pandas", "python", "data analysis"], 
    "matplotlib": ["matplotlib", "visualization"], 
    "seaborn": ["seaborn", "visualization"], 
    "tableau": ["tableau", "dashboard", "visualization"], 
    "powerbi": ["powerbi", "dashboard", "visualization"], 
    "nlp": ["nlp", "natural language processing", "ai"], 
    "transformers": ["transformers", "huggingface", "nlp"], 
    "streamlit": ["streamlit", "python"], 
    "fastapi": ["fastapi", "python", "backend"], 
    "excel": ["excel", "analysis"],
}


# ============================================================
# SKILL EXTRACTION / MATCHING
# ============================================================

def extract_and_expand_skills(cleaned_text: str) -> List[str]:
    found_skills = set()
    normalized = f" {cleaned_text.lower()} "

    for trigger, expanded in skill_hierarchy.items():
        trigger_norm = trigger.lower().strip()

        if " " in trigger_norm:
            matched = ( trigger_norm in normalized 
            or trigger_norm.replace(" ", "") in normalized.replace(" ", "") )
        else:
            matched = re.search(rf"\b{re.escape(trigger_norm)}\b", cleaned_text.lower()) is not None

        if matched:
            found_skills.update(expanded)

    return sorted(found_skills)


def calculate_skill_overlap(resume_skills: List[str], job_skills: List[str]) -> Tuple[float, List[str]]:
    if not job_skills:
        return 0.0, []

    res_set = set(resume_skills)
    job_set = set(job_skills)
    matched = sorted(res_set.intersection(job_set))

    percentage = (len(matched) / max(len(job_set), 1)) * 100
    return round(percentage, 2), matched


# ============================================================
# SEMANTIC MATCHING
# ============================================================

def advanced_semantic_match(resume_text: str, job_desc_text: str) -> float:
    resume_text = resume_text or ""
    job_desc_text = job_desc_text or ""

    if not resume_text.strip() or not job_desc_text.strip():
        return 0.0

    try:
        if semantic_model is not None:
            res_embedding = semantic_model.encode(resume_text, convert_to_tensor=True)
            job_embedding = semantic_model.encode(job_desc_text, convert_to_tensor=True)
            semantic_score = util.cos_sim(res_embedding, job_embedding).item()
            return round(max(0.0, semantic_score) * 100, 2)

        # Fallback if sentence-transformers model is unavailable
        vectorizer = TfidfVectorizer()
        tfidf = vectorizer.fit_transform([resume_text, job_desc_text])
        score = cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0]
        return round(max(0.0, score) * 100, 2)

    except Exception as e:
        print(f"Semantic match error: {e}")
        return 0.0


# ============================================================
# EXPERIENCE / EDUCATION / CERTIFICATIONS PARSING
# ============================================================

def _looks_like_duration(line: str) -> bool:
    line = line.lower()
    return bool(
        re.search(r"\b(19|20)\d{2}\b", line)
        or "present" in line
        or "current" in line
        or re.search(r"\bjan\b|\bfeb\b|\bmar\b|\bapr\b|\bmay\b|\bjun\b|\bjul\b|\baug\b|\bsep\b|\boct\b|\bnov\b|\bdec\b", line)
    )


def _split_blocks(section_text: str) -> List[List[str]]:
    raw_blocks = re.split(r"\n\s*\n+", section_text.strip())
    blocks: List[List[str]] = []

    for block in raw_blocks:
        lines = [re.sub(r"^[•\-\*\u2022]\s*", "", ln.strip()) for ln in block.splitlines()]
        lines = [ln for ln in lines if ln]
        if lines:
            blocks.append(lines)

    return blocks


def _build_experience_list(section_text: str) -> List[Dict[str, str]]:
    entries: List[Dict[str, str]] = []
    blocks = _split_blocks(section_text)

    for block in blocks[:6]:
        title = block[0] if block else "Role"
        company = "Company"
        duration = ""
        desc_parts: List[str] = []

        for line in block[1:]:
            if not duration and _looks_like_duration(line):
                duration = line
            elif company == "Company":
                company = line
            else:
                desc_parts.append(line)

        entries.append({
            "title": title[:120],
            "company": company[:120],
            "duration": duration[:80],
            "description": " ".join(desc_parts).strip()[:300],
        })

    if not entries:
        entries = [{
            "title": "Experienced Professional",
            "company": "Various",
            "duration": "Present",
            "description": "Relevant industry experience",
        }]

    return entries


def _build_education_list(section_text: str) -> List[Dict[str, str]]:
    entries: List[Dict[str, str]] = []
    blocks = _split_blocks(section_text)

    for block in blocks[:6]:
        degree = block[0] if block else "Degree"
        institution = "Institution"
        year = ""

        for line in block[1:]:
            if not year:
                year_match = re.search(r"\b(19|20)\d{2}\b", line)
                if year_match:
                    year = year_match.group(0)
                    continue

            if institution == "Institution":
                institution = line

        entries.append({
            "degree": degree[:140],
            "institution": institution[:140],
            "year": year,
        })

    if not entries:
        entries = [{
            "degree": "Bachelor's Degree",
            "institution": "University",
            "year": "",
        }]

    return entries


def _build_certifications_list(section_text: str, full_text: str) -> List[str]:
    certs: List[str] = []

    if section_text.strip():
        lines = [re.sub(r"^[•\-\*\u2022]\s*", "", ln.strip()) for ln in section_text.splitlines()]
        lines = [ln for ln in lines if ln]
        for line in lines:
            if len(line) > 2:
                certs.append(line[:120])

    # Light keyword-based fallback
    if not certs:
        patterns = [
            r"AWS Certified[^\n,;]*",
            r"Google Cloud Certified[^\n,;]*",
            r"Microsoft Certified[^\n,;]*",
            r"Oracle Certified[^\n,;]*",
            r"MongoDB Certified[^\n,;]*",
            r"Certified [^\n,;]*",
        ]
        for pat in patterns:
            matches = re.findall(pat, full_text, flags=re.IGNORECASE)
            for m in matches:
                cleaned = m.strip()
                if cleaned and cleaned not in certs:
                    certs.append(cleaned[:120])

    return certs[:10]


# ============================================================
# MAIN RESUME PROCESSING
# ============================================================

def process_resume(resume_text: str, job_description: str) -> Dict:
    resume_text = resume_text or ""
    job_description = job_description or ""

    cleaned_resume = clean_text(resume_text)
    cleaned_job = clean_text(job_description)

    name = extract_name_robust(resume_text)
    contact = extract_contact_info(resume_text)
    sections = segment_sections(resume_text)

    resume_skills = extract_and_expand_skills(cleaned_resume)
    job_skills = extract_and_expand_skills(cleaned_job)

    overlap_score, matched_skills = calculate_skill_overlap(resume_skills, job_skills)
    print("Resume Skills:", resume_skills)
    print("Job Skills:", job_skills)
    print("Matched Skills:", matched_skills)

    raw_semantic_score = advanced_semantic_match(cleaned_resume, cleaned_job)
    normalized_semantic_score = min(raw_semantic_score * 1.5, 100.0)

    final_score = round((overlap_score * 0.75) + (normalized_semantic_score * 0.25), 2)

    experience = _build_experience_list(sections.get("experience", ""))
    education = _build_education_list(sections.get("education", ""))
    certifications = _build_certifications_list(
        sections.get("certifications", ""),
        resume_text
    )

    parsed_data = {
        "name": name,
        "email": contact.get("email"),
        "phone": contact.get("phone"),
        "skills": resume_skills[:25],
        
        "matched_skills": matched_skills, 
        "missing_skills": list(set(job_skills) - set(matched_skills)),
        
        "experience": experience,
        "education": education,
        "certifications": certifications,
        "score": final_score,
        "candidate_profile": {
            "name": name,
            "email": contact.get("email"),
            "phone": contact.get("phone"),
        },
        "extracted_skills": resume_skills[:25],
        "job_matching": {
            "required_skills_found": matched_skills,
            "skill_overlap_score": f"{overlap_score:.2f}%",
            "semantic_match_score": f"{normalized_semantic_score:.2f}%",
            "final_recommendation_score": f"{final_score:.2f}%",
            "FINAL_RECOMMENDATION_SCORE": f"{final_score:.2f}%",
        },
        "sections": sections,
    }

    return parsed_data

def analyze_resume(file_path: str, job_description_text: str):

    raw_resume_text = extract_text_from_file(file_path)

    print("========== EXTRACTED TEXT ==========")
    print(raw_resume_text)
    print("====================================")

    if not raw_resume_text:
        return {
            "success": False,
            "message": "Could not extract text from resume"
        }

    final_json_output = process_resume(
        raw_resume_text,
        job_description_text
    )

    return {
        "success": True,
        "data": final_json_output
    }