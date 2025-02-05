from django.contrib.auth.mixins import LoginRequiredMixin  # noqa: I001
from django.contrib.messages.views import SuccessMessageMixin
from django.db.models import QuerySet
from django.urls import reverse
from django.utils.translation import gettext_lazy as _
from django.views.generic import DetailView
from django.views.generic import RedirectView
from django.views.generic import UpdateView

from e_commerce.users.models import User, Customer, Seller


class UserDetailView(LoginRequiredMixin, DetailView):
    model = User
    slug_field = "username"
    slug_url_kwarg = "username"


user_detail_view = UserDetailView.as_view()


class UserUpdateView(LoginRequiredMixin, SuccessMessageMixin, UpdateView):
    model = User
    fields = ["name"]
    success_message = _("Information successfully updated")

    def get_success_url(self) -> str:
        assert self.request.user.is_authenticated  # type guard
        return self.request.user.get_absolute_url()

    def get_object(self, queryset: QuerySet | None = None) -> User:
        assert self.request.user.is_authenticated  # type guard
        return self.request.user


user_update_view = UserUpdateView.as_view()


class UserRedirectView(LoginRequiredMixin, RedirectView):
    permanent = False

    def get_redirect_url(self) -> str:
        return reverse("users:detail", kwargs={"username": self.request.user.username})


user_redirect_view = UserRedirectView.as_view()


class CustomerDetailView(LoginRequiredMixin, DetailView):
    model = Customer
    slug_field = "user__username"
    slug_url_kwarg = "username"

    def get_object(self, queryset=None):
        return Customer.objects.get(user=self.request.user)


customer_detail_view = CustomerDetailView.as_view()


class CustomerUpdateView(LoginRequiredMixin, SuccessMessageMixin, UpdateView):
    model = Customer
    fields = ["date_of_birth"]
    success_message = _("Information successfully updated")

    def get_success_url(self) -> str:
        assert self.request.user.is_authenticated  # type guard
        return reverse(
            "customers:detail",
            kwargs={"username": self.request.user.username},
        )

    def get_object(self, queryset=None):
        return Customer.objects.get(user=self.request.user)


customer_update_view = CustomerUpdateView.as_view()


class CustomerRedirectView(LoginRequiredMixin, RedirectView):
    permanent = False

    def get_redirect_url(self) -> str:
        return reverse(
            "customers:detail",
            kwargs={"username": self.request.user.username},
        )


customer_redirect_view = CustomerRedirectView.as_view()


class SellerDetailView(LoginRequiredMixin, DetailView):
    model = Seller
    slug_field = "user__username"
    slug_url_kwarg = "username"

    def get_object(self, queryset=None):
        return Seller.objects.get(user=self.request.user)


seller_detail_view = SellerDetailView.as_view()


class SellerUpdateView(LoginRequiredMixin, SuccessMessageMixin, UpdateView):
    model = Seller
    fields = ["shop_name", "shop_description"]
    success_message = _("Information successfully updated")

    def get_success_url(self) -> str:
        assert self.request.user.is_authenticated  # type guard
        return reverse(
            "sellers:detail",
            kwargs={"username": self.request.user.username},
        )

    def get_object(self, queryset=None):
        return Seller.objects.get(user=self.request.user)


seller_update_view = SellerUpdateView.as_view()


class SellerRedirectView(LoginRequiredMixin, RedirectView):
    permanent = False

    def get_redirect_url(self) -> str:
        return reverse(
            "sellers:detail",
            kwargs={"username": self.request.user.username},
        )


seller_redirect_view = SellerRedirectView.as_view()
