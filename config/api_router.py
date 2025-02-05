from django.conf import settings  # noqa: I001
from rest_framework.routers import DefaultRouter
from rest_framework.routers import SimpleRouter

from e_commerce.users.api.views import UserViewSet, CustomerViewSet, SellerViewSet

router = DefaultRouter() if settings.DEBUG else SimpleRouter()

router.register("users", UserViewSet)
router.register("customers", CustomerViewSet)
router.register("seller", SellerViewSet)

app_name = "api"
urlpatterns = router.urls
