from django.urls import path
from . import views

urlpatterns = [
    path(
        "question/<slug:question_slug>/",
        views.QuestionVoteView.as_view(),
        name="vote-question",
    ),
    path("answer/<int:answer_id>/", views.AnswerVoteView.as_view(), name="vote-answer"),
    path(
        "status/<str:content_type>/<int:object_id>/",
        views.UserVoteStatusView.as_view(),
        name="user-vote-status",
    ),
]
