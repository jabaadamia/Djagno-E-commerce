from django.contrib import admin

from .models import Order
from .models import OrderItem
from .models import Payment


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    """Admin panel for Orders."""

    list_display = ("id", "customer", "created_at", "status", "total_price")
    list_filter = ("status", "created_at")
    search_fields = ("customer__user__username", "customer__user__email")
    ordering = ("-created_at",)


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    """Admin panel for OrderItems."""

    list_display = ("id", "order", "product", "quantity", "price")
    list_filter = ("order", "product")
    search_fields = ("order__customer__user__username", "product__name")


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    """Admin panel for Payments."""

    list_display = (
        "id",
        "order",
        "payment_method",
        "transaction_id",
        "status",
        "created_at",
    )
    list_filter = ("status", "payment_method")
    search_fields = ("order__customer__user__username", "transaction_id")
