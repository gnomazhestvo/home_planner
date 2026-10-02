from django.core.exceptions import ValidationError

from .models import Item


def serialize_plan(layout):
    """Создает словарь JSON для GET/POST."""
    items = []
    for item in layout.items.all():
        items.append(
            {
                'id': item.id,
                'kind': item.kind,
                'name': item.title,
                'x': item.x_coordinate,
                'y': item.y_coordinate,
                'w': item.x_dimension,
                'h': item.y_dimension,
                'wall': item.wall,
            }
        )
    result = {
        'room': {
            'title': layout.room.title,
            'w': layout.room.x_dimension,
            'h': layout.room.y_dimension,
        },
        'layout': {
            'id': layout.id,
            'title': layout.title,
            'created_at': layout.created_at,
        },
        'items': items
    }
    return result


def build_items(layout, items_data):
    new_items = []
    errors = []
    for index, item_data in enumerate(items_data):
        try:
            item = Item(
                layout=layout,
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
    return new_items, errors
