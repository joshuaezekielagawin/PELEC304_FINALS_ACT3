from django.contrib import admin

from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'subcategory', 'brand_or_composer', 'price', 'stock', 'is_featured')
    list_filter = ('category', 'subcategory', 'is_featured')
    search_fields = ('name', 'brand_or_composer', 'description')
    prepopulated_fields = {'slug': ('name',)}
