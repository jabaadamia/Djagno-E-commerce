from django.db.models import (  # noqa: I001
    Model,
    PositiveIntegerField,
    DateTimeField,
    ForeignKey,
    OneToOneField,
    CASCADE,
    UniqueConstraint,
)

from e_commerce.users.models import Customer
from e_commerce.products.models import Product


class Cart(Model):
    customer = OneToOneField(Customer, on_delete=CASCADE, related_name="cart")
    created_at = DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Cart of {self.user.username}"


class CartItem(Model):
    cart = ForeignKey(Cart, on_delete=CASCADE, related_name="items")
    product = ForeignKey(Product, on_delete=CASCADE)
    quantity = PositiveIntegerField(default=1)

    class Meta:
        constraints = [
            UniqueConstraint(fields=["cart", "product"], name="unique_cart_item"),
        ]

    def __str__(self):
        return f"{self.quantity} x {self.product.name}"
