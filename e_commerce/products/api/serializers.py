from rest_framework import serializers  # noqa: I001

from e_commerce.products.models import Product, ProductImage, Category


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "product", "image"]
        extra_kwargs = {
            "image": {"required": True},
        }

    def create(self, validated_data):
        product = validated_data.get("product")
        return ProductImage.objects.create(product=product, **validated_data)


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

    def create(self, validated_data):
        images_data = validated_data.pop("images", [])

        # Create the product instance without images first
        product = Product.objects.create(**validated_data)

        # Create and associate images with the product
        for image_data in images_data:
            ProductImage.objects.create(product=product, **image_data)

        return product


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]
