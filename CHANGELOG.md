# ExamFlow Changelog

## [v2.0.0] - 2026-08-06

### Added
- **API Documentation**: Integrated Swagger UI for comprehensive API reference at `/api-docs`.
- **Import Wizard**: Full 5-step reactive workflow for bulk importing Questions via CSV, Excel, and JSON files. Auto-detects columns and provides granular control.
- **Hybrid Duplicate Detection**: Uses exact string matching combined with fuzzy logic (Fuse.js) during bulk imports to identify exact and near-match duplicates, giving the user the option to Skip, Replace, or Import as New.
- **Rich Text Editor**: Integrated TipTap for question/option formatting, complete with Markdown shortcuts, tables, images, and KaTeX mathematical equation support.
- **Bulk Action Operations**: Select multiple questions to simultaneously Archive, Delete, Restore, Duplicate, Tag, or re-categorize subject and difficulty.

### Changed
- **Schema Overhaul**: Migrated Questions from storing raw HTML or strings to a standardized JSON schema `{ content, plainText, htmlCache }`.
- **Stateless Backend Imports**: The `/api/import/execute` route now handles final decisions natively based on data submitted from the frontend preview.

### Improved
- **Advanced Global Search**: Expanded search capabilities across question text, topic, subject, and tags.

### Fixed
- Stabilized KaTeX rendering across the Rich Text Editor.
- Corrected issues where legacy string questions failed to render in the new Editor.

### Security
- Strengthened file upload mechanisms with strict MIME and size validations.
- Enhanced backend sanitization to prevent XSS in Rich Text JSON storage.

### Performance
- **Database Optimizations**: Finalized MongoDB compound and text indexes for complex querying.
- Drastically reduced server memory overhead during large bulk imports.

### Documentation
- Created extensive `docs/` folder containing Architecture diagrams, Database Schema ERDs, a Portfolio Case Study, API Reference, and Interview Guide.
