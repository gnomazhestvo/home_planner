import json

from django.core.exceptions import ValidationError
from django.db import transaction
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.shortcuts import get_object_or_404, render

from .models import Item, Room
from .utils import serialize_plan


@require_http_methods(['GET', 'POST'])
def room_plan(request, room_id):
    room = get_object_or_404(Room, pk=room_id)

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
        new_items = []
        errors = []
        for index, item_data in enumerate(data['items']):
            try:
                item = Item(
                    room=room,
                    kind=item_data['kind'],
                    title=item_data['name'],
                    x_coordinate=item_data['x'],
                    y_coordinate=item_data['y'],
                    x_dimension=item_data['w'],
                    y_dimension=item_data['h'],
                    wall=item_data['wall'],
                )
            except (KeyError, TypeError):
                errors.append({
                    'index': index,
                    'messages': {'__all__': ['Не хватает полей']}
                })
                continue
            try:
                item.full_clean()
            except ValidationError as e:
                errors.append({
                    'index': index,
                    'messages': e.message_dict,
                })
                continue
            new_items.append(item)
        if errors:
            return JsonResponse(
                {'errors': errors},
                status=400,
            )
        with transaction.atomic():
            room.items.all().delete()
            Item.objects.bulk_create(new_items)

    result = serialize_plan(room)
    return JsonResponse(result)


def room_editor(request, room_id):
    template_name = 'rooms/room_editor.html'
    room = get_object_or_404(Room, pk=room_id)
    context = {'room': room}
    return render(request, template_name, context)
