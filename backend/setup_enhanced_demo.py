#!/usr/bin/env python
"""
Enhanced demo data setup for OwlPath Q&A Platform
Includes modern programming topics and current technology trends
"""

import os
import sys
import django
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "stackit.settings")
django.setup()

from django.core.management import call_command
from django.contrib.auth import get_user_model

User = get_user_model()


def setup_enhanced_demo_data():
    """Setup enhanced demo data with modern content"""
    print("🚀 Setting up OwlPath with enhanced demo data...")
    print("   Including modern programming topics and current tech trends")

    try:
        # Run migrations first
        print("\n📋 Applying database migrations...")
        call_command("migrate", verbosity=0)

        # Load basic fixtures (users and tags)
        print("👥 Loading demo users...")
        call_command("loaddata", "fixtures/demo_users.json", verbosity=0)

        print("🏷️  Loading demo tags...")
        call_command("loaddata", "fixtures/demo_tags.json", verbosity=0)

        # Set passwords for demo users
        print("🔐 Setting up user passwords...")
        demo_users = ["alex_dev", "sarah_python", "mike_js", "anna_student"]
        for username in demo_users:
            try:
                user = User.objects.get(username=username)
                user.set_password("demo123!")
                user.save()
                print(f"  ✓ Password set for {username}")
            except User.DoesNotExist:
                print(f"  ⚠️  User {username} not found")

        # Set password for admin user
        try:
            admin_user = User.objects.get(username="admin")
            admin_user.set_password("admin123!")
            admin_user.save()
            print("  ✓ Password set for admin (superuser)")
        except User.DoesNotExist:
            print("  ⚠️  Admin user not found")

        # Load enhanced demo data (questions, answers, votes, notifications)
        print("\n📊 Creating enhanced demo content...")
        # Use --clear=False to avoid recreating users and tags
        call_command("populate_demo_data", verbosity=1)

        print("\n✅ Enhanced demo data setup complete!")
        print("\n📚 What's included:")
        print("  • 8 diverse users with realistic profiles")
        print("  • 25+ programming tags (including modern tech)")
        print("  • 15+ detailed questions covering:")
        print("    - Django optimization techniques")
        print("    - React hooks and state management")
        print("    - Modern deployment strategies")
        print("    - AI-assisted development tools")
        print("    - Container orchestration")
        print("    - TypeScript and bundle optimization")
        print("    - Real-time communication")
        print("  • Comprehensive answers with code examples")
        print("  • Realistic voting patterns and interactions")
        print("  • Sample notifications and user engagement")

        print("\n🎯 Demo users and passwords:")
        print("━" * 50)
        print("  👑 ADMIN USER:")
        print(f"  {'admin':<15} : admin123! (Platform Administrator)")
        print()
        print("  👤 REGULAR USERS:")
        user_descriptions = {
            "alex_dev": "Full-stack developer (2500 rep)",
            "sarah_python": "Python/ML expert (3200 rep)",
            "mike_js": "JavaScript specialist (1800 rep)",
            "anna_student": "CS student (450 rep)",
        }
        for username in demo_users:
            desc = user_descriptions.get(username, "Demo user")
            print(f"  {username:<15} : demo123!  ({desc})")
        print("━" * 50)

        print("\n📊 Next steps:")
        print("  1. Run the server: python manage.py runserver")
        print("  2. Visit http://localhost:8000")
        print("  3. Log in with any demo user above")
        print("  4. Explore questions, answers, and voting")
        print("  5. Try asking your own questions!")

        print("\n💡 Features to explore:")
        print("  • Rich text editor with code syntax highlighting")
        print("  • Tag-based question organization")
        print("  • Voting and reputation system")
        print("  • Real-time notifications")
        print("  • Bounty questions with rewards")
        print("  • Featured and pinned content")

    except Exception as e:
        print(f"❌ Error setting up enhanced demo data: {e}")
        return False

    return True


if __name__ == "__main__":
    success = setup_enhanced_demo_data()
    sys.exit(0 if success else 1)
