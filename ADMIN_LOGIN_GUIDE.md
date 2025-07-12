# OwlPath Admin & Demo User Credentials

## 👑 Admin Superuser Account

**Username:** `admin`  
**Password:** `admin123!`  
**Email:** admin@owlpath.com  
**Role:** Platform Administrator  
**Privileges:** Full access to Django admin panel and all platform features

### Admin Capabilities:
- Access Django admin panel at `/admin/`
- Manage all users, questions, answers, and content
- Moderate discussions and handle reports
- View analytics and platform statistics
- Configure system settings and permissions
- Manage tags, categories, and site content

---

## 👤 Regular Demo Users

**All regular users password:** `demo123!`

| Username | Name | Role/Specialty | Reputation | Access Level |
|----------|------|----------------|------------|--------------|
| **alex_dev** | Alex Johnson | Full-stack Developer | 2,500 | Verified User |
| **sarah_python** | Sarah Chen | Python/ML Engineer | 3,200 | Verified User |
| **mike_js** | Mike Rodriguez | JavaScript Specialist | 1,800 | Verified User |
| **anna_student** | Anna Garcia | CS Student | 450 | Regular User |

---

## 🚀 Quick Access Guide

### 1. Start the Development Server
```bash
cd backend
python manage.py runserver
```

### 2. Access the Platform
- **Main Site:** http://localhost:8000
- **Admin Panel:** http://localhost:8000/admin/

### 3. Login Options

#### For Platform Administration:
- Username: `admin`
- Password: `admin123!`
- Access: Full admin panel + platform features

#### For Regular User Experience:
- Username: `alex_dev`, `sarah_python`, `mike_js`, or `anna_student`
- Password: `demo123!`
- Access: Standard user features (questions, answers, voting, etc.)

---

## 📊 What You Can Explore

### As Admin User:
- **Django Admin Panel**: User management, content moderation
- **Platform Overview**: All questions, answers, and user activity
- **Content Management**: Edit/delete any content, manage featured posts
- **User Management**: Suspend users, verify accounts, manage roles
- **Analytics**: View platform statistics and user engagement

### As Regular Users:
- **Ask Questions**: Create detailed programming questions with tags
- **Answer Questions**: Provide solutions with code examples
- **Vote & Engage**: Upvote/downvote content, accept answers
- **Earn Reputation**: Gain points through quality contributions
- **Notifications**: Real-time updates on question activity
- **Profile Management**: Update bio, location, social links

---

## 🔧 Advanced Features to Test

### Content Features:
- Rich text editor with code syntax highlighting
- Tag-based organization (27 programming tags available)
- Bounty questions with reward points
- Featured and pinned content
- Image uploads and formatting

### User Features:
- Reputation system and badges
- User profiles with activity history
- Notification system for interactions
- Search and filtering capabilities
- Mobile-responsive design

### Admin Features:
- User role management (user/moderator/admin)
- Content moderation tools
- Analytics and reporting
- System configuration
- Bulk operations on content

---

## 📝 Notes

- **Admin account** has `is_superuser=True` and `is_staff=True`
- **All passwords** are set up automatically by the setup scripts
- **Demo data** includes realistic questions, answers, and interactions
- **Database** can be reset anytime with `python manage.py flush` + re-running setup
- **Production safety**: Never use these credentials in production environments

**Happy testing!** 🎉
