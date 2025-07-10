from django.urls import path

from . import views

app_name = "orders"

urlpatterns = [
    # payment endpoints
    path(
        "create-payment-intent/",
        views.create_payment_intent,
        name="create_payment_intent",
    ),
    path(
        "confirm-payment/",
        views.confirm_payment,
        name="confirm_payment",
    ),
    path(
        "order/<uuid:order_id>/payment-status/",
        views.get_order_payment_status,
        name="get_order_payment_status",
    ),
    path("process-refund/", views.process_refund, name="process_refund"),
]
