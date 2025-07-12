from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.validators import RegexValidator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from .models import User
import re
import logging

logger = logging.getLogger(__name__)


class EnhancedValidationMixin:
    """
    Mixin that provides enhanced validation methods for serializers.
    Implements comprehensive data validation for improved coding standards.
    """

    def validate_password_strength(self, password):
        """
        Enhanced password validation with comprehensive security checks.
        Implements strong validation rules for security compliance.
        """
        errors = []

        # Length check
        if len(password) < 8:
            errors.append("Password must be at least 8 characters long.")

        # Character variety checks
        if not re.search(r"[A-Z]", password):
            errors.append("Password must contain at least one uppercase letter.")

        if not re.search(r"[a-z]", password):
            errors.append("Password must contain at least one lowercase letter.")

        if not re.search(r"\d", password):
            errors.append("Password must contain at least one digit.")

        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            errors.append("Password must contain at least one special character.")

        # Common password checks
        common_passwords = [
            "password",
            "123456",
            "qwerty",
            "abc123",
            "password123",
            "admin",
            "letmein",
            "welcome",
            "monkey",
            "1234567890",
        ]

        if password.lower() in common_passwords:
            errors.append(
                "Password is too common. Please choose a more secure password."
            )

        # Sequential character check
        if re.search(
            r"(012|123|234|345|456|567|678|789|890|abc|bcd|cde)", password.lower()
        ):
            errors.append("Password should not contain sequential characters.")

        if errors:
            raise serializers.ValidationError(errors)

        return password

    def validate_email_domain(self, email):
        """
        Validate email domain against blocklist and format requirements.
        Implements comprehensive email validation for security.
        """
        # Blocked domains (temporary email services)
        blocked_domains = [
            "10minutemail.com",
            "tempmail.org",
            "guerrillamail.com",
            "mailinator.com",
            "throwaway.email",
            "temp-mail.org",
        ]

        domain = email.split("@")[1].lower()

        if domain in blocked_domains:
            raise serializers.ValidationError(
                "Temporary email addresses are not allowed. Please use a permanent email address."
            )

        # Check for valid domain format
        domain_pattern = r"^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}$"
        if not re.match(domain_pattern, domain):
            raise serializers.ValidationError("Invalid email domain format.")

        return email

    def validate_username_format(self, username):
        """
        Validate username format and availability.
        Implements comprehensive username validation rules.
        """
        # Length validation
        if len(username) < 3:
            raise serializers.ValidationError(
                "Username must be at least 3 characters long."
            )

        if len(username) > 30:
            raise serializers.ValidationError("Username cannot exceed 30 characters.")

        # Character validation
        if not re.match(r"^[a-zA-Z0-9_-]+$", username):
            raise serializers.ValidationError(
                "Username can only contain letters, numbers, underscores, and hyphens."
            )

        # Cannot start or end with special characters
        if username.startswith(("_", "-")) or username.endswith(("_", "-")):
            raise serializers.ValidationError(
                "Username cannot start or end with underscores or hyphens."
            )

        # Reserved usernames
        reserved_usernames = [
            "admin",
            "administrator",
            "root",
            "system",
            "api",
            "www",
            "mail",
            "email",
            "support",
            "help",
            "info",
            "contact",
            "moderator",
            "mod",
            "staff",
            "team",
            "official",
        ]

        if username.lower() in reserved_usernames:
            raise serializers.ValidationError(
                "This username is reserved and cannot be used."
            )

        return username


