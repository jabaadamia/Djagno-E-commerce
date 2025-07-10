from django.db.models import (  # noqa: I001
    Model,
    OneToOneField,
    ForeignKey,
    PositiveIntegerField,
    DecimalField,
    DateTimeField,
    CharField,
    UUIDField,
    JSONField,
    CASCADE,
    PROTECT,
)
from django.utils import timezone
import uuid
from e_commerce.products.models import Product
from e_commerce.users.models import Customer, Seller, Address


class Order(Model):
    ORDER_STATUS_CHOICES = [
        ("pending", "Pending"),
        ("processing", "Processing"),
        ("shipped", "Shipped"),
        ("delivered", "Delivered"),
        ("cancelled", "Cancelled"),
        ("refunded", "Refunded"),
    ]

    PAYMENT_STATUS_CHOICES = [
        ("pending", "Pending"),
        ("processing", "Processing"),
        ("succeeded", "Succeeded"),
        ("failed", "Failed"),
        ("cancelled", "Cancelled"),
        ("refunded", "Refunded"),
    ]

    id = UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = ForeignKey(
        Customer,
        on_delete=CASCADE,
        related_name="orders",
    )
    order_number = CharField(max_length=100, unique=True)

    # Stripe Integration Fields
    stripe_payment_intent_id = CharField(max_length=200)
    stripe_payment_intent_client_secret = CharField(max_length=500)

    # Order Details
    total_amount = DecimalField(max_digits=10, decimal_places=2)
    platform_commission = DecimalField(max_digits=10, decimal_places=2)
    status = CharField(
        max_length=20,
        choices=ORDER_STATUS_CHOICES,
        default="pending",
    )
    payment_status = CharField(
        max_length=20,
        choices=PAYMENT_STATUS_CHOICES,
        default="pending",
    )

    # Timestamps
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)

    # Shipping Information
    shipping_address = ForeignKey(
        Address,
        on_delete=PROTECT,
        related_name="shipping_orders",
    )
    shipping_cost = DecimalField(max_digits=8, decimal_places=2, default=0)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Order {self.order_number} - {self.customer.user.username}"

    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = f"ORD-{timezone.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"  # noqa: E501
        super().save(*args, **kwargs)

    def create_address_snapshot(self):
        return {
            "shipping": {
                "full_address": str(self.shipping_address),
            },
            "billing": {
                "full_address": str(self.billing_address)
                if self.billing_address
                else None,
            }
            if self.billing_address
            else None,
        }

    def get_sellers(self):
        """Get all sellers involved in this order"""
        return Seller.objects.filter(order_items__order=self).distinct()

    def get_items_by_seller(self):
        """Group order items by seller"""
        from itertools import groupby

        items = self.items.select_related("seller", "product").order_by("seller__id")
        return {
            seller: list(items)
            for seller, items in groupby(items, key=lambda x: x.seller)
        }


class OrderItem(Model):
    order = ForeignKey(
        Order,
        on_delete=CASCADE,
        related_name="items",
    )
    product = ForeignKey(
        Product,
        on_delete=CASCADE,
    )
    seller = ForeignKey(
        Seller,
        on_delete=CASCADE,
        related_name="order_items",
    )
    quantity = PositiveIntegerField(default=1)
    price_at_time = DecimalField(
        max_digits=10,
        decimal_places=2,
    )
    # Seller-specific status
    seller_status = CharField(
        max_length=20,
        choices=Order.ORDER_STATUS_CHOICES,
        default="pending",
    )

    # Stripe Connect - for multi-vendor payouts
    stripe_transfer_id = CharField(max_length=200)
    seller_payout_amount = DecimalField(max_digits=10, decimal_places=2)

    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)

    class Meta:
        unique_together = ["order", "product"]

    def __str__(self):
        return (
            f"{self.product.name} x {self.quantity} - Order {self.order.order_number}"
        )

    @property
    def total_price(self):
        return self.price_at_time * self.quantity


class Payment(Model):
    """Track payment transactions"""

    order = OneToOneField(
        Order,
        on_delete=CASCADE,
        related_name="payment",
    )
    stripe_payment_intent_id = CharField(
        max_length=200,
        unique=True,
    )
    amount = DecimalField(max_digits=10, decimal_places=2)
    currency = CharField(max_length=3, default="USD")
    status = CharField(max_length=20, default="pending")

    # Metadata from Stripe
    stripe_metadata = JSONField(default=dict)

    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment {self.stripe_payment_intent_id} - {self.amount}"


class SellerPayout(Model):
    """Track payouts to sellers"""

    seller = ForeignKey(
        Seller,
        on_delete=CASCADE,
        related_name="payouts",
    )
    order_item = ForeignKey(
        OrderItem,
        on_delete=CASCADE,
    )
    amount = DecimalField(max_digits=10, decimal_places=2)
    stripe_transfer_id = CharField(max_length=200)
    status = CharField(max_length=20, default="pending")

    created_at = DateTimeField(auto_now_add=True)
    processed_at = DateTimeField(null=True)

    def __str__(self):
        return f"Payout to {self.seller.user.username} - ${self.amount}"
