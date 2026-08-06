# ExamFlow Architecture

## High-Level Architecture

The following diagram illustrates the high-level architecture of ExamFlow, showing how the different components interact.

```mermaid
flowchart TD
    Browser[Browser / Client] --> React[React Frontend]
    React --> Express[Express API Backend]
    Express --> MongoDB[(MongoDB Atlas)]
    Express --> Gemini[Gemini AI Engine]
```

## Internal Architecture

The internal flow of the core "Generate Exam" feature, highlighting the AI integration and PDF generation process.

```mermaid
flowchart TD
    GenerateExam[Generate Exam Request] --> BlueprintAnalyzer[Blueprint Analyzer]
    BlueprintAnalyzer --> QuestionSelection[Question Selection Engine]
    QuestionSelection --> ExamGenerator[Exam Generator]
    ExamGenerator --> PDF[PDF Export Module]
    PDF --> History[Save to History & Drafts]
```