class UserRegistrationSerializer(EnhancedValidationMixin, serializers.ModelSerializer):
    """
    Enhanced serializer for user registration with comprehensive validation.
    Implements improved data validation and security measures.
    """

    password = serializers.CharField(
        write_only=True,
        validators=[validate_password],
        style={"input_type": "password"},
        help_text="Password must be at least 8 characters with uppercase, lowercase, digit, and special character.",
    )
    password_confirm = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
        help_text="Re-enter your password for confirmation.",
    )

    # Enhanced field validation
    email = serializers.EmailField(
        help_text="Enter a valid email address. Temporary email services are not allowed."
    )

    username = serializers.CharField(
        validators=[
            RegexValidator(
                regex=r"^[a-zA-Z0-9_-]+$",
                message="Username can only contain letters, numbers, underscores, and hyphens.",
            )
        ],
        help_text="Choose a unique username (3-30 characters, letters, numbers, _, -).",
    )

    # Optional fields with validation
    first_name = serializers.CharField(
        required=False,
        max_length=30,
        validators=[
            RegexValidator(
                regex=r"^[a-zA-Z\s-]+$",
                message="First name can only contain letters, spaces, and hyphens.",
            )
        ],
    )

    last_name = serializers.CharField(
        required=False,
        max_length=30,
        validators=[
            RegexValidator(
                regex=r"^[a-zA-Z\s-]+$",
                message="Last name can only contain letters, spaces, and hyphens.",
            )
        ],
    )

    # Terms acceptance
    accept_terms = serializers.BooleanField(
        write_only=True,
        help_text="You must accept the terms and conditions to register.",
    )

    # Honeypot field for bot detection
    honeypot = serializers.CharField(
        required=False,
        write_only=True,
        allow_blank=True,
        help_text="Leave this field empty (bot detection).",
    )

    class Meta:
        model = User
        fields = (
            "username",
            "email",
            "password",
            "password_confirm",
            "first_name",
            "last_name",
            "accept_terms",
            "honeypot",
        )
        extra_kwargs = {
            "username": {"help_text": "Choose a unique username"},
            "email": {"help_text": "Enter a valid email address"},
        }

    def validate_honeypot(self, value):
        """Bot detection through honeypot field"""
        if value:
            raise serializers.ValidationError("Bot detected. Registration blocked.")
        return value

    def validate_accept_terms(self, value):
        """Ensure terms are accepted"""
        if not value:
            raise serializers.ValidationError(
                "You must accept the terms and conditions to register."
            )
        return value

    def validate_username(self, value):
        """Enhanced username validation"""
        value = self.validate_username_format(value)

        # Check availability
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("This username is already taken.")

        return value

    def validate_email(self, value):
        """Enhanced email validation"""
        value = self.validate_email_domain(value)

        # Check if email is already registered
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "An account with this email already exists."
            )

        return value

    def validate_password(self, value):
        """Enhanced password validation"""
        return self.validate_password_strength(value)

    def validate(self, attrs):
        """Cross-field validation"""
        # Password confirmation
        if attrs.get("password") != attrs.get("password_confirm"):
            raise serializers.ValidationError(
                {"password_confirm": "Password and password confirmation don't match."}
            )

        # Username-password similarity check
        username = attrs.get("username", "")
        password = attrs.get("password", "")

        if username.lower() in password.lower() or password.lower() in username.lower():
            raise serializers.ValidationError(
                {"password": "Password cannot be too similar to your username."}
            )

        # Email-password similarity check
        email = attrs.get("email", "")
        email_username = email.split("@")[0] if "@" in email else ""

        if email_username.lower() in password.lower():
            raise serializers.ValidationError(
                {"password": "Password cannot be too similar to your email address."}
            )

        return attrs

    def create(self, validated_data):
        """Create user with enhanced processing"""
        # Remove non-model fields
        validated_data.pop("password_confirm", None)
        validated_data.pop("accept_terms", None)
        validated_data.pop("honeypot", None)

        # Create user
        user = User.objects.create_user(**validated_data)

        # Log registration
        logger.info(f"New user registered: {user.username} ({user.email})")

        return user


