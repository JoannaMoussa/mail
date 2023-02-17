from django.contrib import admin
from .models import User, Email

class UserAdmin(admin.ModelAdmin):
    list_display = ("username", "email")

class EmailAdmin(admin.ModelAdmin):
    list_display = ("user", "sender", "get_recipients", "subject", "timestamp", "read", "archived")

    def get_recipients(self, obj):
        return "\n".join([r.email for r in obj.recipients.all()])

# Register your models here.
admin.site.register(User, UserAdmin)
admin.site.register(Email, EmailAdmin)