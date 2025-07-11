from rest_framework import serializers

from e_commerce.orders.models import Order
from e_commerce.orders.models import OrderItem
from e_commerce.orders.models import Payment
from e_commerce.users.api.serializers import AddressSerializer


class OrderItemSerializer(serializers.ModelSerializer):
    total_price = serializers.SerializerMethodField(read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    seller_name = serializers.CharField(source="seller.user.username", read_only=True)
    shipping_address = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product",
            "product_name",
            "seller",
            "seller_name",
            "quantity",
            "price_at_time",
            "total_price",
            "seller_status",
            "stripe_transfer_id",
            "seller_payout_amount",
            "created_at",
            "updated_at",
            "shipping_address",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "total_price",
            "product_name",
            "seller_name",
            "shipping_address",
        ]

    def get_total_price(self, obj):
        return obj.total_price

    def get_shipping_address(self, obj):
        order = getattr(obj, "order", None)
        if order and order.shipping_address:
            return AddressSerializer(order.shipping_address).data
        return None


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            "stripe_payment_intent_id",
            "amount",
            "currency",
            "status",
            "stripe_metadata",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "stripe_payment_intent_id",
            "created_at",
            "updated_at",
            "stripe_metadata",
        ]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    payment = PaymentSerializer(read_only=True)
    customer_name = serializers.CharField(source="customer.username", read_only=True)
    shipping_address = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "customer",
            "customer_name",
            "total_amount",
            "platform_commission",
            "status",
            "payment_status",
            "shipping_address",
            "shipping_cost",
            "created_at",
            "updated_at",
            "items",
            "payment",
        ]
        read_only_fields = [
            "id",
            "order_number",
            "created_at",
            "updated_at",
            "customer",
            "total_amount",
            "platform_commission",
            "customer_name",
            "items",
            "payment",
        ]


class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, write_only=True)

    class Meta:
        model = Order
        fields = ["shipping_address", "shipping_cost", "items"]

    def create(self, validated_data):
        items_data = validated_data.pop("items")
        order = Order.objects.create(**validated_data)

        total_amount = 0
        for item_data in items_data:
            item = OrderItem.objects.create(order=order, **item_data)
            total_amount += item.total_price

        order.total_amount = total_amount
        order.save()

        return order
