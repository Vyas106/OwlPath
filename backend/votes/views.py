from rest_framework.views import APIView
from rest_framework import status, permissions
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.contenttypes.models import ContentType
from questions.models import Question
from answers.models import Answer
from .models import Vote
from .serializers import VoteCreateSerializer


class QuestionVoteView(APIView):
    """Let users vote up or down on questions"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, question_slug):
        # Find the question first
        question = get_object_or_404(Question, slug=question_slug)

        vote_data = VoteCreateSerializer(data=request.data)
        vote_data.is_valid(raise_exception=True)

        vote_value = vote_data.validated_data["value"]
        vote = Vote.toggle_vote(request.user, question, vote_value)

        if vote:
            return Response(
                {
                    "message": "Thanks for voting! Your vote has been recorded.",
                    "vote_value": vote.value,
                    "vote_score": question.vote_score,
                }
            )
        else:
            return Response(
                {
                    "message": "Your vote has been removed.",
                    "vote_score": question.vote_score,
                }
            )


class AnswerVoteView(APIView):
    """Let users vote up or down on answers"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, answer_id):
        # Find the answer first
        answer = get_object_or_404(Answer, id=answer_id)

        vote_data = VoteCreateSerializer(data=request.data)
        vote_data.is_valid(raise_exception=True)

        vote_value = vote_data.validated_data["value"]
        vote = Vote.toggle_vote(request.user, answer, vote_value)

        if vote:
            return Response(
                {
                    "message": "Your vote on this answer has been recorded!",
                    "vote_value": vote.value,
                    "vote_score": answer.vote_score,
                }
            )
        else:
            return Response(
                {
                    "message": "Your vote has been removed.",
                    "vote_score": answer.vote_score,
                }
            )


class UserVoteStatusView(APIView):
    """Check if a user has voted on a specific question or answer"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, content_type, object_id):
        # Let users see their vote status on any content
        try:
            ct = ContentType.objects.get(model=content_type)
            vote = Vote.objects.get(
                user=request.user, content_type=ct, object_id=object_id
            )
            return Response({"vote_value": vote.value})
        except (ContentType.DoesNotExist, Vote.DoesNotExist):
            return Response({"vote_value": None})
