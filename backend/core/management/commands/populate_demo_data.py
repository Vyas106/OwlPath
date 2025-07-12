from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import transaction
from tags.models import Tag
from questions.models import Question
from answers.models import Answer
from votes.models import Vote
from notifications.models import Notification
import random
from datetime import timedelta

User = get_user_model()


class Command(BaseCommand):
    help = "Populate the database with relevant demo data for OwlPath Q&A platform"

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear existing data before adding demo data",
        )

    def handle(self, *args, **options):
        if options["clear"]:
            self.stdout.write("Clearing existing data...")
            self.clear_data()

        self.stdout.write("Creating demo data...")

        with transaction.atomic():
            users = self.create_users()
            tags = self.create_tags()
            modern_tags = self.create_modern_tags()
            all_tags = tags + modern_tags
            questions = self.create_questions(users, all_tags)
            answers = self.create_answers(users, questions)
            self.create_votes(users, questions, answers)
            self.create_notifications(users, questions, answers)

        self.stdout.write(
            self.style.SUCCESS("Successfully populated database with demo data!")
        )

    def clear_data(self):
        """Clear existing data"""
        Vote.objects.all().delete()
        Answer.objects.all().delete()
        Question.objects.all().delete()
        Tag.objects.all().delete()
        Notification.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()

    def create_users(self):
        """Create demo users with varied profiles or get existing ones"""
        # Check if users already exist (from fixtures)
        existing_users = list(
            User.objects.filter(
                username__in=["alex_dev", "sarah_python", "mike_js", "anna_student"]
            )
        )

        if existing_users:
            self.stdout.write(f"Using {len(existing_users)} existing users")
            return existing_users

        # Create new users if they don't exist
        users_data = [
            {
                "username": "alex_dev",
                "email": "alex@example.com",
                "first_name": "Alex",
                "last_name": "Johnson",
                "bio": "Full-stack developer with 5+ years experience in Django and React. Love solving complex problems!",
                "location": "San Francisco, CA",
                "website": "https://alexdev.io",
                "github_username": "alexdev",
                "reputation": 2500,
                "is_verified": True,
                "total_questions": 45,
                "total_answers": 125,
                "acceptance_rate": 85.5,
            },
            {
                "username": "sarah_python",
                "email": "sarah@example.com",
                "first_name": "Sarah",
                "last_name": "Chen",
                "bio": "Python enthusiast and machine learning engineer. Always happy to help with Python questions.",
                "location": "New York, NY",
                "github_username": "sarahpython",
                "reputation": 3200,
                "is_verified": True,
                "total_questions": 30,
                "total_answers": 180,
                "acceptance_rate": 92.3,
            },
            {
                "username": "mike_js",
                "email": "mike@example.com",
                "first_name": "Mike",
                "last_name": "Rodriguez",
                "bio": "JavaScript developer specializing in Node.js and Vue.js. Coffee addict ☕",
                "location": "Austin, TX",
                "website": "https://mikejs.dev",
                "github_username": "mikejs",
                "reputation": 1800,
                "is_verified": True,
                "total_questions": 25,
                "total_answers": 95,
                "acceptance_rate": 78.2,
            },
            {
                "username": "emma_data",
                "email": "emma@example.com",
                "first_name": "Emma",
                "last_name": "Wilson",
                "bio": "Data scientist with expertise in R, Python, and statistical modeling.",
                "location": "Boston, MA",
                "reputation": 2100,
                "is_verified": True,
                "total_questions": 20,
                "total_answers": 85,
                "acceptance_rate": 88.7,
            },
            {
                "username": "david_mobile",
                "email": "david@example.com",
                "first_name": "David",
                "last_name": "Kim",
                "bio": "Mobile app developer working with Flutter and React Native.",
                "location": "Seattle, WA",
                "github_username": "davidmobile",
                "reputation": 1500,
                "total_questions": 35,
                "total_answers": 60,
                "acceptance_rate": 71.4,
            },
            {
                "username": "lisa_ux",
                "email": "lisa@example.com",
                "first_name": "Lisa",
                "last_name": "Taylor",
                "bio": "UX/UI designer who codes. Passionate about creating beautiful, accessible interfaces.",
                "location": "Portland, OR",
                "website": "https://lisadesigns.com",
                "reputation": 950,
                "total_questions": 15,
                "total_answers": 40,
                "acceptance_rate": 66.7,
            },
            {
                "username": "tom_backend",
                "email": "tom@example.com",
                "first_name": "Tom",
                "last_name": "Anderson",
                "bio": "Backend engineer with focus on scalable systems and microservices.",
                "location": "Chicago, IL",
                "reputation": 1200,
                "total_questions": 18,
                "total_answers": 55,
                "acceptance_rate": 75.0,
            },
            {
                "username": "anna_student",
                "email": "anna@example.com",
                "first_name": "Anna",
                "last_name": "Garcia",
                "bio": "Computer Science student learning web development. Always eager to learn!",
                "location": "Los Angeles, CA",
                "reputation": 450,
                "total_questions": 28,
                "total_answers": 15,
                "acceptance_rate": 45.5,
            },
        ]

        users = []
        for user_data in users_data:
            user = User.objects.create_user(password="demo123!", **user_data)
            # Add some random badges
            badges = random.sample(
                [
                    "First Question",
                    "First Answer",
                    "Popular Question",
                    "Good Answer",
                    "Great Question",
                    "Helpful",
                    "Teacher",
                ],
                k=random.randint(1, 4),
            )
            user.badges_earned = badges
            user.save()
            users.append(user)

        self.stdout.write(f"Created {len(users)} users")
        return users

    def create_tags(self):
        """Create relevant programming tags or get existing ones"""
        # Check if tags already exist (from fixtures)
        existing_tags = list(Tag.objects.all())

        if existing_tags:
            self.stdout.write(f"Using {len(existing_tags)} existing tags")
            return existing_tags
        tags_data = [
            {
                "name": "python",
                "description": "Python programming language",
                "color": "#3776ab",
            },
            {
                "name": "django",
                "description": "Django web framework",
                "color": "#092e20",
            },
            {
                "name": "javascript",
                "description": "JavaScript programming language",
                "color": "#f7df1e",
            },
            {"name": "react", "description": "React.js library", "color": "#61dafb"},
            {
                "name": "nodejs",
                "description": "Node.js runtime environment",
                "color": "#339933",
            },
            {"name": "html", "description": "HTML markup language", "color": "#e34f26"},
            {"name": "css", "description": "CSS styling language", "color": "#1572b6"},
            {
                "name": "sql",
                "description": "Structured Query Language",
                "color": "#336791",
            },
            {
                "name": "machine-learning",
                "description": "Machine learning and AI",
                "color": "#ff6f00",
            },
            {
                "name": "data-science",
                "description": "Data science and analytics",
                "color": "#ff9800",
            },
            {
                "name": "flutter",
                "description": "Flutter mobile development",
                "color": "#02569b",
            },
            {"name": "vue", "description": "Vue.js framework", "color": "#4fc08d"},
            {
                "name": "api",
                "description": "Application Programming Interface",
                "color": "#ff5722",
            },
            {
                "name": "database",
                "description": "Database design and management",
                "color": "#607d8b",
            },
            {"name": "git", "description": "Git version control", "color": "#f05032"},
            {
                "name": "docker",
                "description": "Docker containerization",
                "color": "#2496ed",
            },
            {"name": "aws", "description": "Amazon Web Services", "color": "#ff9900"},
            {
                "name": "debugging",
                "description": "Code debugging and troubleshooting",
                "color": "#9c27b0",
            },
            {
                "name": "performance",
                "description": "Performance optimization",
                "color": "#795548",
            },
            {
                "name": "security",
                "description": "Web and application security",
                "color": "#f44336",
            },
        ]

        tags = []
        for tag_data in tags_data:
            tag = Tag.objects.create(**tag_data)
            tags.append(tag)

        self.stdout.write(f"Created {len(tags)} tags")
        return tags

    def create_modern_tags(self):
        """Create modern technology tags"""
        modern_tags_data = [
            {
                "name": "websockets",
                "description": "Real-time bidirectional communication",
                "color": "#ff9800",
            },
            {
                "name": "ai-tools",
                "description": "AI-powered development tools and assistants",
                "color": "#9c27b0",
            },
            {
                "name": "microservices",
                "description": "Microservices architecture patterns",
                "color": "#607d8b",
            },
            {
                "name": "bundle-optimization",
                "description": "Frontend bundle size optimization",
                "color": "#ff5722",
            },
            {
                "name": "typescript",
                "description": "TypeScript language and type system",
                "color": "#3178c6",
            },
            {
                "name": "kubernetes",
                "description": "Container orchestration platform",
                "color": "#326ce5",
            },
            {
                "name": "devops",
                "description": "Development operations and CI/CD",
                "color": "#4caf50",
            },
            {
                "name": "real-time",
                "description": "Real-time applications and live updates",
                "color": "#e91e63",
            },
            {
                "name": "architecture",
                "description": "Software architecture and system design",
                "color": "#795548",
            },
            {
                "name": "serverless",
                "description": "Serverless computing and FaaS",
                "color": "#ff6f00",
            },
        ]

        modern_tags = []
        for tag_data in modern_tags_data:
            tag, created = Tag.objects.get_or_create(
                name=tag_data["name"],
                defaults={
                    "description": tag_data["description"],
                    "color": tag_data["color"],
                    "usage_count": random.randint(3, 15),
                },
            )
            modern_tags.append(tag)

        return modern_tags

    def create_questions(self, users, tags):
        """Create demo questions with varied content"""
        questions_data = [
            {
                "title": "How to optimize Django queryset performance for large datasets?",
                "body": """I'm working on a Django application that handles large datasets (millions of records). 
                
My current queries are very slow:

```python
# This query takes 30+ seconds
users = User.objects.filter(created_at__gte=last_month).select_related('profile')
for user in users:
    print(user.profile.bio)
```

What are the best practices for optimizing Django querysets? I've heard about:
- select_related() and prefetch_related()
- Database indexing
- Query optimization

Could someone provide concrete examples and explain when to use each technique?""",
                "tags": ["django", "python", "database", "performance"],
                "difficulty_level": "intermediate",
                "views": 245,
                "bounty_amount": 50,
            },
            {
                "title": "React useState hook not updating immediately - why?",
                "body": """I'm having trouble understanding why React's useState doesn't update immediately:

```javascript
function MyComponent() {
    const [count, setCount] = useState(0);
    
    const handleClick = () => {
        setCount(count + 1);
        console.log(count); // Still shows old value!
    };
    
    return <button onClick={handleClick}>Count: {count}</button>;
}
```

Why does `console.log(count)` show the old value instead of the new one? Is there a way to get the updated value immediately?""",
                "tags": ["react", "javascript"],
                "difficulty_level": "beginner",
                "views": 189,
            },
            {
                "title": "Machine Learning model deployment best practices",
                "body": """I've trained a machine learning model using scikit-learn and need to deploy it to production. 

The model predicts customer churn based on various features. What are the best practices for:

1. Model versioning and management
2. API endpoint design for predictions
3. Monitoring model performance in production
4. Handling model updates without downtime

I'm considering using Docker, but I'm not sure about the overall architecture. Any recommendations for tools and frameworks?""",
                "tags": ["machine-learning", "python", "api", "docker"],
                "difficulty_level": "advanced",
                "views": 156,
                "is_featured": True,
            },
            {
                "title": "CSS Grid vs Flexbox: When to use which?",
                "body": """I'm learning CSS layout techniques and I'm confused about when to use CSS Grid vs Flexbox.

From what I understand:
- Flexbox is for 1-dimensional layouts
- Grid is for 2-dimensional layouts

But I've seen examples where they seem interchangeable. Could someone explain:

1. Specific use cases for each
2. Performance considerations
3. Browser support differences
4. Real-world examples

I'm building a responsive dashboard and want to choose the right tool.""",
                "tags": ["css", "html"],
                "difficulty_level": "beginner",
                "views": 203,
            },
            {
                "title": "Node.js memory leak debugging strategies",
                "body": """My Node.js application is experiencing memory leaks in production. Memory usage keeps growing until the server crashes.

I've tried:
- Using `--inspect` flag
- heap snapshots with Chrome DevTools
- monitoring with `process.memoryUsage()`

The leak seems to happen during high traffic periods. Common culprits I'm investigating:

1. Event listeners not being removed
2. Closures holding references
3. Global variables accumulating data
4. Database connection pools

What are the most effective tools and techniques for identifying and fixing memory leaks in Node.js applications?""",
                "tags": ["nodejs", "javascript", "debugging", "performance"],
                "difficulty_level": "advanced",
                "views": 134,
                "bounty_amount": 100,
            },
            {
                "title": "Git merge vs rebase: Which should I use?",
                "body": """I'm working on a team project and I'm confused about when to use `git merge` vs `git rebase`.

My current workflow:
1. Create feature branch from main
2. Work on feature
3. Want to integrate changes back to main

I've read that:
- Merge preserves history but creates merge commits
- Rebase creates a linear history but rewrites commits

What are the pros and cons of each approach? Are there specific scenarios where one is preferred over the other?""",
                "tags": ["git"],
                "difficulty_level": "intermediate",
                "views": 178,
            },
            {
                "title": "Flutter state management: Provider vs BLoC vs Riverpod",
                "body": """I'm building a Flutter app and need to choose a state management solution. The app will have:

- User authentication
- Real-time data updates
- Complex forms
- Offline capabilities

I'm considering:

**Provider**: Simple and widely used
**BLoC**: More structured, good for complex apps  
**Riverpod**: Newer, claims to solve Provider issues

Which would you recommend for a medium-complexity app? What are the trade-offs in terms of:
- Learning curve
- Performance
- Testability
- Community support""",
                "tags": ["flutter"],
                "difficulty_level": "intermediate",
                "views": 167,
            },
            {
                "title": "How to handle CORS errors in JavaScript fetch requests?",
                "body": """I'm getting CORS errors when making API requests from my frontend:

```javascript
fetch('https://api.example.com/data')
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error('CORS error:', error));
```

Error: `Access to fetch at 'https://api.example.com/data' from origin 'http://localhost:3000' has been blocked by CORS policy`

I understand CORS is a browser security feature, but how do I properly handle this in development and production?""",
                "tags": ["javascript", "api"],
                "difficulty_level": "beginner",
                "views": 312,
            },
            {
                "title": "SQL query optimization for large JOIN operations",
                "body": """I have a complex SQL query that joins multiple tables and it's running very slowly:

```sql
SELECT u.name, p.title, c.content, t.name as tag_name
FROM users u
JOIN posts p ON u.id = p.user_id
JOIN comments c ON p.id = c.post_id
JOIN post_tags pt ON p.id = pt.post_id
JOIN tags t ON pt.tag_id = t.id
WHERE u.created_at > '2023-01-01'
ORDER BY p.created_at DESC
LIMIT 100;
```

The query involves tables with millions of records. What are the best strategies for optimizing this type of complex JOIN query?""",
                "tags": ["sql", "database", "performance"],
                "difficulty_level": "advanced",
                "views": 198,
            },
            {
                "title": "Docker container security best practices",
                "body": """I'm containerizing a web application with Docker and want to ensure it's secure for production deployment.

Current Dockerfile:
```dockerfile
FROM node:16
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

What security best practices should I implement? I'm particularly concerned about:
- Running as non-root user
- Minimizing attack surface
- Secrets management
- Image scanning

Any specific tools or techniques you'd recommend?""",
                "tags": ["docker", "security"],
                "difficulty_level": "intermediate",
                "views": 145,
            },
        ]

        # Additional modern programming questions
        modern_questions = [
            {
                "title": "Next.js 14 App Router vs Pages Router - migration?",
                "body": """We have a large Next.js 13 app using Pages Router and 
considering migrating to App Router.

Current setup:
- Next.js 13.4 with Pages Router
- ~50 pages with complex layouts
- Heavy use of getServerSideProps and getStaticProps
- Custom _app.js and _document.js

Benefits we've heard about App Router:
- Better performance with streaming
- Improved developer experience
- Better TypeScript support
- Incremental static regeneration improvements

Concerns:
- Migration effort for existing pages
- Learning curve for the team
- Third-party library compatibility
- SEO implications during migration

Questions:
1. Is the performance improvement significant?
2. How long did migration take for similar sized apps?
3. Any breaking changes we should watch out for?
4. Can we migrate incrementally?

Real-world experiences would be very helpful!""",
                "tags": ["react", "javascript", "performance"],
                "difficulty_level": "intermediate",
                "views": 189,
                "bounty_amount": 100,
            },
            {
                "title": "Rust vs Go for backend services - 2024 perspective",
                "body": """Our team is evaluating languages for a new 
high-performance API service.

Requirements:
- Handle 100k+ requests/second
- Low latency (< 10ms response time)
- Easy deployment and monitoring
- Good ecosystem for web services
- Team can learn relatively quickly

Rust considerations:
✅ Maximum performance
✅ Memory safety
❌ Steep learning curve
❌ Longer compile times

Go considerations:
✅ Simple and readable
✅ Great concurrency model
✅ Fast compilation
❌ Garbage collector latency

Questions:
1. Which would you choose for this use case?
2. How's the web framework ecosystem in 2024?
3. Deployment and tooling comparison?
4. Team productivity differences?
5. Long-term maintenance considerations?

Looking for experiences from teams who've used both!""",
                "tags": ["performance", "architecture"],
                "difficulty_level": "advanced",
                "views": 267,
                "is_featured": True,
            },
            {
                "title": "GraphQL vs tRPC vs REST - API design in 2024",
                "body": """Building a new API for our SaaS platform and 
evaluating different approaches:

**REST (current):**
- Well understood by team
- Good caching with HTTP
- Simple deployment
- Over-fetching issues

**GraphQL:**
- Flexible queries
- Strong typing
- Complex caching
- Learning curve

**tRPC:**
- End-to-end type safety
- Simple setup
- TypeScript only
- Smaller ecosystem

Our stack: TypeScript, React, Node.js, PostgreSQL

Questions:
1. Which provides the best developer experience?
2. Performance implications for each?
3. Client-side complexity differences?
4. How do they handle real-time features?
5. Migration strategies from REST?

Would love to hear recent experiences with these technologies!""",
                "tags": ["api", "typescript", "architecture"],
                "difficulty_level": "intermediate",
                "views": 198,
            },
            {
                "title": "AI-assisted testing: GitHub Copilot for unit tests",
                "body": """Experimenting with AI tools to generate unit tests 
and want to share findings + get feedback.

What I've tried:
- GitHub Copilot for test generation
- ChatGPT for test case ideas
- Manual review and refinement

Example generated test:
```javascript
// Copilot generated this for a user validation function
describe('validateUser', () => {
  it('should return true for valid user', () => {
    const user = { email: 'test@example.com', age: 25 };
    expect(validateUser(user)).toBe(true);
  });
  
  it('should return false for invalid email', () => {
    const user = { email: 'invalid-email', age: 25 };
    expect(validateUser(user)).toBe(false);
  });
});
```

Observations:
✅ Fast test scaffolding
✅ Good coverage of basic cases
❌ Misses edge cases
❌ Sometimes incorrect assertions

Questions:
1. How are you using AI for testing?
2. Best prompts for generating quality tests?
3. How to ensure AI tests actually catch bugs?
4. Integration with TDD workflow?

Share your AI testing workflows!""",
                "tags": ["ai-tools", "javascript"],
                "difficulty_level": "beginner",
                "views": 134,
            },
            {
                "title": "Serverless vs containers for Python APIs - cost",
                "body": """Comparing deployment options for Python FastAPI 
services and need help with cost/performance analysis.

Current setup:
- 3 FastAPI microservices
- PostgreSQL database
- ~1000 requests/day average
- Spikes to 10k requests during events

**AWS Lambda (Serverless):**
- Pay per request
- Auto-scaling
- Cold start latency
- 15-minute execution limit

**ECS Fargate (Containers):**
- More predictable costs
- Always warm
- Better for long-running tasks
- More complex deployment

**Cost estimates (monthly):**
- Lambda: $15-50 depending on usage
- Fargate: $80-120 for always-on containers

Questions:
1. How do cold starts affect real user experience?
2. Any hidden costs I'm missing?
3. Database connection pooling with Lambda?
4. Monitoring and debugging differences?
5. Which scales better for unpredictable traffic?

Looking for real cost/performance data from production systems!""",
                "tags": ["python", "api", "architecture"],
                "difficulty_level": "intermediate",
                "views": 176,
                "bounty_amount": 75,
            },
        ]

        # Add modern questions to the existing questions list
        questions_data.extend(modern_questions)

        questions = []
        for i, q_data in enumerate(questions_data):
            # Extract tags from the data
            tag_names = q_data.pop("tags")

            # Create question
            question = Question.objects.create(
                author=random.choice(users),
                created_at=timezone.now() - timedelta(days=random.randint(1, 30)),
                **q_data,
            )

            # Add tags
            for tag_name in tag_names:
                tag = next((t for t in tags if t.name == tag_name), None)
                if tag:
                    question.tags.add(tag)
                    tag.increment_usage()

            questions.append(question)

        self.stdout.write(f"Created {len(questions)} questions")
        return questions

    def create_answers(self, users, questions):
        """Create demo answers for questions"""
        answers_data = [
            # Answer for Django optimization question
            {
                "question": 0,
                "body": """Great question! Here are the key strategies for optimizing Django querysets:

## 1. Use select_related() for ForeignKey relationships

```python
# Instead of this (N+1 queries)
users = User.objects.filter(created_at__gte=last_month)
for user in users:
    print(user.profile.bio)  # Additional query for each user

# Do this (2 queries total)
users = User.objects.filter(created_at__gte=last_month).select_related('profile')
for user in users:
    print(user.profile.bio)  # No additional queries
```

## 2. Use prefetch_related() for ManyToMany and reverse ForeignKey

```python
# For ManyToMany relationships
users = User.objects.prefetch_related('groups')

# For reverse ForeignKey
authors = User.objects.prefetch_related('articles')
```

## 3. Database indexing

Add indexes to frequently queried fields:

```python
class User(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['created_at', 'status']),
        ]
```

## 4. Use only() and defer() to limit fields

```python
# Only fetch specific fields
users = User.objects.only('id', 'username', 'email')

# Defer large fields
users = User.objects.defer('large_text_field')
```

This should significantly improve your query performance!""",
                "is_accepted": True,
            },
            # Second answer for Django question
            {
                "question": 0,
                "body": """I'd also recommend using `values()` and `values_list()` for even better performance when you don't need full model instances:

```python
# Returns dictionaries instead of model instances
user_data = User.objects.filter(
    created_at__gte=last_month
).values('id', 'username', 'profile__bio')

# Returns tuples
user_ids = User.objects.filter(
    created_at__gte=last_month
).values_list('id', flat=True)
```

Also consider using `iterator()` for very large datasets to avoid loading everything into memory:

```python
for user in User.objects.filter(created_at__gte=last_month).iterator():
    process_user(user)
```""",
            },
            # Answer for React useState question
            {
                "question": 1,
                "body": """This is a common confusion! React's `useState` updates are **asynchronous** and **batched** for performance reasons.

## Why this happens:

```javascript
const [count, setCount] = useState(0);

const handleClick = () => {
    setCount(count + 1);  // Schedules an update, doesn't happen immediately
    console.log(count);   // Still the old value
};
```

## Solutions:

### 1. Use useEffect to react to changes:

```javascript
const [count, setCount] = useState(0);

useEffect(() => {
    console.log('Count updated:', count);
}, [count]);
```

### 2. Use functional updates when you need the current value:

```javascript
const handleClick = () => {
    setCount(prevCount => {
        const newCount = prevCount + 1;
        console.log('New count will be:', newCount);
        return newCount;
    });
};
```

### 3. Use a ref if you need immediate access:

```javascript
const [count, setCount] = useState(0);
const countRef = useRef(count);

const handleClick = () => {
    const newCount = count + 1;
    setCount(newCount);
    countRef.current = newCount;
    console.log('Immediate value:', countRef.current);
};
```

The key is understanding that state updates are scheduled, not immediate!""",
                "is_accepted": True,
            },
            # Answer for CSS Grid vs Flexbox question
            {
                "question": 3,
                "body": """Great question! Here's when to use each:

## Use Flexbox when:
- **One-dimensional layouts** (row OR column)
- **Content-first design** (size based on content)
- **Component-level layouts**

```css
/* Navigation bar */
.navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

/* Card content */
.card {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}
```

## Use CSS Grid when:
- **Two-dimensional layouts** (rows AND columns)
- **Layout-first design** (content fits layout)
- **Page-level layouts**

```css
/* Page layout */
.page-layout {
    display: grid;
    grid-template-areas: 
        "header header header"
        "sidebar main main"
        "footer footer footer";
    grid-template-columns: 200px 1fr 1fr;
}

/* Dashboard grid */
.dashboard {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
}
```

## For your responsive dashboard:
I'd recommend **CSS Grid for the overall layout** and **Flexbox for individual components**:

```css
.dashboard {
    display: grid;
    grid-template-columns: 250px 1fr;
    grid-template-rows: 60px 1fr;
    grid-template-areas:
        "sidebar header"
        "sidebar main";
}

.card {
    display: flex;
    flex-direction: column;
    padding: 1rem;
}
```

Both have excellent browser support nowadays!""",
                "is_accepted": True,
            },
        ]

        answers = []
        for ans_data in answers_data:
            question_index = ans_data.pop("question")
            answer = Answer.objects.create(
                question=questions[question_index],
                author=random.choice(users),
                created_at=timezone.now() - timedelta(days=random.randint(0, 15)),
                **ans_data,
            )

            # Update question status if answer is accepted
            if answer.is_accepted:
                answer.question.is_answered = True
                answer.question.accepted_answer = answer
                answer.question.save()

            answers.append(answer)

        # Create additional random answers
        for question in questions:
            if not hasattr(question, "accepted_answer") or not question.accepted_answer:
                # Add 1-3 additional answers to some questions
                num_answers = random.randint(0, 3)
                for _ in range(num_answers):
                    answer = Answer.objects.create(
                        question=question,
                        author=random.choice(users),
                        body=f"This is a helpful answer for the question about {question.title[:50]}...\n\nHere's my approach to solving this problem:\n\n1. First step\n2. Second step\n3. Final solution\n\nHope this helps!",
                        created_at=timezone.now()
                        - timedelta(days=random.randint(0, 10)),
                    )
                    answers.append(answer)

        self.stdout.write(f"Created {len(answers)} answers")
        return answers

    def create_votes(self, users, questions, answers):
        """Create demo votes for questions and answers"""
        vote_count = 0

        # Vote on questions
        for question in questions:
            num_votes = random.randint(5, 25)
            voters = random.sample(users, min(num_votes, len(users)))

            for voter in voters:
                if voter != question.author:  # Can't vote on own content
                    vote_value = random.choices([1, -1], weights=[0.8, 0.2])[
                        0
                    ]  # 80% upvotes
                    Vote.objects.create(
                        user=voter,
                        content_object=question,
                        value=vote_value,
                        created_at=timezone.now()
                        - timedelta(days=random.randint(0, 20)),
                    )
                    vote_count += 1

        # Vote on answers
        for answer in answers:
            num_votes = random.randint(3, 15)
            voters = random.sample(users, min(num_votes, len(users)))

            for voter in voters:
                if voter != answer.author:  # Can't vote on own content
                    vote_value = random.choices([1, -1], weights=[0.85, 0.15])[
                        0
                    ]  # 85% upvotes
                    Vote.objects.create(
                        user=voter,
                        content_object=answer,
                        value=vote_value,
                        created_at=timezone.now()
                        - timedelta(days=random.randint(0, 15)),
                    )
                    vote_count += 1

        self.stdout.write(f"Created {vote_count} votes")

    def create_notifications(self, users, questions, answers):
        """Create demo notifications"""
        notifications = []

        # Create notifications for answers
        for answer in answers[:10]:  # Limit to first 10 answers
            notification = Notification.objects.create(
                recipient=answer.question.author,
                sender=answer.author,
                notification_type="new_answer",
                title=f"New answer on your question",
                message=f'{answer.author.username} answered your question "{answer.question.title}"',
                related_question_id=answer.question.id,
                related_answer_id=answer.id,
                created_at=answer.created_at + timedelta(minutes=1),
                is_read=random.choice([True, False]),
            )
            notifications.append(notification)

        # Create notifications for accepted answers
        for answer in answers:
            if answer.is_accepted:
                notification = Notification.objects.create(
                    recipient=answer.author,
                    sender=answer.question.author,
                    notification_type="answer_accepted",
                    title=f"Your answer was accepted!",
                    message=f'Your answer to "{answer.question.title}" was accepted',
                    related_question_id=answer.question.id,
                    related_answer_id=answer.id,
                    created_at=answer.created_at + timedelta(hours=2),
                    is_read=random.choice([True, False]),
                )
                notifications.append(notification)

        self.stdout.write(f"Created {len(notifications)} notifications")
