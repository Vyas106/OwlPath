from rest_framework.views import APIView
from rest_framework import permissions
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from django.shortcuts import get_object_or_404
from .models import Tag
from .serializers import TagSerializer, TagCreateSerializer, TagListSerializer


class TagListCreateView(APIView):
    """Browse all tags or create your own tag"""

    def get_permissions(self):
        # Anyone can view tags, but you need to be logged in to create them
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get(self, request):
        # Get all tags with optional filtering and searching
        tags = Tag.objects.all()

        # Search by name if query provided
        search_query = request.GET.get("search", "")
        if search_query:
            tags = tags.filter(name__icontains=search_query)

        # Sort by specified field or default to name
        ordering = request.GET.get("ordering", "name")
        if ordering in [
            "name",
            "usage_count",
            "created_at",
            "-name",
            "-usage_count",
            "-created_at",
        ]:
            tags = tags.order_by(ordering)
        else:
            tags = tags.order_by("name")

        tags_data = TagListSerializer(tags, many=True)
        return Response(tags_data.data)

    def post(self, request):
        # Let users create new tags
        tag_data = TagCreateSerializer(data=request.data)
        tag_data.is_valid(raise_exception=True)

        new_tag = tag_data.save()
        return Response(TagSerializer(new_tag).data, status=201)


class TagDetailView(APIView):
    """View, update, or delete a specific tag"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        # Show details of a specific tag
        tag = get_object_or_404(Tag, pk=pk)
        tag_data = TagSerializer(tag)
        return Response(tag_data.data)

    def put(self, request, pk):
        # Update a tag completely
        tag = get_object_or_404(Tag, pk=pk)

        update_data = TagSerializer(tag, data=request.data)
        update_data.is_valid(raise_exception=True)
        updated_tag = update_data.save()

        return Response(TagSerializer(updated_tag).data)

    def patch(self, request, pk):
        # Partially update a tag
        tag = get_object_or_404(Tag, pk=pk)

        update_data = TagSerializer(tag, data=request.data, partial=True)
        update_data.is_valid(raise_exception=True)
        updated_tag = update_data.save()

        return Response(TagSerializer(updated_tag).data)

    def delete(self, request, pk):
        # Delete a tag
        tag = get_object_or_404(Tag, pk=pk)
        tag.delete()
        return Response({"message": "Tag has been deleted successfully"}, status=204)


class PopularTagsView(APIView):
    """Show the most popular tags on the platform"""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        # Get the top 20 most used tags
        popular_tags = Tag.objects.filter(usage_count__gt=0).order_by("-usage_count")[
            :20
        ]
        tags_data = TagListSerializer(popular_tags, many=True)

        return Response(
            {
                "message": "Here are the most popular tags",
                "count": popular_tags.count(),
                "tags": tags_data.data,
            }
        )


class TagSuggestionsView(APIView):
    """Get tag suggestions based on search query"""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        # Help users find tags as they type
        query = request.GET.get("q", "")

        if query:
            suggested_tags = Tag.objects.filter(name__icontains=query)[:10]
            tags_data = TagListSerializer(suggested_tags, many=True)
            return Response(tags_data.data)

        return Response([])
