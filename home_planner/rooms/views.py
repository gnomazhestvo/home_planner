import json

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Count
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_http_methods

from .forms import RoomForm, LayoutForm
from .models import Item, Layout, Room
from .utils import build_items, serialize_plan


@require_http_methods(['GET', 'POST'])
def layout_plan(request, layout_id):
    layout = get_object_or_404(
        Layout.objects.select_related('room'),
        pk=layout_id
    )

    if request.method == 'POST':
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Неверный JSON'}, status=400)
        if not isinstance(data, dict) or 'items' not in data:
            return JsonResponse(
                {'error': 'Ожидается объект с ключом items'},
                status=400,
            )
        if not isinstance(data['items'], list):
            return JsonResponse(
                {'error': 'items должен быть списком'},
                status=400,
            )

        # Превращение присланных данных в объекты и проверка их
        # с помощью full_clean()
        new_items, errors = build_items(layout, data['items'])
        if errors:
            return JsonResponse(
                {'errors': errors},
                status=400,
            )

        # Сохранение
        with transaction.atomic():
            layout.items.all().delete()
            Item.objects.bulk_create(new_items)

    result = serialize_plan(layout)
    return JsonResponse(result)


@require_http_methods(['POST'])
def layout_create(request, room_id):
    room = get_object_or_404(Room, pk=room_id)
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Неверный JSON'}, status=400)
    if not isinstance(data, dict) or 'title' not in data:
        return JsonResponse(
            {'error': 'Ожидается объект с ключом title'},
            status=400
        )
    if not isinstance(data['title'], str):
        return JsonResponse(
            {'error': 'title должен быть строкой'},
            status=400
        )
    if 'items' not in data:
        return JsonResponse(
            {'error': 'Ожидается объект с ключом items'},
            status=400,
        )
    if not isinstance(data['items'], list):
        return JsonResponse(
            {'error': 'items должен быть списком'},
            status=400,
        )

    with transaction.atomic():
        layout = Layout(room=room, title=data['title'].strip())
        try:
            layout.full_clean()
        except ValidationError as e:
            return JsonResponse(
                {'error': ' '.join(e.messages)},
                status=400,
            )
        layout.save()

        new_items, errors = build_items(layout, data['items'])
        if errors:
            transaction.set_rollback(True)
            return JsonResponse({'errors': errors}, status=400)
        Item.objects.bulk_create(new_items)
    result = serialize_plan(layout)
    return JsonResponse(result, status=201)


def layout_editor(request, layout_id):
    template_name = 'rooms/layout_editor.html'
    layout = get_object_or_404(
        Layout.objects.select_related('room'),
        pk=layout_id
    )
    context = {
        'layout': layout,
    }
    return render(request, template_name, context)


def layout_new(request, room_id):
    template_name = 'rooms/layout_form.html'
    room = get_object_or_404(Room, pk=room_id)
    form = LayoutForm(request.POST or None, room=room)
    if form.is_valid():
        layout = form.save(commit=False)
        layout.room = room
        layout.save()
        return redirect('rooms:layout_editor', layout_id=layout.id)
    context = {'form': form, 'room': room}
    return render(request, template_name, context)


def layout_list(request, room_id):
    room = get_object_or_404(Room, pk=room_id)
    layouts = room.layouts.prefetch_related('items')
    template_name = 'rooms/layout_list.html'
    context = {
        'room': room,
        'layouts': layouts,
    }
    return render(request, template_name, context)


def room_list(request):
    template_name = 'rooms/room_list.html'
    rooms = Room.objects.annotate(layouts_count=Count('layouts'))
    context = {
        'rooms': rooms,
    }
    return render(request, template_name, context)


def room_create(request):
    template_name = 'rooms/room_form.html'
    form = RoomForm(request.POST or None)
    if form.is_valid():
        room = form.save()
        return redirect('rooms:layout_list', room_id=room.id)
    context = {'form': form}
    return render(request, template_name, context)
