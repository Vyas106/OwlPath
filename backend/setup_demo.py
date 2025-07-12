#!/usr/bin/env python
"""
Quick setup script for OwlPath demo data.
This script loads the JSON fixtures for users and tags.
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


def setup_demo_data():
    """Load demo data from fixtures"""
    print("🚀 Setting up OwlPath demo data...")

    try:
        # Load tags first (no dependencies)
        print("📋 Loading demo tags...")
        call_command("loaddata", "fixtures/demo_tags.json", verbosity=1)

        # Load users
        print("👥 Loading demo users...")
        call_command("loaddata", "fixtures/demo_users.json", verbosity=1)

        # Set passwords for demo users (fixtures can't include hashed passwords)
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

        print("\n✅ Demo data setup complete!")
        print("\nDemo users and passwords:")
        print("━" * 45)
        print("  👑 ADMIN USER:")
        print("  admin : admin123! (Platform Administrator)")
        print()
        print("  👤 REGULAR USERS:")
        for username in demo_users:
            print(f"  {username} : demo123!")
        print("━" * 45)

        print("\n📊 Next steps:")
        print("  1. Run the server: python manage.py runserver")
        print("  2. Visit http://localhost:8000")
        print("  3. Log in with any demo user")
        print("  4. For more data, run: python manage.py populate_demo_data")

    except Exception as e:
        print(f"❌ Error setting up demo data: {e}")
        return False

    return True


if __name__ == "__main__":
    success = setup_demo_data()
    sys.exit(0 if success else 1)
