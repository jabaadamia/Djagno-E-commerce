from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from e_commerce.cart.models import Cart
from e_commerce.orders.models import Order
from e_commerce.orders.models import OrderItem

from .serializers import OrderSerializer


class OrderViewSet(viewsets.ModelViewSet):
    """CRUD for Orders"""

    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if not hasattr(self.request.user, "customer"):
            return Order.objects.none()
        return Order.objects.filter(customer=self.request.user.customer)

    def perform_create(self, serializer):
        user = self.request.user
        cart = get_object_or_404(Cart, customer=user.customer)
        cart_items = cart.items.all()

        if not cart_items.exists():
            msg = "Cart is empty."
            raise ValidationError(msg)

        shipping_address = self.request.data.get("shipping_address")
        if not shipping_address:
            msg = "Shipping address is required."
            raise ValidationError(msg)

        # calculate totals before saving order
        total = 0
        platform_commission = 0
        order_items = []
        for item in cart_items:
            price = item.product.price
            quantity = item.quantity
            seller = item.product.seller
            commission = price * quantity * 0  # for now 0
            platform_commission += commission
            order_items.append(
                {
                    "product": item.product,
                    "seller": seller,
                    "quantity": quantity,
                    "price_at_time": price,
                    "seller_status": "pending",
                    "stripe_transfer_id": "",
                    "seller_payout_amount": price * quantity - commission,
                },
            )
            total += price * quantity

        order = serializer.save(
            customer=user.customer,
            total_amount=total,
            platform_commission=platform_commission,
            shipping_address_id=shipping_address,
        )

        for item_data in order_items:
            OrderItem.objects.create(order=order, **item_data)

        # clear cart
        cart_items.delete()

    @action(detail=True, methods=["post"], url_path="checkout")
    def checkout(self, request, pk=None):
        order = self.get_object()
        from e_commerce.orders.services.stripe_service import StripeService

        try:
            result = StripeService.create_payment_intent(order)
            return Response(result, status=200)
        except Exception as e:  # noqa: BLE001
            return Response({"error": str(e)}, status=400)
