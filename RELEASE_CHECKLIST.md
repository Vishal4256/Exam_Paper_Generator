# ExamFlow v2.0 RC1 Release Checklist

To ensure a stable release, the following manual end-to-end verifications must be performed before officially tagging v2.0:

## 1. Authentication & Users
- [ ] Sign up as a new user.
- [ ] Log out and log back in successfully.
- [ ] Request a password reset and verify the flow.

## 2. Dashboard
- [ ] Verify recent activity feeds update instantly after question creation/imports.
- [ ] Verify global statistics (Total Questions, Exams) display accurately.
- [ ] Ensure loading skeletons hide correctly after data fetch.

## 3. Question Bank & Search
- [ ] Perform a search for a specific term and verify debounce (500ms).
- [ ] Apply multiple compound filters (Subject + Difficulty + Type).
- [ ] Verify pagination works and retains filter states via URL parameters.

## 4. Rich Text Editor
- [ ] Create a new question with bold, italics, lists, and an image.
- [ ] Insert KaTeX math (inline and block) and verify preview.
- [ ] Insert a table and modify columns/rows.
- [ ] Save the question, reload the page, and verify the formatting is 100% retained.

## 5. Import Wizard
- [ ] Upload a valid CSV containing 50+ questions.
- [ ] Map columns manually.
- [ ] View the validation summary (ensure errors are flagged correctly for missing answers).
- [ ] Review duplicates and apply 'Skip' and 'Replace' decisions.
- [ ] Complete import and verify the questions appear in the Question Bank.

## 6. Bulk Operations
- [ ] Select 10 questions using shift-click or select-all.
- [ ] Apply a new Subject to all 10.
- [ ] Duplicate the selection.
- [ ] Archive the duplicated questions, then restore them.
- [ ] Permanently delete the archived questions.

## 7. Exam Generation
- [ ] Create a new exam using manual selection.
- [ ] Ensure the selected rich text questions render identically in the Teacher/Student preview.
- [ ] Generate the PDF and verify tables, images, and math equations are intact.

## 8. Mobile & Browser
- [ ] Verify Question Bank usability on an iPhone/Android screen size.
- [ ] Verify the Rich Text Editor modal fits on small screens.
- [ ] Test across Chrome, Firefox, and Safari for visual parity.
