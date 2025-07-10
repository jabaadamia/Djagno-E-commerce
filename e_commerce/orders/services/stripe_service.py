from decimal import Decimal
from typing import Any

import stripe
from django.conf import settings

from e_commerce.orders.models import OrderItem

stripe.api_key = settings.STRIPE_SECRET_KEY


class StripeService:
    @staticmethod
    def create_payment_intent(
        order,
        metadata: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Create a payment intent for an order"""
        try:
            amount_cents = int(order.total_amount * 100)

            # Create payment intent
            intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency="usd",
                automatic_payment_methods={
                    "enabled": True,
                },
                metadata={
                    "order_id": str(order.id),
                    "order_number": order.order_number,
                    "customer_id": str(order.customer.id),
                    **(metadata or {}),
                },
            )

            # Update order with Stripe data
            order.stripe_payment_intent_id = intent.id
            order.stripe_payment_intent_client_secret = intent.client_secret
            order.save()

            return {  # noqa: TRY300
                "client_secret": intent.client_secret,
                "payment_intent_id": intent.id,
            }

        except stripe.error.StripeError as e:
            msg = f"Stripe error: {e!s}"
            raise Exception(msg)  # noqa: B904, TRY002

    @staticmethod
    def confirm_payment(payment_intent_id: str) -> dict[str, Any]:
        """Confirm a payment intent"""
        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            return {
                "status": intent.status,
                "amount": intent.amount / 100,  # Convert back from cents
                "currency": intent.currency,
            }
        except stripe.error.StripeError as e:
            msg = f"Stripe error: {e!s}"
            raise Exception(msg)  # noqa: B904, TRY002

    @staticmethod
    def create_seller_transfer(
        seller_stripe_account_id: str,
        amount: Decimal,
        order_item_id: str,
    ):
        """Transfer money to seller (requires Stripe Connect)"""
        try:
            amount_cents = int(amount * 100)

            return stripe.Transfer.create(
                amount=amount_cents,
                currency="usd",
                destination=seller_stripe_account_id,
                metadata={"order_item_id": order_item_id, "type": "seller_payout"},
            )

        except stripe.error.StripeError as e:
            msg = f"Stripe transfer error: {e!s}"
            raise Exception(msg)  # noqa: B904, TRY002

    @staticmethod
    def handle_webhook(payload: str, sig_header: str) -> dict[str, Any]:
        """Handle Stripe webhook events"""
        try:
            return stripe.Webhook.construct_event(
                payload,
                sig_header,
                settings.STRIPE_WEBHOOK_SECRET,
            )
        except (ValueError, stripe.error.SignatureVerificationError) as e:
            msg = f"Webhook error: {e!s}"
            raise Exception(msg)  # noqa: B904, TRY002

    @staticmethod
    def refund_payment(
        payment_intent_id: str,
        amount: Decimal | None = None,
    ) -> dict[str, Any]:
        """Refund a payment"""
        try:
            refund_data = {
                "payment_intent": payment_intent_id,
            }

            if amount:
                refund_data["amount"] = int(amount * 100)  # Convert to cents

            refund = stripe.Refund.create(**refund_data)

            return {
                "refund_id": refund.id,
                "status": refund.status,
                "amount": refund.amount / 100,
            }

        except stripe.error.StripeError as e:
            msg = f"Stripe refund error: {e!s}"
            raise Exception(msg)  # noqa: B904, TRY002

    @staticmethod
    def calculate_seller_payout(order_item: OrderItem) -> Decimal:
        """Calculate seller payout amount after platform commission"""
        total_amount = order_item.total_price
        commission = total_amount * Decimal(str(settings.PLATFORM_COMMISSION_RATE))
        return total_amount - commission
