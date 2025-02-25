from django.conf import settings  # noqa: I001
from rest_framework.routers import DefaultRouter
from rest_framework.routers import SimpleRouter
from rest_framework_nested.routers import NestedSimpleRouter, NestedDefaultRouter

from e_commerce.users.api.views import (
    UserViewSet,
    CustomerViewSet,
    SellerViewSet,
    AddressViewSet,
)

from e_commerce.products.api.views import (
    ProductViewSet,
    CategoryViewSet,
)  # , ProductImageViewSet

from e_commerce.cart.api.views import CartViewSet

router = DefaultRouter() if settings.DEBUG else SimpleRouter()

router.register("users", UserViewSet)
router.register("customers", CustomerViewSet, basename="customer")
router.register("sellers", SellerViewSet, basename="seller")

nested_router_class = NestedDefaultRouter if settings.DEBUG else NestedSimpleRouter

# Naseted routes for addresses
customer_router = nested_router_class(router, "customers")
customer_router.register("addresses", AddressViewSet, basename="customer-addresses")

seller_router = nested_router_class(router, "sellers")
seller_router.register("addresses", AddressViewSet, basename="seller-addresses")

router.register("products", ProductViewSet)

router.register("categories", CategoryViewSet)

router.register("cart", CartViewSet, basename="cart")

app_name = "api"
urlpatterns = router.urls + customer_router.urls + seller_router.urls
