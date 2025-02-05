from django.contrib.auth.models import AbstractUser  # noqa: I001
from django.db.models import (
    Model,
    CharField,
    TextField,
    DateField,
    ImageField,
    OneToOneField,
    ForeignKey,
    CASCADE,
)
from django.urls import reverse
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    """
    Default custom user model for Django E-commerce.
    If adding fields that need to be filled at user signup,
    check forms.SignupForm and forms.SocialSignupForms accordingly.
    """

    # First and last name do not cover name patterns around the globe
    name = CharField(_("Name of User"), blank=True, max_length=255)
    first_name = None  # type: ignore[assignment]
    last_name = None  # type: ignore[assignment]
    phone_number = CharField(_("Phone Number"), blank=True, max_length=20)

    # Profile picture for the user
    profile_picture = ImageField(
        _("Profile Picture"),
        upload_to="profile_pictures/",
        null=True,
        blank=True,
        default="profile_pictures/default.jpg",
    )

    def get_absolute_url(self) -> str:
        """Get URL for user's detail view.

        Returns:
            str: URL for user detail.
        """

        return reverse("users:detail", kwargs={"username": self.username})


class Customer(Model):
    """
    Customer profile model linked to the User model.
    """

    user = OneToOneField(User, on_delete=CASCADE, related_name="customer")
    date_of_birth = DateField(_("Date of Birth"), null=True, blank=True)

    def __str__(self):
        return f"Customer: {self.user.username}"


class Seller(Model):
    """
    Seller profile model linked to the User model.
    """

    user = OneToOneField(User, on_delete=CASCADE, related_name="seller")
    shop_name = CharField(_("Shop Name"), max_length=255, blank=True)
    shop_description = TextField(_("Shop Description"), blank=True)

    def __str__(self):
        return f"Seller: {self.user.username}"


class Address(Model):
    """
    Address model for users, customers, and sellers.
    """

    user = ForeignKey(
        User,
        on_delete=CASCADE,
        related_name="addresses",
    )  # Allow multiple addresses per user
    street = CharField(_("Street Address"), max_length=255)
    city = CharField(_("City"), max_length=100)
    state = CharField(_("State/Region"), max_length=100, blank=True)
    country = CharField(_("Country"), max_length=100)
    postal_code = CharField(_("Postal Code"), max_length=20)

    def __str__(self):
        return f"{self.country}, {self.city}, {self.street}"
