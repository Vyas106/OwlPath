from rest_framework.views import APIView
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from .models import User
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserProfileSerializer,
    UserUpdateSerializer,
    UserListSerializer,
)


class RegisterView(APIView):
    """Let's help new users create an account"""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # Take the user's registration info and validate it
        registration_data = UserRegistrationSerializer(data=request.data)
        registration_data.is_valid(raise_exception=True)

        # Create the new user account
        new_user = registration_data.save()

        # Generate some fresh JWT tokens for them
        refresh_token = RefreshToken.for_user(new_user)

        return Response(
            {
                "user": UserProfileSerializer(new_user).data,
                "tokens": {
                    "refresh": str(refresh_token),
                    "access": str(refresh_token.access_token),
                },
                "message": "Welcome! Your account has been created successfully.",
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """Help existing users sign in to their account"""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # Check if the login credentials are valid
        login_data = UserLoginSerializer(data=request.data)
        login_data.is_valid(raise_exception=True)

        user = login_data.validated_data["user"]
        refresh_token = RefreshToken.for_user(user)

        return Response(
            {
                "user": UserProfileSerializer(user).data,
                "tokens": {
                    "refresh": str(refresh_token),
                    "access": str(refresh_token.access_token),
                },
                "message": f"Welcome back, {user.first_name or user.username}!",
            }
        )


class LogoutView(APIView):
    """Let users sign out and invalidate their tokens"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            # Get the refresh token from request and blacklist it
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response(
                    {"error": "Refresh token is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            token = RefreshToken(refresh_token)
            token.blacklist()

            return Response(
                {"message": "You've been logged out successfully. See you soon!"}
            )
        except Exception:
            return Response(
                {"error": "Something went wrong with the logout process"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class ProfileView(APIView):
    """Let users view and update their own profile"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Show the user their current profile info
        user_profile = UserProfileSerializer(request.user)
        return Response(user_profile.data)

    def put(self, request):
        # Let them update their profile completely
        update_data = UserUpdateSerializer(request.user, data=request.data)
        update_data.is_valid(raise_exception=True)
        updated_user = update_data.save()

        return Response(
            {
                "user": UserProfileSerializer(updated_user).data,
                "message": "Your profile has been updated successfully!",
            }
        )

    def patch(self, request):
        # Allow partial updates to their profile
        update_data = UserUpdateSerializer(
            request.user, data=request.data, partial=True
        )
        update_data.is_valid(raise_exception=True)
        updated_user = update_data.save()

        return Response(
            {
                "user": UserProfileSerializer(updated_user).data,
                "message": "Your profile changes have been saved!",
            }
        )


class UserListView(APIView):
    """Show a list of all users in the community"""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        # Get all users and show their basic info
        all_users = User.objects.all()
        users_data = UserListSerializer(all_users, many=True)
        return Response(users_data.data)


class UserDetailView(APIView):
    """Show detailed information about a specific user"""

    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        # Find the user by their ID
        user = get_object_or_404(User, pk=pk)
        user_data = UserProfileSerializer(user)
        return Response(user_data.data)
