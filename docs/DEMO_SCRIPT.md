# ExamFlow Demo Script (5 Minutes)

This script is designed for a concise, high-impact 5-minute product demonstration, ideal for recruiters and portfolio presentations.

---

### Minute 1: The Foundation
**Focus:** Dashboard, Login, Analytics

* **0:00 - 0:15 | Introduction & Login:** Start on the login screen. Briefly mention JWT authentication and role-based access. Log in smoothly.
* **0:15 - 0:40 | Dashboard Overview:** Land on the main dashboard. Highlight the clean, modern UI (TailwindCSS) and dark/light mode toggle.
* **0:40 - 1:00 | High-Level Analytics:** Point out the top-level stats (Total Questions, Exams Generated). Explain that this gives institutions an immediate pulse on their repository.

---

### Minute 2: Content Creation & Quality
**Focus:** Question Bank, Rich Editor, Question Quality

* **1:00 - 1:20 | Question Bank:** Navigate to the Question Bank. Demonstrate the speed of the global search and the advanced filtering capabilities.
* **1:20 - 1:45 | Rich Text Editor:** Open a question to edit. Show off the TipTap editor. Type out a quick math equation using KaTeX and insert a table. Emphasize how this solves a major pain point for STEM educators.
* **1:45 - 2:00 | Question Quality:** Show the AI Question Quality score. Explain how the system evaluates readability and Bloom's Taxonomy level.

---

### Minute 3: The Core Engine
**Focus:** Generate Exam, Blueprint Analyzer, Optimize

* **2:00 - 2:25 | Exam Generation Setup:** Go to "Generate Exam". Configure a blueprint (e.g., 50 questions, Medium difficulty, Java).
* **2:25 - 2:45 | Blueprint Analyzer:** Before generating, click the "Analyze Blueprint" button. Show the AI evaluating the balance of the exam and offering suggestions.
* **2:45 - 3:00 | Generation & Optimization:** Generate the exam. Briefly show the result and mention how the algorithm intelligently shuffles and selects questions to match the blueprint perfectly.

---

### Minute 4: Insights & Health
**Focus:** Analytics Dashboard, AI Health Center

* **3:00 - 3:30 | Deep Dive Analytics:** Navigate to the detailed Analytics Dashboard. Show the charts (difficulty distribution, subject coverage). Mention the MongoDB aggregation pipelines powering these insights.
* **3:30 - 4:00 | AI Health Center:** Open the AI Health Center. Demonstrate how the system monitors the question bank for gaps (e.g., "You need more Hard questions in Database Systems").

---

### Minute 5: Final Polish & Export
**Focus:** PDF, Import Wizard, Deployment

* **4:00 - 4:20 | PDF Export:** Go back to the generated exam and click "Export to PDF". Open the generated PDF to show that the high-fidelity math equations and tables rendered perfectly via server-side generation.
* **4:20 - 4:45 | Import Wizard:** Briefly showcase the 5-step Import Wizard. Highlight the Hybrid Duplicate Detection (Exact Match + Fuse.js fuzzy matching) that prevents database pollution.
* **4:45 - 5:00 | Deployment & Outro:** Conclude by mentioning the architecture (Vercel for Frontend, Render/Heroku for Backend) and thank the viewer.
