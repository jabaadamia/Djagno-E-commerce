from django.urls import resolve
from django.urls import reverse


def test_cart_list_url():
    url = reverse("api:cart-list")
    assert url == "/api/cart/"
    assert resolve(url).view_name == "api:cart-list"


def test_cart_add_to_cart_url():
    url = reverse("api:cart-add-to-cart")
    assert url == "/api/cart/add_to_cart/"
    assert resolve(url).view_name == "api:cart-add-to-cart"


def test_cart_remove_item_url():
    url = reverse("api:cart-remove-item")
    assert url == "/api/cart/remove_item/"
    assert resolve(url).view_name == "api:cart-remove-item"


def test_cart_update_quantity_url():
    url = reverse("api:cart-update-quantity")
    assert url == "/api/cart/update_quantity/"
    assert resolve(url).view_name == "api:cart-update-quantity"
