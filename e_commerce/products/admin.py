from django.contrib import admin

from .models import Category
from .models import Product
from .models import ProductImage


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    """Admin panel for categories."""

    list_display = ["id", "name"]
    search_fields = ["name"]
    ordering = ["id"]


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    """Admin panel for products."""

    list_display = ["id", "name", "price", "seller", "created_at"]
    search_fields = ["name", "seller__user__username"]
    ordering = ["id"]
    list_filter = ["categories"]


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    """Admin panel for product images."""

    list_display = ["id", "product", "image"]
    search_fields = ["product__name"]
    ordering = ["id"]
