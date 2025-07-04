from rest_framework import status  # noqa: I001
from rest_framework.decorators import action
from rest_framework.mixins import ListModelMixin
from rest_framework.mixins import CreateModelMixin
from rest_framework.mixins import RetrieveModelMixin
from rest_framework.mixins import UpdateModelMixin
from rest_framework.mixins import DestroyModelMixin
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, NotFound

from e_commerce.users.models import User, Customer, Seller, Address

from .serializers import (
    UserSerializer,
    CustomerSerializer,
    SellerSerializer,
    AddressSerializer,
)


class UserViewSet(
    RetrieveModelMixin,
    ListModelMixin,
    UpdateModelMixin,
    CreateModelMixin,
    DestroyModelMixin,
    GenericViewSet,
):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer
    queryset = User.objects.all()
    lookup_field = "username"

    def get_queryset(self, *args, **kwargs):
        assert isinstance(self.request.user.id, int)
        return self.queryset.filter(id=self.request.user.id)

    @action(detail=False)
    def me(self, request):
        serializer = UserSerializer(request.user, context={"request": request})
        return Response(status=status.HTTP_200_OK, data=serializer.data)


class CustomerViewSet(
    RetrieveModelMixin,
    ListModelMixin,
    UpdateModelMixin,
    CreateModelMixin,
    DestroyModelMixin,
    GenericViewSet,
):
    serializer_class = CustomerSerializer
    queryset = Customer.objects.all()
    lookup_field = "user__username"

    def get_permissions(self):
        if self.action == "create":
            return []
        return [IsAuthenticated()]

    def get_queryset(self):
        # Only return the customer profile of the authenticated user
        assert isinstance(self.request.user.id, int)
        return self.queryset.filter(user=self.request.user)

    @action(detail=False, methods=["get"])
    def me(self, request):
        """
        Custom action to get the current user's customer profile.
        """
        try:
            customer = self.get_queryset().get(user=request.user)
        except Customer.DoesNotExist:
            return Response(
                {"detail": "Customer profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = CustomerSerializer(customer, context={"request": request})
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        customer = self.get_object()
        customer.user.delete()  # delete associated user
        customer.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SellerViewSet(
    RetrieveModelMixin,
    ListModelMixin,
    UpdateModelMixin,
    CreateModelMixin,
    DestroyModelMixin,
    GenericViewSet,
):
    serializer_class = SellerSerializer
    queryset = Seller.objects.all()
    lookup_field = "user__username"

    def get_permissions(self):
        if self.action == "create":
            return []
        return [IsAuthenticated()]

    def get_queryset(self):
        # Only return the seller profile of the authenticated user
        assert isinstance(self.request.user.id, int)
        return self.queryset.filter(user=self.request.user)

    @action(detail=False, methods=["get"])
    def me(self, request):
        """
        Custom action to get the current user's seller profile.
        """
        try:
            seller = self.get_queryset().get(user=request.user)
        except Customer.DoesNotExist:
            return Response(
                {"detail": "Customer profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = SellerSerializer(seller, context={"request": request})
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        seller = self.get_object()
        seller.user.delete()  # delete associated user
        seller.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AddressViewSet(
    RetrieveModelMixin,
    ListModelMixin,
    UpdateModelMixin,
    CreateModelMixin,
    DestroyModelMixin,
    GenericViewSet,
):
    permission_classes = [IsAuthenticated]
    serializer_class = AddressSerializer
    queryset = Address.objects.all()

    def get_queryset(self):
        assert isinstance(self.request.user.id, int)
        username = self.kwargs.get("nested_1_user__username")

        is_seller = Seller.objects.filter(user__username=username).exists()
        is_customer = Customer.objects.filter(user__username=username).exists()

        if "sellers" in self.request.path and not is_seller:
            raise NotFound(f"no such seller {username}")  # noqa: EM102, TRY003
        if "customers" in self.request.path and not is_customer:
            raise NotFound(f"no such customer {username}")  # noqa: EM102, TRY003

        if self.request.user.username != username:
            raise PermissionDenied("You are not allowed to access other's addresses.")  # noqa: EM101, TRY003
        return self.queryset.filter(user=self.request.user)
