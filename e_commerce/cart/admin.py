from django.contrib import admin

from .models import Cart
from .models import CartItem


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    """Admin panel for carts"""

    list_display = ["id", "customer", "created_at"]
    search_fields = ["customer__user__username"]
    ordering = ["id"]
    list_filter = ["created_at"]


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    """Admin panel for cartItems"""

    list_display = ["id", "cart", "product", "quantity"]
    search_fields = ["product__name"]
    ordering = ["id"]
