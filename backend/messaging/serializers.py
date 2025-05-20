
from rest_framework import serializers

class SignalSerializer(serializers.Serializer):
    symbol = serializers.CharField(max_length=10)
    direction = serializers.ChoiceField(choices=['buy', 'sell'])
    entry = serializers.DecimalField(max_digits=10, decimal_places=4)
    sl = serializers.DecimalField(max_digits=10, decimal_places=4)
    tp = serializers.DecimalField(max_digits=10, decimal_places=4)