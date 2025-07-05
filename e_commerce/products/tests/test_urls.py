import pytest
from django.urls import resolve
from django.urls import reverse

from e_commerce.products.models import Category
from e_commerce.products.models import Product
from e_commerce.users.models import Seller
from e_commerce.users.models import User


@pytest.fixture
def user(db):
    return User.objects.create_user(
        username="testuser",
        password="pass",  # noqa: S106
        name="Test User",
    )


@pytest.fixture
def seller(user):
    return Seller.objects.create(user=user, shop_name="Shop", shop_description="Desc")


@pytest.fixture
def category(db):
    return Category.objects.create(name="Electronics")


@pytest.fixture
def product(seller, category):
    product = Product.objects.create(
        name="Test Product",
        price=100,
        seller=seller,
        description="A test product",
    )
    product.categories.add(category)
    return product


def test_product_detail(product):
    url = reverse("api:product-detail", kwargs={"id": product.id})
    assert url == f"/api/products/{product.id}/"
    assert resolve(url).view_name == "api:product-detail"


def test_product_list():
    url = reverse("api:product-list")
    assert url == "/api/products/"
    assert resolve(url).view_name == "api:product-list"


def test_category_detail(category):
    url = reverse("api:category-detail", kwargs={"id": category.id})
    assert url == f"/api/categories/{category.id}/"
    assert resolve(url).view_name == "api:category-detail"


def test_category_list():
    url = reverse("api:category-list")
    assert url == "/api/categories/"
    assert resolve(url).view_name == "api:category-list"


def test_my_products(seller):
    url = reverse("api:product-my-products")
    assert url == "/api/products/my_products/"
    assert resolve(url).view_name == "api:product-my-products"
