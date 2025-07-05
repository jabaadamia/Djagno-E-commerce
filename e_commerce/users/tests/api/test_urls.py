import pytest
from django.urls import resolve
from django.urls import reverse

from e_commerce.users.models import Address
from e_commerce.users.models import Customer
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


def test_user_detail(user):
    url = reverse("api:user-detail", kwargs={"username": user.username})
    assert url == f"/api/users/{user.username}/"
    assert resolve(url).view_name == "api:user-detail"


def test_user_list():
    url = reverse("api:user-list")
    assert url == "/api/users/"
    assert resolve(url).view_name == "api:user-list"


def test_user_me():
    url = reverse("api:user-me")
    assert url == "/api/users/me/"
    assert resolve(url).view_name == "api:user-me"


def test_customer_detail(customer):
    url = reverse(
        "api:customer-detail",
        kwargs={"user__username": customer.user.username},
    )
    assert url == f"/api/customers/{customer.user.username}/"
    assert resolve(url).view_name == "api:customer-detail"


def test_customer_list():
    url = reverse("api:customer-list")
    assert url == "/api/customers/"
    assert resolve(url).view_name == "api:customer-list"


def test_customer_me():
    url = reverse("api:customer-me")
    assert url == "/api/customers/me/"
    assert resolve(url).view_name == "api:customer-me"


def test_seller_detail(seller):
    url = reverse("api:seller-detail", kwargs={"user__username": seller.user.username})
    assert url == f"/api/sellers/{seller.user.username}/"
    assert resolve(url).view_name == "api:seller-detail"


def test_seller_list():
    url = reverse("api:seller-list")
    assert url == "/api/sellers/"
    assert resolve(url).view_name == "api:seller-list"


def test_seller_me():
    url = reverse("api:seller-me")
    assert url == "/api/sellers/me/"
    assert resolve(url).view_name == "api:seller-me"


def test_nested_address_detail(address):
    url = reverse(
        "api:customer-addresses-detail",
        kwargs={
            "nested_1_user__username": address.user.username,
            "pk": address.pk,
        },
    )
    assert url == f"/api/customers/{address.user.username}/addresses/{address.pk}/"
    assert resolve(url).view_name == "api:customer-addresses-detail"


def test_nested_address_list(address):
    url = reverse(
        "api:customer-addresses-list",
        kwargs={"nested_1_user__username": address.user.username},
    )
    assert url == f"/api/customers/{address.user.username}/addresses/"
    assert resolve(url).view_name == "api:customer-addresses-list"


def test_nested_seller_address_detail(address):
    url = reverse(
        "api:seller-addresses-detail",
        kwargs={
            "nested_1_user__username": address.user.username,
            "pk": address.pk,
        },
    )
    assert url == f"/api/sellers/{address.user.username}/addresses/{address.pk}/"
    assert resolve(url).view_name == "api:seller-addresses-detail"


def test_nested_seller_address_list(address):
    url = reverse(
        "api:seller-addresses-list",
        kwargs={"nested_1_user__username": address.user.username},
    )
    assert url == f"/api/sellers/{address.user.username}/addresses/"
    assert resolve(url).view_name == "api:seller-addresses-list"
