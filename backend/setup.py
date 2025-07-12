#!/usr/bin/env python
"""
StackIt Backend Setup Script
This script helps set up the StackIt backend for development.
"""

import os
import sys
import subprocess


def run_command(command, description):
    """Run a command and handle errors"""
    print(f"\n🔄 {description}")
    print(f"Running: {command}")

    try:
        result = subprocess.run(
            command, shell=True, check=True, capture_output=True, text=True
        )
        print(f"✅ {description} completed successfully")
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed")
        print(f"Error: {e.stderr}")
        return False


def main():
    print("🚀 StackIt Backend Setup")
    print("=" * 50)

    # Check if we're in the right directory
    if not os.path.exists("manage.py"):
        print("❌ Please run this script from the backend directory")
        sys.exit(1)

    # Install dependencies
    if not run_command(
        "pip install -r requirements.txt", "Installing Python dependencies"
    ):
        print("Failed to install dependencies. Please install manually.")
        return

    # Make migrations
    run_command(
        "python manage.py makemigrations accounts", "Creating accounts migrations"
    )
    run_command(
        "python manage.py makemigrations questions", "Creating questions migrations"
    )
    run_command("python manage.py makemigrations tags", "Creating tags migrations")
    run_command(
        "python manage.py makemigrations answers", "Creating answers migrations"
    )
    run_command("python manage.py makemigrations votes", "Creating votes migrations")
    run_command(
        "python manage.py makemigrations notifications",
        "Creating notifications migrations",
    )

    # Run migrations
    run_command("python manage.py migrate", "Applying database migrations")

    # Collect static files
    run_command("python manage.py collectstatic --noinput", "Collecting static files")

    print("\n🎉 Setup completed!")
    print("\nNext steps:")
    print("1. Create a superuser: python manage.py createsuperuser")
    print("2. Start the development server: python manage.py runserver")
    print("3. Visit http://localhost:8000/swagger/ for API documentation")


if __name__ == "__main__":
    main()
