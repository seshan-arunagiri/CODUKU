# CodeHouses - Competitive Coding Platform

A full-stack competitive coding platform with a **House System** where students are divided into 4 houses and compete through coding challenges. Built with **Python (Flask)**, **React**, and **MongoDB**.

## 🏆 Features

### Core Features
- **House System**: Students divided into 4 houses (Gryffindor, Hufflepuff, Ravenclaw, Slytherin)
- **Smart Question Allocation**: Problems assigned based on difficulty (Easy, Medium, Hard)
- **Code Execution Engine**: Execute and judge Python, C++, and Java code
- **Dynamic Scoring System**: Points based on difficulty, accuracy, and speed
- **Real-time Leaderboards**: Global and house-wise rankings
- **House Standings**: Track collective house scores
- **Admin Dashboard**: Create and manage coding problems

### Additional Features
- **User Authentication**: JWT-based authentication
- **Submission History**: Track all user submissions
- **Problem Difficulty Filters**: View questions by difficulty level
- **Performance Analytics**: View personal and house statistics
- **Responsive Design**: Works on desktop and mobile devices

## 🛠 Tech Stack

### Backend
- **Framework**: Flask (Python)
- **Database**: MongoDB
- **Authentication**: Flask-JWT-Extended
- **Security**: Werkzeug for password hashing
- **API Style**: RESTful

### Frontend
- **Framework**: React 18
- **Styling**: CSS3 with CSS Variables
- **State Management**: React Hooks
- **HTTP Client**: Fetch API
- **Design**: Modern gradient-based UI with house themes

## 📋 Prerequisites

- Python 3.8+
- Node.js 14+ and npm
- MongoDB (local or Atlas)
- Git

## 🚀 Quick Start

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables (create .env file)
FLASK_ENV=development
MONGO_URI=mongodb://localhost:27017/coding_platform
JWT_SECRET_KEY=your-super-secret-key-change-in-production

# Run Flask server
python app.py
```

The backend will run on `http://localhost:5000`

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

The frontend will run on `http://localhost:3000`

### 3. Database Setup

```bash
# Start MongoDB
mongod

# In MongoDB shell, create the database and collections
use coding_platform

# Create indexes for better performance
db.users.createIndex({ "email": 1 }, { "unique": true })
db.questions.createIndex({ "difficulty": 1 })
db.submissions.createIndex({ "user_id": 1, "submitted_at": -1 })
db.submissions.createIndex({ "question_id": 1 })
```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}

Response:
{
  "message": "User registered successfully",
  "access_token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "house": "Gryffindor",
    "role": "student"
  }
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Question Endpoints

#### Get All Questions
```
GET /api/questions?difficulty=Easy&language=python
Authorization: Bearer {token}

Response: [
  {
    "_id": "question_id",
    "title": "Two Sum",
    "description": "Find two numbers that add up to target",
    "difficulty": "Easy",
    "test_cases": [...],
    "time_limit": 5,
    "memory_limit": 256
  }
]
```

#### Get Specific Question
```
GET /api/questions/{question_id}
Authorization: Bearer {token}
```

#### Create Question (Admin Only)
```
POST /api/admin/questions
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Two Sum",
  "description": "Find two numbers...",
  "difficulty": "Easy",
  "test_cases": [
    {
      "input": [2, 7, 11, 15],
      "output": [0, 1],
      "function_name": "solution"
    }
  ],
  "solution": "def solution(arr): ...",
  "time_limit": 5,
  "memory_limit": 256
}
```

### Submission Endpoints

#### Submit Code
```
POST /api/submit
Authorization: Bearer {token}
Content-Type: application/json

{
  "question_id": "q_id",
  "code": "def solution(arr): return arr[0] + arr[1]",
  "language": "python"
}

Response:
{
  "submission_id": "sub_id",
  "score": 95.5,
  "passed_tests": 5,
  "total_tests": 5,
  "execution_result": {...}
}
```

### Leaderboard Endpoints

#### Global Leaderboard
```
GET /api/leaderboards/global
Authorization: Bearer {token}

Response: [
  {
    "rank": 1,
    "name": "John Doe",
    "house": "Gryffindor",
    "average_score": 95.5,
    "problems_solved": 12,
    "submissions": 25
  }
]
```

#### House Leaderboard
```
GET /api/leaderboards/houses
Authorization: Bearer {token}

Response: [
  {
    "rank": 1,
    "house": "Ravenclaw",
    "average_score": 87.3,
    "members": 24,
    "total_score": 2095.2
  }
]
```

#### House Members
```
GET /api/leaderboards/house/{house_name}
Authorization: Bearer {token}
```

## 🎯 Scoring System

### Score Calculation

```
Score = Base Score × Difficulty Factor × Accuracy Bonus × Speed Bonus

Where:
- Base Score = 100
- Difficulty Factor = 1.0 (Easy), 1.5 (Medium), 2.5 (Hard)
- Accuracy Bonus = (tests_passed / total_tests) × 100%
- Speed Bonus = min(1.2, 1.0 + (300 - time_taken) / 1500)
```

### House Score
```
House Score = Σ(Member Average Scores) / Number of Members
```

## 📁 Project Structure

```
coding-platform/
├── backend/
│   ├── app.py                 # Main Flask application
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # Environment variables
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.js             # Main component
│   │   ├── App.css
│   │   ├── pages/
│   │   │   ├── AuthPage.js
│   │   │   ├── Dashboard.js
│   │   │   ├── CodeEditor.js
│   │   │   ├── Leaderboards.js
│   │   │   ├── AdminPanel.js