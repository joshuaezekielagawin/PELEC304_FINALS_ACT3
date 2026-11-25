from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from .models import Product

User = get_user_model()


class StoreApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_superuser(
            username='admin_test',
            email='admin@example.com',
            password='StrongPassword123!',
        )
        self.regular_user = User.objects.create_user(
            username='customer_test',
            password='CustomerPassword123!',
        )
        call_command('seed_products')

    def test_seeded_product_count_at_least_20(self):
        response = self.client.get('/api/products/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 20)

    def test_filter_by_category_and_search(self):
        instruments_res = self.client.get('/api/products/?category=instruments')
        sheets_res = self.client.get('/api/products/?category=music_sheets')
        search_res = self.client.get('/api/products/?search=Yamaha')

        self.assertEqual(instruments_res.status_code, status.HTTP_200_OK)
        self.assertEqual(sheets_res.status_code, status.HTTP_200_OK)
        self.assertEqual(search_res.status_code, status.HTTP_200_OK)

        self.assertTrue(all(p['category'] == 'instruments' for p in instruments_res.data))
        self.assertTrue(all(p['category'] == 'music_sheets' for p in sheets_res.data))
        self.assertGreaterEqual(len(search_res.data), 1)

    def test_anonymous_and_non_staff_cannot_write(self):
        payload = {
            'name': 'Unauthorized Guitar',
            'category': 'instruments',
            'subcategory': 'guitars',
            'brand_or_composer': 'Test',
            'description': 'Should be blocked.',
            'price': '5000.00',
            'stock': 5,
        }
        first_id = Product.objects.first().id

        # Anonymous user blocked from POST, PATCH, DELETE
        self.assertEqual(self.client.post('/api/products/', payload, format='json').status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.patch(f'/api/products/{first_id}/', {'stock': 1}, format='json').status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.delete(f'/api/products/{first_id}/').status_code, status.HTTP_403_FORBIDDEN)

        # Non-staff user also blocked from writing
        self.client.force_authenticate(user=self.regular_user)
        self.assertEqual(self.client.post('/api/products/', payload, format='json').status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_full_crud_lifecycle(self):
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            'name': 'Casio CT-S300 Portable Keyboard',
            'category': 'instruments',
            'subcategory': 'keyboards',
            'brand_or_composer': 'Casio',
            'description': '61-key touch-responsive portable keyboard for students.',
            'price': '9500.00',
            'stock': 11,
            'skill_level': 'Beginner',
        }
        create_res = self.client.post('/api/products/', payload, format='json')
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        product_id = create_res.data['id']

        patch_res = self.client.patch(f'/api/products/{product_id}/', {'stock': 5}, format='json')
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_res.data['stock'], 5)

        delete_res = self.client.delete(f'/api/products/{product_id}/')
        self.assertEqual(delete_res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Product.objects.filter(id=product_id).exists())

    def test_storefront_renders_branding_and_hides_add_button_for_anon(self):
        anon_res = self.client.get('/')
        self.assertEqual(anon_res.status_code, status.HTTP_200_OK)
        self.assertContains(anon_res, 'shiked6 music store')
        self.assertContains(anon_res, '/static/images/logo.png')
        self.assertNotContains(anon_res, 'open-add-modal-btn')

        self.client.force_login(self.admin_user)
        admin_res = self.client.get('/')
        self.assertContains(admin_res, 'open-add-modal-btn')
