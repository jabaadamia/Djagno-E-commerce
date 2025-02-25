from rest_framework import status  # noqa: I001
from django.shortcuts import get_object_or_404
from rest_framework.decorators import action

from rest_framework.viewsets import GenericViewSet
from rest_framework.response import Response
from rest_framework.permissions import BasePermission

from e_commerce.products.models import Product
from e_commerce.cart.models import Cart, CartItem
from .serializers import CartSerializer


class IsCustomer(BasePermission):
    def has_permission(self, request, view):
        return hasattr(request.user, "customer")


class CartViewSet(GenericViewSet):
    serializer_class = CartSerializer
    permission_classes = [IsCustomer]
    queryset = Cart.objects.all()

    def get_queryset(self):
        """Ensure users only see their own cart"""
        if not hasattr(self.request.user, "customer"):
            return Cart.objects.none()
        return Cart.objects.filter(customer=self.request.user.customer)

    def list(self, request, *args, **kwargs):
        """
        Retrieve the authenticated user's cart.
        """
        cart = get_object_or_404(Cart, customer=request.user.customer)
        serializer = self.get_serializer(cart)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], permission_classes=[IsCustomer])
    def add_to_cart(self, request):
        """
        Add a product to the cart.
        """
        customer = request.user.customer
        product_id = request.data.get("product_id")
        quantity = request.data.get("quantity", 1)

        product = get_object_or_404(Product, id=product_id)
        cart, _ = Cart.objects.get_or_create(customer=customer)

        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={"quantity": quantity},
        )

        if not created:
            cart_item.quantity += quantity
            cart_item.save()

        return Response({"detail": "Product added to cart"}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["patch"], permission_classes=[IsCustomer])
    def update_quantity(self, request):
        """
        Update the quantity of a cart item.
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

    @action(detail=False, methods=["delete"], permission_classes=[IsCustomer])
    def remove_item(self, request):
        """
        Remove a product from the cart.
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
