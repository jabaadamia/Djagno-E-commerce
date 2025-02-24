from rest_framework import status  # noqa: I001
from django.shortcuts import get_object_or_404
from rest_framework.decorators import action

from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework.permissions import BasePermission

from e_commerce.products.models import Product
from e_commerce.cart.models import Cart, CartItem
from .serializers import CartSerializer


class IsCustomer(BasePermission):
    def has_permission(self, request, view):
        return hasattr(request.user, "customer")


class CartViewSet(ModelViewSet):
    model = Cart
    serializer_class = CartSerializer
    queryset = Cart.objects.all()
    lookup_field = "id"
    permission_classes = [IsCustomer]

    def create(self, request, *args, **kwargs):
        customer = request.user.customer
        product_id = request.data.get("product_id")
        quantity = request.data.get("quantity", 1)

        product = get_object_or_404(Product, id=product_id)

        # Get or create a cart for the user
        cart, _ = Cart.objects.get_or_create(customer=customer)

        # Add the product to the cart
        cart_item, item_created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={"quantity": quantity},
        )

        if not item_created:
            cart_item.quantity += quantity
            cart_item.save()

        return Response({"detail": "Product added to cart"}, status=status.HTTP_200_OK)

    def get_queryset(self):
        if not hasattr(self.request.user, "customer"):
            return Cart.objects.none()
        return Cart.objects.filter(customer=self.request.user.customer)

    def retrieve(self, request, *args, **kwargs):
        if not hasattr(request.user, "customer"):
            return Response(
                {"detail": "Only customers can have carts."},
                status=status.HTTP_403_FORBIDDEN,
            )

        customer = request.user.customer
        cart, created = Cart.objects.get_or_create(user=customer)

        serializer = self.get_serializer(cart)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["patch"], permission_classes=[IsCustomer])
    def update_quantity(self, request, id=None):  # noqa: A002
        """
        Update quantity of a cart item
        """
        cart = get_object_or_404(Cart, customer=request.user.customer)
        product_id = request.data.get("product_id")
        quantity = request.data.get("quantity")

        if not product_id or not quantity:
            return Response(
                {"detail": "Product ID and quantity are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            cart_item = CartItem.objects.get(cart=cart, product_id=product_id)
        except CartItem.DoesNotExist:
            return Response(
                {"detail": "Item not found in cart."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if int(quantity) <= 0:
            cart_item.delete()
            return Response(
                {"detail": "Item removed from cart."},
                status=status.HTTP_200_OK,
            )

        cart_item.quantity = int(quantity)
        cart_item.save()
        return Response({"detail": "Quantity updated."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["delete"], permission_classes=[IsCustomer])
    def remove_item(self, request, id=None):  # noqa: A002
        """
        Remove a product from the cart
        """
        cart = get_object_or_404(Cart, customer=request.user.customer)
        product_id = request.data.get("product_id")

        if not product_id:
            return Response(
                {"detail": "Product ID is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            cart_item = CartItem.objects.get(cart=cart, product_id=product_id)
        except CartItem.DoesNotExist:
            return Response(
                {"detail": "Item not found in cart."},
                status=status.HTTP_404_NOT_FOUND,
            )

        cart_item.delete()
        return Response(
            {"detail": "Item removed from cart."},
            status=status.HTTP_200_OK,
        )
