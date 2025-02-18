from rest_framework import serializers  # noqa: I001

from e_commerce.products.models import Product, ProductImage, Category


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "product", "image"]
        extra_kwargs = {
            "image": {"required": True},
        }


class ProductSerializer(serializers.ModelSerializer):
    categories = serializers.SlugRelatedField(
        many=True,
        queryset=Category.objects.all(),
        slug_field="name",
    )

    seller = serializers.HyperlinkedRelatedField(
        view_name="api:seller-detail",
        lookup_field="username",
        read_only=True,
    )

    images = ProductImageSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "description",
            "price",
            "created_at",
            "seller",
            "categories",
            "images",
        ]

        extra_kwargs = {
            "url": {
                "view_name": "api:product-detail",
                "lookup_field": "id",
            },
        }


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]
