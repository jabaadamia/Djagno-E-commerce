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
        required=False,
    )

    seller = serializers.SerializerMethodField()

    def get_seller(self, obj):
        return obj.seller.user.username

    images = ProductImageSerializer(many=True, required=False)

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
        seller = self.context.get("seller")
        images_data = self.context["request"].data.getlist("images", [])
        categories = validated_data.pop("categories", [])

        if len(images_data) < 1:
            raise serializers.ValidationError("At least one image is required.")  # noqa: EM101, TRY003
        if len(images_data) > 6:  # noqa: PLR2004
            raise serializers.ValidationError("A maximum of 6 images is allowed.")  # noqa: EM101, TRY003

        # Create the product instance without images first
        product = Product.objects.create(seller=seller, **validated_data)

        product.categories.set(categories)

        # Create and associate images with the product
        for image_data in images_data:
            ProductImage.objects.create(product=product, image=image_data)

        return product


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]
