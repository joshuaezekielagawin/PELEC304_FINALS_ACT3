from django.db import models
from django.utils.text import slugify


class Product(models.Model):
    """E-commerce product representing either a musical instrument or sheet music."""

    CATEGORY_INSTRUMENTS = 'instruments'
    CATEGORY_MUSIC_SHEETS = 'music_sheets'
    CATEGORY_CHOICES = [
        (CATEGORY_INSTRUMENTS, 'Popular Instruments'),
        (CATEGORY_MUSIC_SHEETS, 'Music Sheets'),
    ]

    SUBCATEGORY_CHOICES = [
        ('guitars', 'Guitars & Basses'),
        ('keyboards', 'Keyboards & Pianos'),
        ('drums', 'Drums & Percussion'),
        ('wind', 'Wind & Brass'),
        ('strings', 'Orchestral Strings'),
        ('accessories', 'Studio & Accessories'),
        ('piano_sheets', 'Piano Sheet Music'),
        ('guitar_tabs', 'Guitar Tabs & Chords'),
        ('vocal_scores', 'Vocal & Band Scores'),
    ]

    name = models.CharField(max_length=160)
    slug = models.SlugField(max_length=180, unique=True, blank=True)
    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default=CATEGORY_INSTRUMENTS,
    )
    subcategory = models.CharField(
        max_length=30,
        choices=SUBCATEGORY_CHOICES,
        default='guitars',
    )
    brand_or_composer = models.CharField(
        max_length=120,
        help_text='Instrument brand or sheet music composer/artist',
    )
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=10)
    skill_level = models.CharField(max_length=40, blank=True, default='All Levels')
    image_url = models.CharField(max_length=255, blank=True, default='')
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_featured', 'id']

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name) or 'product'
            slug = base_slug
            counter = 1
            while Product.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f'{base_slug}-{counter}'
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.name} ({self.get_category_display()})'
