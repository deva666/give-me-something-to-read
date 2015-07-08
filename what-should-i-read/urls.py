from django.conf.urls import patterns, include, url
from nyt_bestsellers import views
# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',
	url(r'^$', views.main, name='main'),
	url(r'^list_categories/', views.list_categories, name='list_categories'),
    url(r'^get_books/', views.get_books, name='get_books'),
    url(r'^blocked/', views.blocked, name='blocked'),
    # Examples:
    # url(r'^$', 'eventlocator.views.home', name='home'),
    # url(r'^eventlocator/', include('eventlocator.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),
)
