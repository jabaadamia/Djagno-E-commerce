from django.contrib import admin

from .models import Order
from .models import OrderItem
from .models import Payment
from .models import SellerPayout


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    """Admin panel for Orders."""

    list_display = ("id", "customer", "created_at", "status")
    list_filter = ("status", "created_at")
    search_fields = ("customer__user__username", "customer__user__email")
    ordering = ("-created_at",)


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    """Admin panel for OrderItems."""

    list_display = ("id", "order", "product", "quantity")
    list_filter = ("order", "product")
    search_fields = ("order__customer__user__username", "product__name")


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    """Admin panel for Payments."""

    list_display = ("id", "order", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("order__customer__user__username",)


@admin.register(SellerPayout)
class SellerPayoutAdmin(admin.ModelAdmin):
    """Admin panel for SellerPayouts."""

    list_display = (
        "id",
        "seller",
        "order_item",
        "amount",
        "status",
        "created_at",
        "processed_at",
    )
    list_filter = ("status", "created_at")
    search_fields = ("seller__user__username", "order_item__order__order_number")
