# ExamFlow API Reference

This document provides a summary of the core API endpoints for ExamFlow. Full interactive documentation is available via Swagger at `/api-docs` when running the backend locally.

## Base URL
Local Development: `http://localhost:5000/api`
Production: `https://your-backend.onrender.com/api`

## Authentication
ExamFlow uses Bearer token authentication. 
Include the JWT token in the Authorization header for all protected routes:
`Authorization: Bearer <your_jwt_token>`

## Core Endpoints

### Questions

#### Get All Questions
**Endpoint:** `GET /questions`
**Description:** Retrieves a paginated list of questions. Supports search and filtering.
**Example Request:**
```http
GET /api/questions?page=1&limit=10&subject=Java&difficulty=Hard
```
**Example Response:**
```json
{
  "success": true,
  "count": 1,
  "pagination": { "current": 1, "total": 5 },
  "data": [
    {
      "_id": "60d5ecb54b5a452a8c512345",
      "type": "MCQ",
      "questionText": { "plainText": "What is polymorphism?" },
      "difficulty": "Hard",
      "subject": "Java"
    }
  ]
}
```

#### Create Question
**Endpoint:** `POST /questions`
**Description:** Creates a new question.
**Example Request:**
```json
{
  "type": "MCQ",
  "subject": "Java",
  "difficulty": "Medium",
  "questionText": { "plainText": "What is an interface?" },
  "options": [
    { "plainText": "A contract for classes" },
    { "plainText": "A concrete class" }
  ],
  "correctAnswer": 0
}
```

### Exams

#### Generate Blueprint
**Endpoint:** `POST /exams/generate`
**Description:** Analyzes a blueprint and generates a balanced exam based on available questions.
**Example Request:**
```json
{
  "title": "Midterm Exam",
  "blueprint": {
    "totalQuestions": 50,
    "subject": "Java",
    "distribution": { "Hard": 10, "Medium": 20, "Easy": 20 }
  }
}
```

## Error Codes
- `400 Bad Request`: Validation failed (e.g., missing required fields).
- `401 Unauthorized`: Missing or invalid JWT token.
- `403 Forbidden`: User does not have permission to access the resource.
- `404 Not Found`: Resource does not exist.
- `500 Internal Server Error`: Server-side failure (e.g., database connection issue).
