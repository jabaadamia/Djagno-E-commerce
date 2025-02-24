from rest_framework import serializers  # noqa: I001

from e_commerce.cart.models import CartItem, Cart


class CartItemSerializer(serializers.ModelSerializer):
    product = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = CartItem
        fields = ["id", "product", "quantity"]


class CartSerializer(serializers.ModelSerializer):
    customer = serializers.SlugRelatedField(
        slug_field="user__username",
        read_only=True,
    )
    items = CartItemSerializer(many=True)

    class Meta:
        model = Cart
        fields = ["id", "customer", "created_at", "items"]
