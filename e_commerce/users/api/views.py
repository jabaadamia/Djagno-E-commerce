from rest_framework import status  # noqa: I001
from rest_framework.decorators import action
from rest_framework.mixins import ListModelMixin
from rest_framework.mixins import RetrieveModelMixin
from rest_framework.mixins import UpdateModelMixin
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from e_commerce.users.models import User, Customer, Seller

from .serializers import UserSerializer, CustomerSerializer, SellerSerializer


class UserViewSet(RetrieveModelMixin, ListModelMixin, UpdateModelMixin, GenericViewSet):
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
    GenericViewSet,
):
    serializer_class = CustomerSerializer
    queryset = Customer.objects.all()

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


class SellerViewSet(
    RetrieveModelMixin,
    ListModelMixin,
    UpdateModelMixin,
    GenericViewSet,
):
    serializer_class = SellerSerializer
    queryset = Seller.objects.all()

    def get_queryset(self):
        # Only return the customer profile of the authenticated user
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
