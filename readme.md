# StackIt – A Minimal Q&A Forum Platform

**Team:** Isha Rathore, Vishal Vyas, Jay Chhaniyara, and YashRaj Upadhyay

## Overview
StackIt is a minimal question-and-answer platform that supports collaborative learning and structured knowledge sharing. It's designed to be simple, user-friendly, and focused on the core experience of asking and answering questions within a community.

## User Roles
- **Guest**: View all questions and answers
- **User**: Register, log in, post questions/answers, vote
- **Admin**: Moderate content

## Core Features
- **Ask Questions**: Post questions with title, rich text description, and tags
- **Rich Text Editor**: Support for bold, italic, lists, emojis, links, images, and text alignment
- **Answer Questions**: Users can post formatted answers to any question
- **Voting System**: Upvote/downvote answers, accept answers as question owner
- **Tagging**: Organize questions with relevant tags
- **Notifications**: Bell icon with dropdown for answer notifications, comments, and mentions

## 🚀 Quick Start with Demo Data

To quickly explore OwlPath with realistic content, use our demo data setup:

### Option 1: Windows Users (Recommended)
```bash
# Navigate to backend directory
cd backend

# Run the PowerShell setup script
.\setup_demo.ps1

# Or use the batch file
.\setup_demo.bat
```

### Option 2: Command Line
```bash
# Navigate to backend directory
cd backend

# Apply migrations
python manage.py migrate

# Load comprehensive demo data
python manage.py populate_demo_data
```

### Option 3: Basic Fixtures Only
```bash
cd backend
python manage.py migrate
python manage.py loaddata fixtures/demo_users.json fixtures/demo_tags.json
```

**Demo Users & Password (all use: `demo123!`):**
- `alex_dev` - Full-stack developer (2500 reputation)
- `sarah_python` - Python/ML expert (3200 reputation)  
- `mike_js` - JavaScript specialist (1800 reputation)
- `anna_student` - CS student (450 reputation)

**What you get:**
- 8 diverse users with realistic profiles and reputation scores
- 17 programming tags (Python, Django, JavaScript, React, etc.)
- 10 detailed questions with code examples covering real programming scenarios
- Multiple answers with comprehensive explanations and code snippets
- Realistic voting patterns and user interactions
- Sample notifications and accepted answers

## 📁 Demo Data Features

The demo data includes:
- **Questions** covering Django optimization, React hooks, ML deployment, CSS layouts, Node.js debugging, Git workflows, and more
- **Code examples** in multiple programming languages
- **Realistic user interactions** including voting, accepted answers, and notifications
- **Varied difficulty levels** from beginner to advanced topics
- **Bounty questions** with reward points
- **Featured questions** for platform highlights

For more details, see `backend/fixtures/README.md`




## Team Members
- **Isha Rathore** - isharathore707@gmail.com | 8619106191
- **Vishal Vyas** - vishalvyas.developer@gmail.com | 9274043301
- **Jay Chhaniyara** - jaython.dev@gmail.com | 9023227593
- **YashRaj Upadhyay** - uyashraj8@gmail.com | 9537805539
