from rest_framework import status  # noqa: I001
from rest_framework.decorators import action
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
import django_filters

from e_commerce.products.models import Product, Category

from .serializers import ProductSerializer, CategorySerializer


class IsSeller(BasePermission):
    def has_permission(self, request, view):
        return hasattr(request.user, "seller")


class CharInFilter(django_filters.BaseInFilter, django_filters.CharFilter):
    pass


class ProductFilter(django_filters.FilterSet):
    name = django_filters.CharFilter(field_name="name", lookup_expr="icontains")
    min_price = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr="lte")
    categories = CharInFilter(field_name="categories__name", lookup_expr="in")
    ordering = django_filters.OrderingFilter(
        fields=("price", "created_at"),
        field_labels={
            "price": "Price",
            "created_at": "Date Created",
        },
    )


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
    filter_backends = [django_filters.rest_framework.DjangoFilterBackend]
    filterset_class = ProductFilter

    def get_permissions(self):
        """
        Return the permissions based on the request method.
        """
        if self.action in ("list", "retrieve"):
            return [AllowAny()]  # Allow any user to get products

        # For POST, PUT, DELETE, apply IsSeller
        return [IsSeller()]

    # override the list method to apply distinct filtering
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset()).distinct()

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], permission_classes=[IsSeller])
    def my_products(self, request):
        """
        Custom action to get the current sellers's products.
        """

        products = Product.objects.filter(seller=request.user.seller)

        # Apply filtering
        filtered_products = self.filter_queryset(products).distinct()

        # Apply pagination
        page = self.paginate_queryset(filtered_products)
        if page is not None:
            serializer = ProductSerializer(
                page,
                many=True,
                context={"request": request},
            )
            return self.get_paginated_response(serializer.data)

        serializer = ProductSerializer(
            products,
            many=True,
            context={"request": request},
        )
        return Response(serializer.data)

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
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = "id"

    def get_permissions(self):
        if self.request.method in ["GET", "HEAD", "OPTIONS"]:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAdminUser]
        return [permission() for permission in permission_classes]
