# ExamFlow - Portfolio Case Study

## Problem
Educational institutions and independent educators face significant friction when managing large question banks and generating balanced exams. Existing solutions often lack robust rich-text support (especially for math equations and tables), offer poor bulk-import experiences, and require tedious manual effort to balance an exam's difficulty and topic coverage.

## Objectives
- **Centralized Management:** Build a fast, searchable repository for thousands of questions.
- **Rich Media Support:** Ensure flawless handling of Markdown, KaTeX math equations, and images.
- **Intelligent Generation:** Automate the creation of balanced exams based on a configurable blueprint (e.g., 20 Easy, 10 Hard, specific topic distribution).
- **Frictionless Onboarding:** Provide a robust bulk-import wizard that detects duplicates and handles various file formats (CSV, Excel, JSON).

## Architecture
ExamFlow is built on the MERN stack (MongoDB, Express, React, Node.js) with a focus on modularity and performance.
- **Frontend:** React, Vite, TailwindCSS, TipTap (for rich text).
- **Backend:** Node.js, Express, JWT for stateless authentication.
- **Database:** MongoDB Atlas utilizing Text and Compound indexing.
- **AI Integration:** Google Gemini for Blueprint Analysis and Question Quality Evaluation.

## Challenges & Solutions

### 1. Rich Text JSON Migration & Storage
**Challenge:** Storing complex rich text (including inline HTML, block math, and images) securely while allowing it to be searchable.
**Solution:** We standardized on TipTap's JSON format for precise editing state, while simultaneously extracting and saving a sanitized `plainText` version of the content. This allows MongoDB to maintain a highly performant `$text` index for global search without indexing HTML tags.

### 2. Semantic Duplicate Detection during Bulk Imports
**Challenge:** Teachers importing legacy question banks often upload duplicate questions with minor typos or formatting differences.
**Solution:** Implemented a Hybrid Duplicate Detection engine. It first runs an Exact Match pass, followed by a Fuzzy Matching pass using `Fuse.js` on the plaintext representations of questions to flag potential duplicates before they pollute the database.

### 3. AI Timeout Handling and Deterministic Fallbacks
**Challenge:** AI services like Gemini can be slow or occasionally timeout during bulk operations or real-time blueprint analysis.
**Solution:** Architected the AI services with a strict timeout wrapper. If the AI fails to respond within the threshold, the system gracefully falls back to deterministic, rule-based algorithms (e.g., calculating exam difficulty using basic weighted averages) ensuring the user experience is never blocked.

### 4. Draft Race Conditions
**Challenge:** Auto-saving exams and questions could lead to race conditions where older payloads overwrite newer ones if network latency fluctuates.
**Solution:** Implemented optimistic concurrency control using versioning and debounced the auto-save functionality in React.

### 5. Analytics Cache Invalidation
**Challenge:** The Analytics Dashboard queries across the entire `questions` and `exams` collections, which is computationally expensive for real-time loading.
**Solution:** Implemented a caching layer for the aggregation pipelines. The cache is selectively invalidated only when bulk operations (like imports or mass deletions) occur, drastically reducing DB load.

## Performance
- **Search:** Global search across 10,000+ questions returns in under 50ms utilizing MongoDB Text Indexes.
- **PDF Generation:** Server-side PDF generation (`pdfkit`) handles 100-page exams with complex math equations in under 3 seconds.

## Results
- **v2.0.0 Stable Release:** Transitioned from a feature-heavy development phase to a highly polished, production-ready product.
- **User Experience:** Achieved a seamless, intuitive UI with command palette navigation and responsive design.

## Future Roadmap
- **Phase 3.4 (AI Productivity Suite):** Integrating a conversational AI Chat Assistant as the main entry point for generating and improving questions.
- **Student Portal:** Expanding the platform to allow students to take the generated exams digitally.
