from django.contrib import admin
from django.urls import include, path, re_path

from core.views import index

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/binance/', include('core.binance_urls')),
    path('api/app/', include('core.urls')),
    re_path(r'^(?!api/|admin/).*$', index, name='index'),
]
