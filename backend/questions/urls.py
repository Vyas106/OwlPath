from django.urls import path
from . import views

urlpatterns = [
    path("", views.QuestionListCreateView.as_view(), name="question-list-create"),
    path("<slug:slug>/", views.QuestionDetailView.as_view(), name="question-detail"),
    path(
        "<slug:slug>/accept-answer/<int:answer_id>/",
        views.AcceptAnswerView.as_view(),
        name="accept-answer",
    ),
    path(
        "users/<str:username>/",
        views.UserQuestionsView.as_view(),
        name="user-questions",
    ),
]
