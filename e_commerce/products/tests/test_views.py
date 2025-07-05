import pytest
from rest_framework.test import APIRequestFactory

from e_commerce.products.api.views import CategoryViewSet
from e_commerce.products.api.views import ProductViewSet
from e_commerce.products.models import Category
from e_commerce.products.models import Product
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


class TestProductViewSet:
    def test_get_queryset(self, api_rf):
        view = ProductViewSet()
        request = api_rf.get("/fake-url/")
        view.request = request
        # Should return a queryset
        assert hasattr(view.get_queryset(), "all")

    def test_my_products(self, seller, api_rf, product):
        view = ProductViewSet()
        request = api_rf.get("/api/products/my_products/")
        request.user = seller.user
        view.request = request
        # Patch query_params for the test, as DRF expects it
        view.request.query_params = request.GET
        response = view.my_products(request)
        assert response.status_code == 200  # noqa: PLR2004

        # Handle paginated and non-paginated responses
        data = response.data
        if isinstance(data, dict) and "results" in data:
            products = data["results"]
        else:
            products = data

        assert any(
            isinstance(prod, dict) and prod.get("name") == product.name
            for prod in products
        )

    def test_create_permission_denied(self, user, api_rf, category):
        view = ProductViewSet()
        data = {"name": "New Product", "price": 50, "categories": [category.id]}
        request = api_rf.post("/api/products/", data)
        request.user = user  # user is not a seller
        view.request = request
        response = view.create(request)
        assert response.status_code == 403  # noqa: PLR2004


class TestCategoryViewSet:
    def test_get_queryset(self, api_rf):
        view = CategoryViewSet()
        request = api_rf.get("/fake-url/")
        view.request = request
        # Should return a queryset
        assert hasattr(view.get_queryset(), "all")

    def test_permissions_get(self, api_rf):
        view = CategoryViewSet()
        request = api_rf.get("/api/categories/")
        view.request = request
        permissions = view.get_permissions()
        # Should use IsAuthenticated for GET
        assert any(p.__class__.__name__ == "IsAuthenticated" for p in permissions)

    def test_permissions_post(self, api_rf):
        view = CategoryViewSet()
        request = api_rf.post("/api/categories/", {})
        view.request = request
        permissions = view.get_permissions()
        # Should use IsAdminUser for POST
        assert any(p.__class__.__name__ == "IsAdminUser" for p in permissions)
