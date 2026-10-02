from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models


class Room(models.Model):
    """Комната."""
    title = models.CharField(
        max_length=256,
        verbose_name='Название комнаты',
    )
    x_dimension = models.PositiveSmallIntegerField(
        validators=[
            MinValueValidator(1)
        ],
        verbose_name='Размер по x, см',
    )
    y_dimension = models.PositiveSmallIntegerField(
        validators=[
            MinValueValidator(1)
        ],
        verbose_name='Размер по y, см',
    )

    class Meta:
        verbose_name = 'Комната'
        verbose_name_plural = 'Комнаты'

    def __str__(self):
        return self.title


class Item(models.Model):
    """Предмет мебели."""

    class Kind(models.TextChoices):
        BED = 'bed', 'Кровать'
        TV = 'tv', 'Телевизор'
        DESK = 'desk', 'Стол'
        CHAIR = 'chair', 'Стул'
        SHELF = 'shelf', 'Стеллаж'
        STAND = 'stand', 'Тумба'
        OTHER = 'other', 'Другое'

    room = models.ForeignKey(
        Room,
        verbose_name='Комната',
        related_name='items',
        on_delete=models.CASCADE
    )
    kind = models.CharField(
        max_length=20,
        choices=Kind.choices,
        default=Kind.OTHER,
        verbose_name='Тип мебели',
    )
    title = models.CharField(
        max_length=256,
        verbose_name='Название предмета мебели',
    )
    x_coordinate = models.PositiveSmallIntegerField(
        verbose_name='Координата x, см',
    )
    y_coordinate = models.PositiveSmallIntegerField(
        verbose_name='Координата y, см',
    )
    x_dimension = models.PositiveSmallIntegerField(
        validators=[
            MinValueValidator(1)
        ],
        verbose_name='Размер по x, см',
    )
    y_dimension = models.PositiveSmallIntegerField(
        validators=[
            MinValueValidator(1)
        ],
        verbose_name='Размер по y, см',
    )
    wall = models.BooleanField(
        default=False,
        verbose_name='На стене?'
    )

    class Meta:
        verbose_name = 'Мебель'
        verbose_name_plural = 'Мебель'

    def __str__(self):
        return self.title

    def clean(self):
        super().clean()
        if not self.room_id:
            return
        if None in (
            self.x_dimension,
            self.x_coordinate,
            self.y_dimension,
            self.y_coordinate
        ):
            return

        errors = {}
        if self.x_coordinate + self.x_dimension > self.room.x_dimension:
            errors['x_coordinate'] = 'Предмет выходит за правую стену комнаты'
        if self.y_coordinate + self.y_dimension > self.room.y_dimension:
            errors['y_coordinate'] = 'Предмет выходит за нижнюю стену комнаты'
        if errors:
            raise ValidationError(errors)
