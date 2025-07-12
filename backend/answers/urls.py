from django.urls import path
from . import views

urlpatterns = [
    path(
        "question/<slug:question_slug>/",
        views.AnswerListCreateView.as_view(),
        name="answer-list-create",
    ),
    path("<int:pk>/", views.AnswerDetailView.as_view(), name="answer-detail"),
    path("users/<str:username>/", views.UserAnswersView.as_view(), name="user-answers"),
]
