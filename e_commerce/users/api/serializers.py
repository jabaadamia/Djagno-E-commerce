from rest_framework import serializers  # noqa: I001

from e_commerce.users.models import User, Customer, Seller, Address


class UserSerializer(serializers.ModelSerializer[User]):
    class Meta:
        model = User
        fields = ["id", "username", "name", "phone_number", "url", "profile_picture"]

        extra_kwargs = {
            "url": {"view_name": "api:user-detail", "lookup_field": "username"},
        }


class CustomerSerializer(serializers.ModelSerializer[Customer]):
    user = UserSerializer()

    class Meta:
        model = Customer
        fields = ["user", "date_of_birth"]

        extra_kwargs = {
            "url": {"view_name": "api:customer-detail", "lookup_field": "username"},
        }


class SellerSerializer(serializers.ModelSerializer[Seller]):
    user = UserSerializer()

    class Meta:
        model = Seller
        fields = ["user", "shop_name", "shop_description"]

        extra_kwargs = {
            "url": {"view_name": "api:seller-detail", "lookup_field": "username"},
        }


class AddressSerializer(serializers.ModelSerializer[Address]):
    class Meta:
        model = Address
        fields = ["id", "user", "street", "city", "state", "country", "postal_code"]

        extra_kwargs = {
            "url": {"view_name": "api:address-detail", "lookup_field": "id"},
        }
