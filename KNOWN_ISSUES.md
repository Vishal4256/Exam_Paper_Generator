# Known Issues & Limitations (v2.0 RC1)

## Current Limitations
- **PDF/DOCX Uploads:** Currently, the Import Wizard only supports structured formats (CSV, Excel, JSON). Extracting structured questions directly from PDF or DOCX documents requires OCR and AI processing, which is deferred to a future AI-powered Import Module.
- **Image Cloud Storage:** By default, images uploaded in the Rich Text Editor are stored on the local backend disk. For production deployments (Vercel/Render), it is recommended to hook up Cloudinary to the abstract `ImageService.js` to ensure images persist across dynamic container restarts.
- **Mobile Editor:** The Rich Text Editor's advanced formatting toolbar can feel cramped on very small mobile screens (< 375px width).

## Planned Fixes & Roadmap (Phase 3)
- Integration of an **Exam Blueprint Analyzer** to evaluate exam quality, topic coverage, and difficulty distribution dynamically.
- Detailed question usage analytics and student performance insights.
- Integration of Cloudinary for seamless image hosting.
