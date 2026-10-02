from django.urls import path

from . import views

app_name = 'rooms'

urlpatterns = [
    path('<int:room_id>/plan/', views.room_plan, name='room_plan'),
    path('<int:room_id>/', views.room_editor, name='room_editor'),
]
