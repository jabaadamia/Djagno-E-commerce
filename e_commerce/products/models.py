from django.db.models import (  # noqa: I001
    Model,
    CharField,
    DecimalField,
    PositiveIntegerField,
    TextField,
    DateTimeField,
    ImageField,
    ForeignKey,
    ManyToManyField,
    CASCADE,
)
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

from e_commerce.users.models import Seller


class Category(Model):
    name = CharField(_("Name of Category"), max_length=255, unique=True)

    def __str__(self):
        return self.name


class Product(Model):
    name = CharField(max_length=100)
    description = TextField()
    price = DecimalField(max_digits=10, decimal_places=2)
    created_at = DateTimeField(auto_now_add=True)
    available_quantity = PositiveIntegerField(default=1)
    seller = ForeignKey(Seller, on_delete=CASCADE, related_name="products")
    categories = ManyToManyField(Category, related_name="products")

    def __str__(self):
        return self.name

    def clean(self):
        if not self.images.exists():
            raise ValidationError("Product must have at least one image.")  # noqa: EM101, TRY003


class ProductImage(Model):
    product = ForeignKey(Product, related_name="images", on_delete=CASCADE)
    image = ImageField(upload_to="product_images/")

    def __str__(self):
        return f"Image for {self.product.name}"
