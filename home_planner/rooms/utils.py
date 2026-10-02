def serialize_plan(room):
    """Создает словарь JSON для GET/POST."""
    items = []
    for item in room.items.all():
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
            'title': room.title,
            'w': room.x_dimension,
            'h': room.y_dimension,
        },
        'items': items
    }
    return result
