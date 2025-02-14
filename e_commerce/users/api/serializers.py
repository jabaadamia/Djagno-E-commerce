from rest_framework import serializers  # noqa: I001

from e_commerce.users.models import User, Customer, Seller, Address


class UserSerializer(serializers.ModelSerializer[User]):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "password",
            "phone_number",
            "url",
            "profile_picture",
        ]

        extra_kwargs = {
            "url": {"view_name": "api:user-detail", "lookup_field": "username"},
            "password": {"write_only": True, "style": {"input_type": "password"}},
        }

    def validate(self, attrs):
        """
        Override the validate method to ensure that None values
        are replaced with the default profile_picture value.
        """

        if attrs.get("profile_picture") is None:
            attrs["profile_picture"] = "profile_pictures/default.jpg"

        return attrs


class CustomerSerializer(serializers.ModelSerializer[Customer]):
    user = UserSerializer()

    class Meta:
        model = Customer
        fields = ["user", "date_of_birth"]

        extra_kwargs = {
            "url": {"view_name": "api:customer-detail", "lookup_field": "username"},
        }

    def create(self, validated_data):
        user_data = validated_data.pop("user")
        user = User.objects.create_user(**user_data)  # Ensure user is created properly
        return Customer.objects.create(user=user, **validated_data)


class SellerSerializer(serializers.ModelSerializer[Seller]):
    user = UserSerializer()

    class Meta:
        model = Seller
        fields = ["user", "shop_name", "shop_description"]

        extra_kwargs = {
            "url": {"view_name": "api:seller-detail", "lookup_field": "username"},
        }

    def create(self, validated_data):
        user_data = validated_data.pop("user")
        user = User.objects.create_user(**user_data)  # Ensure user is created properly
        return Seller.objects.create(user=user, **validated_data)


class AddressSerializer(serializers.ModelSerializer[Address]):
    class Meta:
        model = Address
        fields = ["id", "street", "city", "state", "country", "postal_code"]

        extra_kwargs = {
            "url": {"view_name": "api:address-detail", "lookup_field": "id"},
        }

    def create(self, validated_data):
        request = self.context["request"]
        validated_data["user"] = request.user  # Assign logged-in user
        return super().create(validated_data)
