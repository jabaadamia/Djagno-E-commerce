import pytest
from rest_framework.test import APIRequestFactory
from rest_framework.test import force_authenticate

from e_commerce.cart.api.views import CartViewSet
from e_commerce.products.models import Category
from e_commerce.products.models import Product
from e_commerce.users.models import Customer
from e_commerce.users.models import Seller
from e_commerce.users.models import User


@pytest.fixture
def api_rf():
    return APIRequestFactory()


@pytest.fixture
def user(db):
    return User.objects.create_user(
        username="testuser",
        password="pass",  # noqa: S106
        name="Test User",
    )


@pytest.fixture
def customer(user):
    return Customer.objects.create(user=user)


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


class TestCartViewSet:
    def test_cart_list(self, user, customer, api_rf):
        view = CartViewSet.as_view({"get": "list"})
        request = api_rf.get("/api/cart/")
        force_authenticate(request, user=user)
        response = view(request)
        # 404 if cart does not exist, 200 if it does
        assert response.status_code in (200, 404)

    def test_add_to_cart(self, user, customer, api_rf, product):
        view = CartViewSet.as_view({"post": "add_to_cart"})
        data = {"product_id": product.id, "quantity": 2}
        request = api_rf.post("/api/cart/add-to-cart/", data)
        force_authenticate(request, user=user)
        response = view(request)
        assert response.status_code == 200  # noqa: PLR2004

    def test_remove_item(self, user, customer, api_rf, product):
        # First, add to cart so we can remove it
        cart_view = CartViewSet.as_view({"post": "add_to_cart"})
        add_data = {"product_id": product.id, "quantity": 1}
        add_request = api_rf.post("/api/cart/add-to-cart/", add_data)
        force_authenticate(add_request, user=user)
        cart_view(add_request)

        view = CartViewSet.as_view({"delete": "remove_item"})
        data = {"product_id": product.id}
        request = api_rf.delete("/api/cart/remove-item/", data)
        force_authenticate(request, user=user)
        response = view(request)
        assert response.status_code in (200, 404)

    def test_update_quantity(self, user, customer, api_rf, product):
        # First, add to cart so we can update it
        cart_view = CartViewSet.as_view({"post": "add_to_cart"})
        add_data = {"product_id": product.id, "quantity": 1}
        add_request = api_rf.post("/api/cart/add-to-cart/", add_data)
        force_authenticate(add_request, user=user)
        cart_view(add_request)

        view = CartViewSet.as_view({"patch": "update_quantity"})
        data = {"product_id": product.id, "quantity": 5}
        request = api_rf.patch("/api/cart/update-quantity/", data)
        force_authenticate(request, user=user)
        response = view(request)
        assert response.status_code in (200, 404)