class UserLoginSerializer(EnhancedValidationMixin, serializers.Serializer):
    """
    Enhanced serializer for user login with security features.
    Implements comprehensive authentication validation.
    """

    email = serializers.EmailField(help_text="Enter your registered email address.")
    password = serializers.CharField(
        style={"input_type": "password"}, help_text="Enter your account password."
    )

    # Security fields
    remember_me = serializers.BooleanField(
        default=False, help_text="Keep me logged in for 30 days."
    )

    # Device tracking (optional)
    device_name = serializers.CharField(
        required=False,
        max_length=100,
        help_text="Device name for security tracking (optional).",
    )

    def validate_email(self, value):
        """Validate email format"""
        return self.validate_email_domain(value)

    def validate(self, attrs):
        """Enhanced authentication validation"""
        email = attrs.get("email")
        password = attrs.get("password")

        if email and password:
            # Check if user exists
            try:
                user_obj = User.objects.get(email__iexact=email)

                # Check if user is suspended
                if user_obj.is_suspended:
                    if (
                        user_obj.suspended_until
                        and user_obj.suspended_until > timezone.now()
                    ):
                        raise serializers.ValidationError(
                            f"Account is suspended until {user_obj.suspended_until.strftime('%Y-%m-%d %H:%M')}. "
                            f"Reason: {user_obj.suspension_reason}"
                        )
                    elif user_obj.is_suspended and not user_obj.suspended_until:
                        raise serializers.ValidationError(
                            f"Account is permanently suspended. Reason: {user_obj.suspension_reason}"
                        )

                # Authenticate user
                user = authenticate(username=email, password=password)

                if not user:
                    # Log failed login attempt
                    logger.warning(f"Failed login attempt for email: {email}")
                    raise serializers.ValidationError("Invalid email or password.")

                if not user.is_active:
                    raise serializers.ValidationError(
                        "This account has been deactivated."
                    )

                # Update last seen
                user.update_last_seen()

                attrs["user"] = user
                logger.info(f"Successful login: {user.username}")

            except User.DoesNotExist:
                logger.warning(f"Login attempt with non-existent email: {email}")
                raise serializers.ValidationError("Invalid email or password.")
        else:
            raise serializers.ValidationError("Both email and password are required.")

        return attrs


class UserProfileSerializer(EnhancedValidationMixin, serializers.ModelSerializer):
    """
    Enhanced serializer for user profile management with comprehensive validation.
    Implements detailed profile validation and security measures.
    """

    # Read-only computed fields
    reputation_level = serializers.SerializerMethodField()
    total_badges = serializers.SerializerMethodField()
    member_since = serializers.SerializerMethodField()
    is_online = serializers.SerializerMethodField()

    # Validation for profile fields
    github_username = serializers.CharField(
        required=False,
        max_length=100,
        validators=[
            RegexValidator(
                regex=r"^[a-zA-Z0-9-]+$",
                message="GitHub username can only contain letters, numbers, and hyphens.",
            )
        ],
        help_text="Your GitHub username (letters, numbers, hyphens only).",
    )

    website = serializers.URLField(
        required=False, help_text="Your personal website or portfolio URL."
    )

    bio = serializers.CharField(
        required=False,
        max_length=500,
        help_text="Tell us about yourself (max 500 characters).",
    )

    location = serializers.CharField(
        required=False,
        max_length=100,
        validators=[
            RegexValidator(
                regex=r"^[a-zA-Z\s,.-]+$",
                message="Location can only contain letters, spaces, commas, periods, and hyphens.",
            )
        ],
        help_text="Your location (city, country).",
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "bio",
            "location",
            "website",
            "github_username",
            "avatar",
            "reputation",
            "is_verified",
            "role",
            "email_notifications",
            "profile_visibility",
            "total_questions",
            "total_answers",
            "acceptance_rate",
            "badges_earned",
            "reputation_level",
            "total_badges",
            "member_since",
            "is_online",
            "last_seen",
        ]
        read_only_fields = [
            "id",
            "username",
            "reputation",
            "is_verified",
            "role",
            "total_questions",
            "total_answers",
            "acceptance_rate",
            "badges_earned",
            "last_seen",
        ]

    def get_reputation_level(self, obj):
        """Get user's reputation level"""
        return obj.calculate_reputation_level()

    def get_total_badges(self, obj):
        """Get total number of badges"""
        return len(obj.badges_earned)

    def get_member_since(self, obj):
        """Get formatted member since date"""
        return obj.created_at.strftime("%B %Y")

    def get_is_online(self, obj):
        """Check if user is currently online"""
        if not obj.last_seen:
            return False

        # Consider user online if seen within last 5 minutes
        threshold = timezone.now() - timezone.timedelta(minutes=5)
        return obj.last_seen >= threshold

    def validate_github_username(self, value):
        """Validate GitHub username format and availability"""
        if value:
            # Check if username is already taken by another user
            if (
                User.objects.filter(github_username__iexact=value)
                .exclude(pk=self.instance.pk if self.instance else None)
                .exists()
            ):
                raise serializers.ValidationError(
                    "This GitHub username is already associated with another account."
                )
        return value

    def validate_website(self, value):
        """Validate website URL"""
        if value:
            # Check for common security issues
            suspicious_domains = ["bit.ly", "tinyurl.com", "goo.gl"]

            for domain in suspicious_domains:
                if domain in value:
                    raise serializers.ValidationError(
                        "Shortened URLs are not allowed for security reasons."
                    )

            # Ensure URL uses HTTPS in production
            if not value.startswith(("http://", "https://")):
                value = f"https://{value}"

        return value

    def validate_bio(self, value):
        """Validate bio content"""
        if value:
            # Check for spam patterns
            spam_patterns = [
                r"(buy|sell|cheap|discount|offer|deal)\s+now",
                r"click\s+here",
                r"visit\s+my\s+(website|blog|store)",
                r"\b(viagra|casino|poker|lottery)\b",
            ]

            for pattern in spam_patterns:
                if re.search(pattern, value, re.IGNORECASE):
                    raise serializers.ValidationError(
                        "Bio contains content that appears to be spam."
                    )

            # Check for excessive capitalization
            if len(value) > 20 and value.upper() == value:
                raise serializers.ValidationError(
                    "Bio cannot be entirely in uppercase."
                )

        return value

    def update(self, instance, validated_data):
        """Enhanced update with logging"""
        # Track what fields are being updated
        updated_fields = []

        for field, value in validated_data.items():
            if getattr(instance, field) != value:
                updated_fields.append(field)

        # Perform update
        instance = super().update(instance, validated_data)

        # Log profile updates
        if updated_fields:
            logger.info(
                f"Profile updated for {instance.username}: {', '.join(updated_fields)}"
            )

        return instance


