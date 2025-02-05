from allauth.account.decorators import secure_admin_login  # noqa: I001
from django.conf import settings
from django.contrib import admin
from django.contrib.auth import admin as auth_admin
from django.utils.translation import gettext_lazy as _

from .forms import UserAdminChangeForm
from .forms import UserAdminCreationForm
from .models import User, Customer, Seller, Address

if settings.DJANGO_ADMIN_FORCE_ALLAUTH:
    # Force the `admin` sign in process to go through the `django-allauth` workflow:
    # https://docs.allauth.org/en/latest/common/admin.html#admin
    admin.autodiscover()
    admin.site.login = secure_admin_login(admin.site.login)  # type: ignore[method-assign]


@admin.register(User)
class UserAdmin(auth_admin.UserAdmin):
    form = UserAdminChangeForm
    add_form = UserAdminCreationForm
    fieldsets = (
        (None, {"fields": ("username", "password")}),
        (_("Personal info"), {"fields": ("name", "email")}),
        (
            _("Permissions"),
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                ),
            },
        ),
        (_("Important dates"), {"fields": ("last_login", "date_joined")}),
    )
    list_display = ["username", "name", "is_superuser"]
    search_fields = ["name"]


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    """Admin panel for customers."""

    list_display = ["id", "user", "date_of_birth"]
    search_fields = ["user__username", "user__email"]
    ordering = ["id"]


@admin.register(Seller)
class SellerAdmin(admin.ModelAdmin):
    """Admin panel for sellers."""

    list_display = ["id", "user", "shop_name", "shop_description"]
    search_fields = ["user__username", "shop_name"]
    ordering = ["id"]


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    """Admin panel for addresses."""

    list_display = ["id", "user", "street", "city", "country"]
    search_fields = ["user__username", "street", "city", "country"]
    ordering = ["id"]
