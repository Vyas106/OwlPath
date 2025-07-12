# StackIt Backend

A Django REST Framework backend for a Q&A platform inspired by StackOverflow.

## 🚀 Quick Setup

### Prerequisites
- Python 3.8+
- pip (Python package installer)

### Option 1: Automatic Setup (Recommended)

**For Windows PowerShell:**
```powershell
cd backend
.\setup.ps1
```

**For Command Prompt/Terminal:**
```bash
cd backend
python setup.py
```

### Option 2: Manual Setup

1. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Create Database Migrations:**
   ```bash
   python manage.py makemigrations accounts
   python manage.py makemigrations questions
   python manage.py makemigrations tags
   python manage.py makemigrations answers
   python manage.py makemigrations votes
   python manage.py makemigrations notifications
   ```

3. **Apply Migrations:**
   ```bash
   python manage.py migrate
   ```

4. **Create Superuser:**
   ```bash
   python manage.py createsuperuser
   ```

5. **Start Development Server:**
   ```bash
   python manage.py runserver
   ```

## 📚 API Documentation

Once the server is running, visit:
- **Swagger UI:** http://localhost:8000/swagger/
- **ReDoc:** http://localhost:8000/redoc/
- **Admin Panel:** http://localhost:8000/admin/

## 🏗️ Project Structure

```
backend/
├── accounts/          # User authentication & profiles
├── questions/         # Question management
├── answers/           # Answer management
├── votes/             # Voting system
├── tags/              # Tag management
├── notifications/     # Real-time notifications
├── stackit/           # Django project settings
├── manage.py
├── requirements.txt
└── .env              # Environment variables
```

## 🔧 Environment Configuration

Copy `.env.example` to `.env` and update the values:

```env
DEBUG=True
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///db.sqlite3
ALLOWED_HOSTS=localhost,127.0.0.1
```

For production with PostgreSQL (Neon):
```env
DATABASE_URL=postgresql://username:password@host:port/database_name
```

## 🌟 Features

- ✅ JWT Authentication
- ✅ User Management & Profiles
- ✅ Questions & Answers
- ✅ Voting System
- ✅ Tag Management
- ✅ Real-time Notifications (WebSocket)
- ✅ Admin Panel
- ✅ API Documentation
- ✅ CORS Support
- ✅ PostgreSQL Support (Neon compatible)

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `GET /api/auth/profile/` - Get user profile

### Questions
- `GET /api/questions/` - List questions
- `POST /api/questions/` - Create question
- `GET /api/questions/{slug}/` - Get question details
- `PUT /api/questions/{slug}/` - Update question

### Answers
- `GET /api/answers/question/{slug}/` - List answers for question
- `POST /api/answers/question/{slug}/` - Create answer
- `GET /api/answers/{id}/` - Get answer details

### Voting
- `POST /api/votes/question/{slug}/` - Vote on question
- `POST /api/votes/answer/{id}/` - Vote on answer

### Tags
- `GET /api/tags/` - List tags
- `POST /api/tags/` - Create tag
- `GET /api/tags/popular/` - Popular tags

### Notifications
- `GET /api/notifications/` - List notifications
- `GET /api/notifications/unread/` - Unread notifications
- `POST /api/notifications/{id}/mark-read/` - Mark as read

## 🔌 WebSocket

Real-time notifications are available at:
```
ws://localhost:8000/ws/notifications/
```

## 🧪 Development Commands

```bash
# Run tests
python manage.py test

# Create superuser
python manage.py createsuperuser

# Shell access
python manage.py shell

# Check for issues
python manage.py check

# Collect static files
python manage.py collectstatic
```
