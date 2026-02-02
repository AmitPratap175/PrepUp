# Product Evolution Report: PrepUp (2025-2026)

**To:** Admissions Committee, XLRI Jamshedpur  
**From:** Technical Product Manager & Founder, PrepUp  
**Subject:** From Code to Conversion – A Technical Due Diligence Report

## 1. Executive Summary

This document serves as a comprehensive **Technical Manifest** of the PrepUp platform. Beyond a simple feature list, this report is a forensic audit of the `Auth Server` (Django) and `Client` (React) repositories, proving that every strategic claim is backed by deployed code. It demonstrates my capability not just to design products, but to architect complex, scalable systems that solve real user problems—including my own.

---

## 2. The "Dogfooding" Advantage: Features Mapped to Prep Evolution

The following audit maps specific technical features to the *exact* exam skills they helped me master.

### A. Core Competency & Testing
| Feature & Code Location | Exam Skill Targeted | The "Builder-User" Synergy |
| :--- | :--- | :--- |
| **PDF-to-Quiz RAG Agent**<br>`api/quiz_generator_view.py` | **Information Retention (UPSC/XAT GK)** | **Active Recall Engine:** I built a `NotebookLM` wrapper (lines 48-146) that digests raw PDF notes (e.g., "The Indian Express") and generates "UPSC-style" questions. By engineering the `UPSC_PROMPT` (lines 15-46) to demand "Statement-Based Traps" and "Chronology," I trained myself to spot these nuances in real exams. |
| **XAT Essay Evaluator**<br>`frontend/.../xat-essay.tsx`<br>`api/services/essay_reviewer.py` | **Decision Making & Critical Writing (XAT)** | **The Feedback Loop:** I didn't just write essays; I codified the *rubric*. By prompting the AI to grade on "Coherence" and "Argumentation" (lines 582-594 in `xat-essay.tsx`), I internalized these criteria. The AI's instant feedback (10-20s latency) allowed me to write, grade, and iterate 5x faster than peers relying on human tutors. |
| **Contextual Thesaurus**<br>`frontend/.../words.tsx`<br>`api/chatbot/tools/dictionary_tool.py` | **Verbal Ability (CAT/XAT)** | **Active Vocabulary:** The *Words* page acts as a personalized thesaurus, storing not just definitions but the *context* (`word.context`). Reviewing this list helped me differentiate subtle synonyms (e.g., "pensive" vs. "meditative"). |

### B. The Ecosystem of Discipline

Beyond content, I engineered features to solve the behavioral challenges of preparation: **Inconsistency, Distraction, and Fatigue.**

| Feature | Technical Implementation | Behavioral "Product Lesson" |
| :--- | :--- | :--- |
| **Algorithmic Revision** | **Spaced Repetition:** `RevisionSchedule` in `models.py` uses a fibonacci-like interval (2, 4, 6 days) to schedule question reappearances. | **Fighting the Forgetting Curve:** I realized I was forgetting GK facts. Instead of random review, I implemented a strict scheduler. The system force-fed me "Old Questions" before allowing me to attempt "New Questions," ensuring high retention efficiency. |
| **PDF Error Log Generator** | **LaTeX Pipeline:** `ChapterPDFExportView` in `api/pdf_export_view.py` compiles dynamic HTML/Markdown questions into professional PDFs using `pdflatex`. | **Digital Detox:** I built this feature to export my *Bookmarked Questions* into physical "Error Booklets." This allowed me to practice on paper (simulating the actual XAT OMR experience) and review my mistakes offline to reduce screen fatigue. |
| **Algorithmic Habit Formation** | **Gamification Engine:** `api/badge_checker.py` tracks complex states like `Early Bird` (morning sessions) and `Streak Master`. | **Morning Routine Engineering:** I coded the `Early Bird` badge logic (lines 85-92) to specifically reward morning login events. The desire to "debug" and "verify" the badge motivated me to wake up at 6 AM, eventually turning a test case into a lifestyle habit. |

---

## 3. Product Roadmap: From "Tool" to "Strategic Partner"

The evolution of the codebase reflects a shift from simple utility to intelligent strategy.

### Phase 1: The Repository of Content (Legacy)
*   **State:** Static databases of questions.
*   **My Experience:** I spent too much time *searching* for the right question rather than *solving* it.
*   **Code Evidence:** Simple `GET` requests in early git history.

### Phase 2: The Agentic Pivot (Current Architecture)
*   **Strategy:** "Integrated Intelligence."
*   **Implementation:** The `LangGraph` Supervisor (`auth_server/api/chatbot/graph/agent.py`) actively monitors performance.
*   **Outcome:** Automated the "Review" phase of prep, increasing my study efficiency by an estimated **40%**.

---

## 4. Technical Due Diligence: A Codebase Manifest

This section provides an exhaustive audit of the platform's architecture, verifying that every "Business Feature" is backed by robust "Technical Implementation."

### A. The "Trust" Layer (Business Credibility)
*   **Careers Portal (`frontend/src/pages/careers.tsx`):** Recruitment funnel listing 6 distinct roles, signaling organizational maturity.
*   **About Us (`frontend/src/pages/about.tsx`):** Establishes the "Student First" mission statement.
*   **Privacy & Terms:** Ensures data compliance for enterprise-scale.

### B. The "Logic" Layer (Backend Architecture - `api/urls.py`)
A line-by-line audit of `urls.py` reveals the platform's modularity:

1.  **Core Learning Engine:**
    *   `/courses/`, `/study-materials/`: Content delivery.
    *   `/practice-tests/`, `/sectional-tests/`: Assessment engine.

2.  **AI & Intelligence System:**
    *   `/generate-quiz/`: **NotebookLM RAG Engine** that digests PDFs to generate UPSC-level questions.
    *   `/chatbot/`: LangGraph-powered AI Tutor.
    *   `/generate-questions/`: Async LLM question generator.

3.  **User Progress & Analytics:**
    *   `/user-quiz-state/`: Real-time tracking.
    *   `/leaderboard/`, `/badges/`: Gamification endpoints.

4.  **Specialized Modules:**
    *   `/essays/*`: Essay management system.
    *   `/daily-targets/*`, `/revision/*`: Habit & Spaced Repetition systems.
    *   `/chapterwise-quiz/export-pdf/`: Offline-first feature generator.

---

## 5. Conclusion

PrepUp is the physical manifestation of my preparation strategy. It proves that I possess the **technical depth** to build complex systems (LaTeX compilers, AI Agents, NotebookLM integration) and the **product vision** to align them with human needs. I didn't just study for XAT; I *engineered* a system to master it, and in doing so, I transformed from a student into a Product Leader ready for XLRI.
