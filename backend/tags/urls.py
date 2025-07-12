from django.urls import path
from . import views

urlpatterns = [
    path("", views.TagListCreateView.as_view(), name="tag-list-create"),
    path("<int:pk>/", views.TagDetailView.as_view(), name="tag-detail"),
    path("popular/", views.PopularTagsView.as_view(), name="popular-tags"),
    path("suggestions/", views.TagSuggestionsView.as_view(), name="tag-suggestions"),
]
