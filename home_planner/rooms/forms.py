from django import forms
from django.core.exceptions import ValidationError

from .models import Layout, Room


class RoomForm(forms.ModelForm):
    class Meta:
        model = Room
        fields = (
            'title',
            'x_dimension',
            'y_dimension',
        )


class LayoutForm(forms.ModelForm):
    class Meta:
        model = Layout
        fields = (
            'title',
        )

    def __init__(self, *args, room, **kwargs):
        super().__init__(*args, **kwargs)
        self.room = room

    def clean_title(self):
        title = self.cleaned_data['title'].strip()
        is_data_exists = Layout.objects.filter(room=self.room, title=title)
        if is_data_exists.exists():
            raise ValidationError(
                'Название уже существует. Выберите другое.'
            )
        return title
