from django.contrib import admin
from django.urls import include, path

from store.views import storefront_view

urlpatterns = [
    path('', storefront_view, name='storefront'),
    path('admin/', admin.site.urls),
    path('api/', include('store.urls')),
    path('api-auth/', include('rest_framework.urls')),
]
