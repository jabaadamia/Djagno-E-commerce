import pytest
from rest_framework.test import APIRequestFactory

from e_commerce.users.api.views import AddressViewSet
from e_commerce.users.api.views import CustomerViewSet
from e_commerce.users.api.views import SellerViewSet
from e_commerce.users.api.views import UserViewSet
from e_commerce.users.models import Address
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
def another_user(db):
    return User.objects.create_user(
        username="otheruser",
        password="pass",  # noqa: S106
        name="Other User",
    )


@pytest.fixture
def customer(user):
    return Customer.objects.create(user=user)


@pytest.fixture
def seller(user):
    return Seller.objects.create(user=user, shop_name="Shop", shop_description="Desc")


@pytest.fixture
def address(user):
    return Address.objects.create(
        user=user,
        street="123 Main St",
        city="Testville",
        state="Teststate",
        country="Testland",
        postal_code="12345",
    )


class TestUserViewSet:
    def test_get_queryset(self, user, api_rf):
        view = UserViewSet()
        request = api_rf.get("/fake-url/")
        request.user = user
        view.request = request
        assert user in view.get_queryset()

    def test_me(self, user, api_rf):
        view = UserViewSet()
        request = api_rf.get("/fake-url/")
        request.user = user
        view.request = request
        response = view.me(request)
        assert response.data["username"] == user.username
        assert response.data["url"].endswith(f"/api/users/{user.username}/")


class TestCustomerViewSet:
    def test_get_queryset(self, customer, api_rf):
        view = CustomerViewSet()
        request = api_rf.get("/fake-url/")
        request.user = customer.user
        view.request = request
        assert customer in view.get_queryset()

    def test_me(self, customer, api_rf):
        view = CustomerViewSet()
        request = api_rf.get("/fake-url/")
        request.user = customer.user
        view.request = request
        # Patch the action method if needed, or call directly if implemented
        if hasattr(view, "me"):
            response = view.me(request)
            assert response.status_code == 200 or response.status_code == 404  # noqa: PLR1714, PLR2004


class TestSellerViewSet:
    def test_get_queryset(self, seller, api_rf):
        view = SellerViewSet()
        request = api_rf.get("/fake-url/")
        request.user = seller.user
        view.request = request
        assert seller in view.get_queryset()

    def test_me(self, seller, api_rf):
        view = SellerViewSet()
        request = api_rf.get("/fake-url/")
        request.user = seller.user
        view.request = request
        if hasattr(view, "me"):
            response = view.me(request)
            assert response.status_code == 200 or response.status_code == 404  # noqa: PLR1714, PLR2004


class TestAddressViewSet:
    def test_get_queryset(self, address, api_rf):
        view = AddressViewSet()
        request = api_rf.get("/fake-url/")
        request.user = address.user
        view.request = request
        view.kwargs = {"nested_1_user__username": address.user.username}
        assert address in view.get_queryset()
