from django.urls import path

from . import views

app_name = 'rooms'

urlpatterns = [
    path('rooms/<int:room_id>/', views.layout_list, name='layout_list'),
    path('rooms/<int:room_id>/layouts/', views.layout_create, name='layout_create'),
    path('layouts/<int:layout_id>/', views.layout_editor, name='layout_editor'),
    path('layouts/<int:layout_id>/plan/', views.layout_plan, name='layout_plan'),
]
