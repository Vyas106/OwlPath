# OwlPath Demo Data

This directory contains demo data for the OwlPath Q&A platform to help with development, testing, and demonstration purposes.

## Available Demo Data

### 1. Management Command (Recommended)
Use the custom Django management command to populate the database with comprehensive demo data:

```bash
python manage.py populate_demo_data
```

**Options:**
- `--clear`: Clear existing data before adding demo data

**What it creates:**
- 8 diverse users with realistic profiles, reputation scores, and badges
- 17 programming-related tags (Python, Django, JavaScript, React, etc.)
- 10 detailed questions covering various programming topics
- Multiple answers for each question with code examples
- Realistic voting patterns on questions and answers
- Notification examples

### 2. JSON Fixtures (Alternative)
Load individual fixtures using Django's loaddata command:

```bash
# Load users
python manage.py loaddata fixtures/demo_users.json

# Load tags  
python manage.py loaddata fixtures/demo_tags.json
```

## Demo Users

The demo data includes 8 users with different experience levels and specialties:

| Username | Role | Reputation | Specialty | Questions | Answers |
|----------|------|------------|-----------|-----------|---------|
| alex_dev | User | 2,500 | Full-stack (Django/React) | 45 | 125 |
| sarah_python | User | 3,200 | Python/ML | 30 | 180 |
| mike_js | User | 1,800 | JavaScript/Node.js | 25 | 95 |
| emma_data | User | 2,100 | Data Science | 20 | 85 |
| david_mobile | User | 1,500 | Mobile (Flutter/RN) | 35 | 60 |
| lisa_ux | User | 950 | UX/UI Design | 15 | 40 |
| tom_backend | User | 1,200 | Backend/Microservices | 18 | 55 |
| anna_student | User | 450 | Student | 28 | 15 |

**Login credentials for all demo users:**
- Password: `demo123!`

## Demo Questions

The questions cover realistic programming scenarios:

1. **Django Performance** - Optimizing querysets for large datasets (with bounty)
2. **React useState** - Understanding asynchronous state updates  
3. **ML Deployment** - Best practices for production ML models (featured)
4. **CSS Layout** - Grid vs Flexbox comparison
5. **Node.js Memory** - Debugging memory leaks (with bounty)
6. **Git Workflow** - Merge vs rebase strategies
7. **Flutter State** - Comparing state management solutions
8. **CORS Issues** - Handling cross-origin requests
9. **SQL Optimization** - Complex JOIN query performance
10. **Docker Security** - Container security best practices

## Demo Tags

17 programming tags with realistic usage counts and color coding:
- Core languages: Python, JavaScript, HTML, CSS, SQL
- Frameworks: Django, React, Node.js, Flutter
- Topics: Machine Learning, Database, API, Performance, Security
- Tools: Git, Docker, Debugging

## Usage Tips

### Development
```bash
# Fresh start with demo data
python manage.py flush --noinput
python manage.py populate_demo_data

# Add demo data to existing database
python manage.py populate_demo_data
```

### Testing
```bash
# Clear and repopulate for consistent testing
python manage.py populate_demo_data --clear
```

### Production (Don't use!)
⚠️ **Never run this on production!** This is for development only.

## Data Characteristics

- **Realistic content**: Questions and answers contain actual code examples
- **Varied engagement**: Different view counts, vote patterns, and activity levels
- **Complete workflows**: Accepted answers, notifications, user interactions
- **Diverse users**: Different reputation levels, specialties, and activity patterns
- **Recent timestamps**: Data spans the last 30 days for realistic feel

## Customization

To modify the demo data:

1. **Edit the management command**: `core/management/commands/populate_demo_data.py`
2. **Adjust user profiles**: Modify `users_data` array
3. **Change questions**: Update `questions_data` array  
4. **Add more tags**: Extend `tags_data` array
5. **Customize voting**: Adjust vote distribution weights

## File Structure

```
backend/
├── core/management/commands/
│   └── populate_demo_data.py      # Main management command
├── fixtures/
│   ├── demo_users.json           # User fixture data
│   ├── demo_tags.json            # Tag fixture data
│   └── README.md                 # This file
```

## Troubleshooting

**Command not found:**
```bash
# Make sure you're in the backend directory
cd backend
python manage.py populate_demo_data
```

**Permission errors:**
```bash
# Ensure database is writable and migrations are applied
python manage.py migrate
python manage.py populate_demo_data
```

**Memory issues with large datasets:**
```bash
# The command uses transactions and is optimized for performance
# If you encounter issues, try running with smaller batches
```

## Contributing

When adding new demo data:
1. Keep content realistic and educational
2. Maintain diversity in user profiles and question topics
3. Include proper code examples and formatting
4. Test with both empty and existing databases
5. Update this README with any changes

The demo data is designed to showcase all platform features and provide a rich environment for development and testing.
