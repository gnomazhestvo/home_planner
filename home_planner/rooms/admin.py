from django.contrib import admin

from .models import Item, Room


class ItemsInline(admin.TabularInline):
    model = Item
    extra = 1


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    inlines = (ItemsInline,)
    list_display = (
        'title',
        'x_dimension',
        'y_dimension',
    )
    list_editable = (
        'x_dimension',
        'y_dimension',
    )


@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = (
        'kind',
        'title',
        'room',
        'x_coordinate',
        'y_coordinate',
        'x_dimension',
        'y_dimension',
        'wall',
    )
    list_editable = (
        'title',
        'x_coordinate',
        'y_coordinate',
        'x_dimension',
        'y_dimension',
        'wall',
    )
