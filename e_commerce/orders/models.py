from django.db.models import (  # noqa: I001
    Model,
    OneToOneField,
    ForeignKey,
    PositiveIntegerField,
    DecimalField,
    DateTimeField,
    CharField,
    CASCADE,
)
from e_commerce.products.models import Product
from e_commerce.users.models import Customer


class Order(Model):
    customer = ForeignKey(Customer, on_delete=CASCADE)
    created_at = DateTimeField(auto_now_add=True)
    status = CharField(
        max_length=20,
        choices=[
            ("pending", "Pending"),
            ("paid", "Paid"),
            ("shipped", "Shipped"),
            ("delivered", "Delivered"),
            ("canceled", "Canceled"),
        ],
        default="pending",
    )
    total_price = DecimalField(max_digits=10, decimal_places=2, default=0)

    def __str__(self):
        return f"order by {self.customer}, at {self.created_at}"


class OrderItem(Model):
    order = ForeignKey(Order, related_name="order_items", on_delete=CASCADE)
    product = ForeignKey(Product, on_delete=CASCADE)
    quantity = PositiveIntegerField(default=1)
    price = DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.order} {self.product}"

    def save(self, *args, **kwargs):
        self.price = self.product.price
        super().save(*args, **kwargs)


class Payment(Model):
    order = OneToOneField(Order, related_name="payment", on_delete=CASCADE)
    payment_method = CharField(
        max_length=20,
        choices=[
            ("credit_card", "Credit Card"),
            ("paypal", "PayPal"),
            ("cash", "Cash"),
        ],
    )
    transaction_id = CharField(max_length=100, blank=True)
    status = CharField(
        max_length=20,
        choices=[
            ("pending", "Pending"),
            ("completed", "Completed"),
            ("failed", "Failed"),
        ],
        default="pending",
    )
    created_at = DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment for {self.order} - {self.status}"
