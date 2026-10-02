from django.contrib import admin

from .models import Item, Layout, Room


class ItemsInline(admin.TabularInline):
    model = Item
    extra = 1


class LayoutInlines(admin.TabularInline):
    model = Layout
    extra = 1


@admin.register(Layout)
class LayoutAdmin(admin.ModelAdmin):
    inlines = (ItemsInline,)
    list_display = (
        'room',
        'title',
        'created_at',
    )


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    inlines = (LayoutInlines,)
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
        'layout',
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
