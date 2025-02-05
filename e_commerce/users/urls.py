from django.urls import path  # noqa: I001

from .views import (
    customer_detail_view,
    customer_redirect_view,
    customer_update_view,
    seller_detail_view,
    seller_redirect_view,
    seller_update_view,
    user_detail_view,
    user_redirect_view,
    user_update_view,
)

app_name = "users"
urlpatterns = [
    path("customers/<str:username>/", customer_detail_view, name="customer-detail"),
    path("customers/update/", customer_update_view, name="customer-update"),
    path("customers/redirect/", customer_redirect_view, name="customer-redirect"),
    path("sellers/<str:username>/", seller_detail_view, name="seller-detail"),
    path("sellers/update/", seller_update_view, name="seller-update"),
    path("sellers/redirect/", seller_redirect_view, name="seller-redirect"),
    path("redirect/", view=user_redirect_view, name="redirect"),
    path("update/", view=user_update_view, name="update"),
    path("<str:username>/", view=user_detail_view, name="detail"),
]