class PasswordChangeSerializer(EnhancedValidationMixin, serializers.Serializer):
    """
    Enhanced serializer for password changes with security validation.
    """

    current_password = serializers.CharField(
        style={"input_type": "password"}, help_text="Enter your current password."
    )
    new_password = serializers.CharField(
        validators=[validate_password],
        style={"input_type": "password"},
        help_text="Enter your new password.",
    )
    confirm_password = serializers.CharField(
        style={"input_type": "password"}, help_text="Confirm your new password."
    )

    def validate_current_password(self, value):
        """Validate current password"""
        user = self.context["request"].user

        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")

        return value

    def validate_new_password(self, value):
        """Enhanced new password validation"""
        return self.validate_password_strength(value)

    def validate(self, attrs):
        """Cross-field validation for password change"""
        # Check password confirmation
        if attrs.get("new_password") != attrs.get("confirm_password"):
            raise serializers.ValidationError(
                {"confirm_password": "New passwords do not match."}
            )

        # Ensure new password is different from current
        if attrs.get("current_password") == attrs.get("new_password"):
            raise serializers.ValidationError(
                {
                    "new_password": "New password must be different from current password."
                }
            )

        return attrs

    def save(self):
        """Save new password"""
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])

        logger.info(f"Password changed for user: {user.username}")

        return user

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "bio",
            "location",
            "website",
            "github_username",
            "reputation",
            "avatar",
            "role",
            "is_verified",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "reputation",
            "role",
            "is_verified",
            "created_at",
            "updated_at",
        )


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile"""

    class Meta:
        model = User
        fields = (
            "first_name",
            "last_name",
            "bio",
            "location",
            "website",
            "github_username",
            "avatar",
        )


class UserListSerializer(serializers.ModelSerializer):
    """Serializer for listing users"""

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "reputation",
            "avatar",
            "role",
            "is_verified",
            "created_at",
        )
