from rest_framework import status  # noqa: I001
from rest_framework.mixins import (
    ListModelMixin,
    CreateModelMixin,
    RetrieveModelMixin,
    UpdateModelMixin,
    DestroyModelMixin,
)
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet
from rest_framework.permissions import (
    BasePermission,
    AllowAny,
    IsAdminUser,
)
from rest_framework.exceptions import PermissionDenied

from e_commerce.products.models import Product, Category

from .serializers import ProductSerializer, CategorySerializer


class IsSeller(BasePermission):
    def has_permission(self, request, view):
        return hasattr(request.user, "seller")


class ProductViewSet(
    ListModelMixin,
    RetrieveModelMixin,
    CreateModelMixin,
    UpdateModelMixin,
    DestroyModelMixin,
    GenericViewSet,
):
    serializer_class = ProductSerializer
    queryset = Product.objects.all()
    lookup_field = "id"

    def get_permissions(self):
        """
        Return the permissions based on the request method.
        """
        if self.action in ("list", "retrieve"):
            return [AllowAny()]  # Allow any user to get products

        # For POST, PUT, DELETE, apply IsSeller
        return [IsSeller()]

    def create(self, request, *args, **kwargs):
        """Override create method to assign seller based on the authenticated user"""

        user = request.user

        if not hasattr(user, "seller"):
            return Response(
                {"detail": "You must be a seller to create a product."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ProductSerializer(
            data=request.data,
            context={"seller": user.seller, "request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers,
        )

    def update(self, request, *args, **kwargs):
        """Override update method to ensure seller can only update their own product"""
        product = self.get_object()

        # Check if the authenticated user is the seller of the product
        if product.seller != request.user.seller:
            raise PermissionDenied("You can only update your own products.")  # noqa: EM101, TRY003

        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Override destroy method to ensure seller can only delete their own product"""
        product = self.get_object()

        # Check if the authenticated user is the seller of the product
        if product.seller != request.user.seller:
            raise PermissionDenied("You can only delete your own products.")  # noqa: EM101, TRY003

        return super().destroy(request, *args, **kwargs)


class CategoryViewSet(
    ListModelMixin,
    RetrieveModelMixin,
    CreateModelMixin,
    DestroyModelMixin,
    UpdateModelMixin,
    GenericViewSet,
):
    permission_classes = [IsAdminUser]
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = "id"
