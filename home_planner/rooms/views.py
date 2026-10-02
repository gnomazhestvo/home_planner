import json

from django.core.exceptions import ValidationError
from django.db import transaction
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, render
from django.views.decorators.http import require_http_methods

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


def layout_list(request, room_id):
    room = get_object_or_404(Room, pk=room_id)
    layouts = room.layouts.prefetch_related('items')
    template_name = 'rooms/layout_list.html'
    context = {
        'room': room,
        'layouts': layouts,
    }
    return render(request, template_name, context)
