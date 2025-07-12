from rest_framework.views import APIView
from rest_framework import permissions, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import Question
from .serializers import (
    QuestionListSerializer,
    QuestionDetailSerializer,
    QuestionCreateSerializer,
    QuestionUpdateSerializer,
)


class QuestionListCreateView(APIView):
    """Browse all questions or ask a new one"""

    def get_permissions(self):
        # Anyone can browse questions, but you need an account to ask
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get(self, request):
        # Get all questions with optional filtering and searching
        questions = Question.objects.all()

        # Handle search if user provided a query
        search_query = request.GET.get("search")
        if search_query:
            questions = questions.filter(
                Q(title__icontains=search_query) | Q(body__icontains=search_query)
            )

        # Filter by tags if specified
        tag_filter = request.GET.get("tags__name")
        if tag_filter:
            questions = questions.filter(tags__name=tag_filter)

        # Filter by author if specified
        author_filter = request.GET.get("author__username")
        if author_filter:
            questions = questions.filter(author__username=author_filter)

        # Filter by answered status if specified
        answered_filter = request.GET.get("is_answered")
        if answered_filter is not None:
            questions = questions.filter(is_answered=answered_filter.lower() == "true")

        # Handle ordering
        ordering = request.GET.get("ordering", "-created_at")
        if ordering in [
            "created_at",
            "-created_at",
            "views",
            "-views",
            "vote_score",
            "-vote_score",
        ]:
            questions = questions.order_by(ordering)
        else:
            questions = questions.order_by("-created_at")

        questions_data = QuestionListSerializer(questions, many=True)
        return Response(questions_data.data)

    def post(self, request):
        # Let authenticated users ask new questions
        question_data = QuestionCreateSerializer(data=request.data)
        question_data.is_valid(raise_exception=True)

        # Save the question with the current user as author
        new_question = question_data.save(author=request.user)

        return Response(
            QuestionDetailSerializer(new_question).data, status=status.HTTP_201_CREATED
        )


class QuestionDetailView(APIView):
    """View, edit, or delete a specific question"""

    def get_permissions(self):
        # Anyone can view, but only authenticated users can edit/delete
        if self.request.method in ["PUT", "PATCH", "DELETE"]:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get(self, request, slug):
        # Find the question and bump up the view count
        question = get_object_or_404(Question, slug=slug)

        # Count this as a view
        question.views += 1
        question.save(update_fields=["views"])

        question_data = QuestionDetailSerializer(question)
        return Response(question_data.data)

    def put(self, request, slug):
        # Let users update their own questions completely
        question = get_object_or_404(Question, slug=slug)

        if question.author != request.user:
            return Response(
                {"error": "Hey, you can only edit your own questions!"},
                status=status.HTTP_403_FORBIDDEN,
            )

        update_data = QuestionUpdateSerializer(question, data=request.data)
        update_data.is_valid(raise_exception=True)
        updated_question = update_data.save()

        return Response(QuestionDetailSerializer(updated_question).data)

    def patch(self, request, slug):
        # Allow partial updates to questions
        question = get_object_or_404(Question, slug=slug)

        if question.author != request.user:
            return Response(
                {"error": "Hey, you can only edit your own questions!"},
                status=status.HTTP_403_FORBIDDEN,
            )

        update_data = QuestionUpdateSerializer(
            question, data=request.data, partial=True
        )
        update_data.is_valid(raise_exception=True)
        updated_question = update_data.save()

        return Response(QuestionDetailSerializer(updated_question).data)

    def delete(self, request, slug):
        # Let users delete their own questions
        question = get_object_or_404(Question, slug=slug)

        if question.author != request.user:
            return Response(
                {"error": "You can only delete your own questions"},
                status=status.HTTP_403_FORBIDDEN,
            )

        question.delete()
        return Response(
            {"message": "Your question has been deleted successfully"},
            status=status.HTTP_204_NO_CONTENT,
        )


class AcceptAnswerView(APIView):
    """Let question authors accept the best answer"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug, answer_id):
        # Find the question first
        question = get_object_or_404(Question, slug=slug)

        # Only the person who asked can accept an answer
        if question.author != request.user:
            return Response(
                {"error": "Only the question author can accept answers"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Import here to avoid circular imports
        from answers.models import Answer

        answer = get_object_or_404(Answer, id=answer_id, question=question)

        # Clear any previous accepted answer
        if question.accepted_answer:
            question.accepted_answer = None
            question.is_answered = False

        # Mark this answer as the accepted one
        question.accepted_answer = answer
        question.is_answered = True
        question.save()

        return Response(
            {
                "message": "Great choice! Answer has been accepted.",
                "accepted_answer_id": answer.id,
            }
        )


class UserQuestionsView(APIView):
    """Show all questions asked by a specific user"""

    permission_classes = [permissions.AllowAny]

    def get(self, request, username):
        # Find all questions by this user
        user_questions = Question.objects.filter(author__username=username)
        questions_data = QuestionListSerializer(user_questions, many=True)
        return Response(
            {
                "user": username,
                "questions_count": user_questions.count(),
                "questions": questions_data.data,
            }
        )
