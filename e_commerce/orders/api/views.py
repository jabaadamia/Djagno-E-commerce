from django.db import transaction
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.decorators import permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from e_commerce.orders.models import Order
from e_commerce.orders.models import Payment
from e_commerce.orders.models import SellerPayout
from e_commerce.orders.services.stripe_service import StripeService


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_payment_intent(request):
    """Create a payment intent for checkout"""
    try:
        order_id = request.data.get("order_id")

        if not order_id:
            return Response(
                {"error": "order_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order = get_object_or_404(Order, id=order_id, customer=request.user)

        # Check if order is in correct state for payment
        if order.payment_status != "pending":
            return Response(
                {"error": "Order payment is not in pending state"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create payment intent
        result = StripeService.create_payment_intent(order)

        return Response(
            {
                "client_secret": result["client_secret"],
                "payment_intent_id": result["payment_intent_id"],
                "order_id": str(order.id),
                "amount": float(order.total_amount),
            },
            status=status.HTTP_200_OK,
        )

    except Exception as e:  # noqa: BLE001
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def confirm_payment(request):
    """Confirm payment and update order status"""
    try:
        payment_intent_id = request.data.get("payment_intent_id")

        if not payment_intent_id:
            return Response(
                {"error": "payment_intent_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Confirm payment with Stripe
        payment_result = StripeService.confirm_payment(payment_intent_id)

        # Get order
        order = get_object_or_404(Order, stripe_payment_intent_id=payment_intent_id)

        # Ensure this user owns the order
        if order.customer != request.user:
            return Response(
                {"error": "Permission denied"},
                status=status.HTTP_403_FORBIDDEN,
            )

        with transaction.atomic():
            if payment_result["status"] == "succeeded":
                order.payment_status = "succeeded"
                order.status = "processing"
                order.save()

                # Create payment record
                payment, created = Payment.objects.get_or_create(
                    order=order,
                    stripe_payment_intent_id=payment_intent_id,
                    defaults={
                        "amount": payment_result["amount"],
                        "currency": payment_result["currency"],
                        "status": payment_result["status"],
                    },
                )

                # Update all order items status
                order.items.update(seller_status="processing")

                return Response(
                    {
                        "success": True,
                        "order": {
                            "id": str(order.id),
                            "order_number": order.order_number,
                            "status": order.status,
                            "payment_status": order.payment_status,
                            "total_amount": float(order.total_amount),
                        },
                    },
                    status=status.HTTP_200_OK,
                )

            order.payment_status = "failed"
            order.save()

            return Response(
                {
                    "success": False,
                    "message": f"Payment failed with status: {payment_result['status']}",  # noqa: E501
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    except Exception as e:  # noqa: BLE001
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_order_payment_status(request, order_id):
    """Get payment status for an order"""
    try:
        order = get_object_or_404(Order, id=order_id, customer=request.user)

        return Response(
            {
                "order_id": str(order.id),
                "order_number": order.order_number,
                "status": order.status,
                "payment_status": order.payment_status,
                "total_amount": float(order.total_amount),
                "stripe_payment_intent_id": order.stripe_payment_intent_id,
            },
            status=status.HTTP_200_OK,
        )

    except Exception as e:  # noqa: BLE001
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def process_refund(request):
    """Process a refund for an order"""
    try:
        order_id = request.data.get("order_id")
        refund_amount = request.data.get("amount")  # Optional partial refund

        if not order_id:
            return Response(
                {"error": "order_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order = get_object_or_404(Order, id=order_id)

        # Check if user has permission (customer or admin)
        if order.customer != request.user and not request.user.is_staff:
            return Response(
                {"error": "Permission denied"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Check if order can be refunded
        if order.payment_status != "succeeded":
            return Response(
                {"error": "Order payment is not in succeeded state"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Process refund
        refund_result = StripeService.refund_payment(
            order.stripe_payment_intent_id,
            refund_amount,
        )

        # Update order status
        order.payment_status = "refunded"
        order.status = "refunded"
        order.save()

        return Response(
            {
                "success": True,
                "refund_id": refund_result["refund_id"],
                "amount": refund_result["amount"],
                "status": refund_result["status"],
            },
            status=status.HTTP_200_OK,
        )

    except Exception as e:  # noqa: BLE001
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name="dispatch")
class StripeWebhookView(View):
    """Handle Stripe webhook events"""

    def post(self, request):
        payload = request.body
        sig_header = request.headers.get("stripe-signature")

        try:
            event = StripeService.handle_webhook(payload.decode("utf-8"), sig_header)

            # Handle different event types
            if event["type"] == "payment_intent.succeeded":
                self.handle_payment_success(event["data"]["object"])
            elif event["type"] == "payment_intent.payment_failed":
                self.handle_payment_failed(event["data"]["object"])
            elif event["type"] == "payment_intent.canceled":
                self.handle_payment_canceled(event["data"]["object"])
            elif event["type"] == "charge.dispute.created":
                self.handle_chargeback(event["data"]["object"])

            return HttpResponse(status=200)

        except Exception as e:  # noqa: BLE001
            print(f"Webhook error: {e!s}")  # noqa: T201
            return HttpResponse(status=400)

    def handle_payment_success(self, payment_intent):
        """Handle successful payment"""
        try:
            with transaction.atomic():
                order = Order.objects.get(stripe_payment_intent_id=payment_intent["id"])
                order.payment_status = "succeeded"
                order.status = "processing"
                order.save()

                # Create or update payment record
                payment, created = Payment.objects.get_or_create(
                    order=order,
                    stripe_payment_intent_id=payment_intent["id"],
                    defaults={
                        "amount": payment_intent["amount"] / 100,
                        "currency": payment_intent["currency"],
                        "status": payment_intent["status"],
                        "stripe_metadata": payment_intent.get("metadata", {}),
                    },
                )

                # Update order items
                order.items.update(seller_status="processing")

                # Process seller payouts
                self.process_seller_payouts(order)

        except Order.DoesNotExist:
            print(f"Order not found for payment intent: {payment_intent['id']}")  # noqa: T201

    def handle_payment_failed(self, payment_intent):
        """Handle failed payment"""
        try:
            order = Order.objects.get(stripe_payment_intent_id=payment_intent["id"])
            order.payment_status = "failed"
            order.save()
        except Order.DoesNotExist:
            print(f"Order not found for payment intent: {payment_intent['id']}")  # noqa: T201

    def handle_payment_canceled(self, payment_intent):
        """Handle canceled payment"""
        try:
            order = Order.objects.get(stripe_payment_intent_id=payment_intent["id"])
            order.payment_status = "cancelled"
            order.save()
        except Order.DoesNotExist:
            print(f"Order not found for payment intent: {payment_intent['id']}")  # noqa: T201

    def handle_chargeback(self, charge):
        """Handle chargeback disputes"""
        try:
            # Find the order associated with this charge
            payment_intent_id = charge.get("payment_intent")
            if payment_intent_id:
                order = Order.objects.get(stripe_payment_intent_id=payment_intent_id)
                # You might want to create a dispute model to track this
                print(f"Chargeback created for order: {order.order_number}")  # noqa: T201
        except Order.DoesNotExist:
            print(f"Order not found for charge: {charge['id']}")  # noqa: T201

    def process_seller_payouts(self, order):
        for item in order.items.all():
            seller = item.seller
            # Ensure seller has a Stripe account
            if not seller.stripe_account_id:
                continue  # or log/raise error

            payout_amount = item.seller_payout_amount
            try:
                transfer = StripeService.create_seller_transfer(
                    seller.stripe_account_id,
                    payout_amount,
                    str(item.id),
                )
                # Save transfer ID and mark payout as processed
                item.stripe_transfer_id = transfer.id
                item.save()
                SellerPayout.objects.create(
                    seller=seller,
                    order_item=item,
                    amount=payout_amount,
                    stripe_transfer_id=transfer.id,
                    status="succeeded",
                )
            except Exception as e:  # noqa: BLE001
                print(f"Failed to process payout for item {item.id}: {e!s}")  # noqa: T201
                SellerPayout.objects.create(
                    seller=seller,
                    order_item=item,
                    amount=payout_amount,
                    stripe_transfer_id="",
                    status="failed",
                )
