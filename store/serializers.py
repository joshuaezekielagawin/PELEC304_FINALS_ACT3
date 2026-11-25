from rest_framework import serializers

from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    """Serializer for shiked6 music store products."""

    category_display = serializers.CharField(source='get_category_display', read_only=True)
    subcategory_display = serializers.CharField(source='get_subcategory_display', read_only=True)
    formatted_price = serializers.SerializerMethodField()
    in_stock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'slug',
            'category',
            'category_display',
            'subcategory',
            'subcategory_display',
            'brand_or_composer',
            'description',
            'price',
            'formatted_price',
            'stock',
            'in_stock',
            'skill_level',
            'image_url',
            'is_featured',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']

    def get_formatted_price(self, obj):
        return f'₱{obj.price:,.2f}'

    def get_in_stock(self, obj):
        return obj.stock > 0

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError('Price must be greater than zero.')
        return value
