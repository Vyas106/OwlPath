from rest_framework.views import APIView
from rest_framework import permissions, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from questions.models import Question
from .models import Answer
from .serializers import (
    AnswerListSerializer,
    AnswerDetailSerializer,
    AnswerCreateSerializer,
    AnswerUpdateSerializer,
)


class AnswerListCreateView(APIView):
    """Browse answers for a question or post your own answer"""

    def get_permissions(self):
        # Anyone can read answers, but you need an account to post
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get(self, request, question_slug):
        # Find the question first
        question = get_object_or_404(Question, slug=question_slug)

        # Get all answers for this question
        answers = Answer.objects.filter(question=question).order_by(
            "-is_accepted", "-created_at"
        )

        answers_data = AnswerListSerializer(answers, many=True)
        return Response(
            {
                "question": question.title,
                "answers_count": answers.count(),
                "answers": answers_data.data,
            }
        )

    def post(self, request, question_slug):
        # Let users post an answer to the question
        question = get_object_or_404(Question, slug=question_slug)

        answer_data = AnswerCreateSerializer(data=request.data)
        answer_data.is_valid(raise_exception=True)

        # Save the answer with current user and question
        new_answer = answer_data.save(author=request.user, question=question)

        return Response(
            AnswerDetailSerializer(new_answer).data, status=status.HTTP_201_CREATED
        )


class AnswerDetailView(APIView):
    """View, edit, or delete a specific answer"""

    def get_permissions(self):
        # Anyone can view, but only authenticated users can edit/delete
        if self.request.method in ["PUT", "PATCH", "DELETE"]:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get(self, request, pk):
        # Show details of a specific answer
        answer = get_object_or_404(Answer, pk=pk)
        answer_data = AnswerDetailSerializer(answer)
        return Response(answer_data.data)

    def put(self, request, pk):
        # Let users completely update their own answer
        answer = get_object_or_404(Answer, pk=pk)

        if answer.author != request.user:
            return Response(
                {"error": "Hey, you can only edit your own answers!"},
                status=status.HTTP_403_FORBIDDEN,
            )

        update_data = AnswerUpdateSerializer(answer, data=request.data)
        update_data.is_valid(raise_exception=True)
        updated_answer = update_data.save()

        return Response(
            {
                "answer": AnswerDetailSerializer(updated_answer).data,
                "message": "Your answer has been updated!",
            }
        )

    def patch(self, request, pk):
        # Allow partial updates to answers
        answer = get_object_or_404(Answer, pk=pk)

        if answer.author != request.user:
            return Response(
                {"error": "You can only edit your own answers"},
                status=status.HTTP_403_FORBIDDEN,
            )

        update_data = AnswerUpdateSerializer(answer, data=request.data, partial=True)
        update_data.is_valid(raise_exception=True)
        updated_answer = update_data.save()

        return Response(AnswerDetailSerializer(updated_answer).data)

    def delete(self, request, pk):
        # Let users delete their own answers
        answer = get_object_or_404(Answer, pk=pk)

        if answer.author != request.user:
            return Response(
                {"error": "You can only delete your own answers"},
                status=status.HTTP_403_FORBIDDEN,
            )

        answer.delete()
        return Response(
            {"message": "Your answer has been deleted successfully"},
            status=status.HTTP_204_NO_CONTENT,
        )


class UserAnswersView(APIView):
    """Show all answers posted by a specific user"""

    permission_classes = [permissions.AllowAny]

    def get(self, request, username):
        # Find all answers by this user
        user_answers = Answer.objects.filter(author__username=username)
        answers_data = AnswerListSerializer(user_answers, many=True)

        return Response(
            {
                "user": username,
                "answers_count": user_answers.count(),
                "answers": answers_data.data,
            }
        )
