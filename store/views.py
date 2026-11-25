from django.db.models import Q
from django.shortcuts import render
from rest_framework import viewsets

from .models import Product
from .permissions import IsAdminOrReadOnly
from .serializers import ProductSerializer


class ProductViewSet(viewsets.ModelViewSet):
    """Public read-only, admin-only write API endpoint for shiked6 music store products."""

    serializer_class = ProductSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        queryset = Product.objects.all()
        params = self.request.query_params

        category = params.get('category')
        if category:
            queryset = queryset.filter(category=category)

        subcategory = params.get('subcategory')
        if subcategory:
            queryset = queryset.filter(subcategory=subcategory)

        featured = params.get('featured')
        if featured and featured.lower() == 'true':
            queryset = queryset.filter(is_featured=True)

        search = params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(brand_or_composer__icontains=search)
                | Q(description__icontains=search)
                | Q(subcategory__icontains=search)
            )

        allowed_ordering = {'price', '-price', 'name', '-name', 'created_at', '-created_at', 'id', '-id'}
        ordering = params.get('ordering')
        if ordering in allowed_ordering:
            queryset = queryset.order_by(ordering)

        return queryset


def storefront_view(request):
    """Render the Glassmorphism storefront for shiked6 music store."""
    context = {
        'total_products': Product.objects.count(),
        'instrument_count': Product.objects.filter(category=Product.CATEGORY_INSTRUMENTS).count(),
        'sheet_count': Product.objects.filter(category=Product.CATEGORY_MUSIC_SHEETS).count(),
    }
    return render(request, 'store/index.html', context)
