# ExamFlow Interview Guide

This document contains talking points and answers for technical interviews regarding the development of ExamFlow.

## Architecture
**Q: Describe the high-level architecture of ExamFlow.**
**A:** ExamFlow uses a standard MERN stack. The React frontend (Vite) communicates via REST APIs with the Node.js/Express backend. Data is persisted in MongoDB Atlas. For AI features, the backend securely communicates with the Google Gemini API. The backend is entirely stateless, using JWTs for authentication, making it horizontally scalable.

## Why MERN
**Q: Why did you choose the MERN stack for this project?**
**A:** MERN allows for a unified language (JavaScript/TypeScript) across the stack. React's component-based architecture is perfect for the complex UI of an exam generator (drag-and-drop, rich text editing). Node.js handles asynchronous I/O efficiently, which is crucial for bulk CSV imports and PDF generation. MongoDB's document model perfectly maps to the hierarchical nature of exams and rich-text questions.

## AI Design
**Q: How is AI integrated into the platform?**
**A:** I designed modular AI services for Blueprint Analysis and Question Quality evaluation using Gemini. A critical design decision was implementing **deterministic fallbacks**. If the AI API times out or fails, the system falls back to rule-based algorithms so the user experience is never interrupted.

## MongoDB Design
**Q: How did you design the database to handle search and performance?**
**A:** I utilized MongoDB's `$text` indexes on a sanitized `plainText` version of the questions for sub-50ms global search. For the Analytics dashboard, I used Aggregation Pipelines to process data on the database side rather than loading everything into application memory. I also implemented caching for these expensive aggregations.

## Authentication
**Q: How is authentication handled?**
**A:** We use JSON Web Tokens (JWT). The tokens are signed on the backend and stored securely. This ensures the backend remains stateless. Passwords are hashed using `bcrypt` before being stored in the database.

## Deployment
**Q: How is the application deployed?**
**A:** The frontend is deployed as a static bundle on Vercel for edge caching and fast delivery. The backend is deployed on Render/Heroku as a Node service. Because the backend is stateless and uploads (if any) are handled via cloud storage or directly in the DB as text, it can scale easily.

## Optimizations
**Q: What performance optimizations did you implement?**
**A:**
1. **Database:** Compound indexes for common queries, Text indexes for search.
2. **Backend:** Rate limiting to prevent abuse, caching for analytics.
3. **Frontend:** Debouncing inputs (especially for the Draft auto-save feature) and using Skeleton loaders for perceived performance.

## Challenges
**Q: What was the hardest engineering challenge?**
**A:** Managing Rich Text JSON and Duplicate Detection during bulk imports. Saving TipTap's JSON structure is great for the editor, but terrible for search. I solved this by storing both the JSON state and a sanitized plaintext string. For duplicate detection, I implemented a hybrid approach: Exact Match followed by `Fuse.js` fuzzy matching on the plaintext to catch typos.

## Future Scope
**Q: Where do you see this project going next?**
**A:** The immediate next step (v2.1) is an AI Productivity Suite—a conversational interface where educators can say "Generate 10 Hard Java questions" and the system orchestrates the creation. After that, a Student Portal to allow digital test-taking and automated grading.
