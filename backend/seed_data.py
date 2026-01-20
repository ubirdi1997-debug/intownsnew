import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
import uuid

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def seed_data():
    print("Seeding data...")
    
    # Clear existing data
    await db.categories.delete_many({})
    await db.products.delete_many({})
    await db.professionals.delete_many({})
    
    # Create categories
    categories = [
        {
            'id': str(uuid.uuid4()),
            'name': 'Massage',
            'image': 'https://images.unsplash.com/photo-1649751295468-953038600bef?crop=entropy&cs=srgb&fm=jpg&q=85',
            'description': 'Relaxing massage therapies'
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'Spa',
            'image': 'https://images.unsplash.com/photo-1596178060671-7a80dc8059ea?crop=entropy&cs=srgb&fm=jpg&q=85',
            'description': 'Luxury spa treatments'
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'Packages',
            'image': 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?crop=entropy&cs=srgb&fm=jpg&q=85',
            'description': 'Special combo packages'
        }
    ]
    
    await db.categories.insert_many(categories)
    print(f"Created {len(categories)} categories")
    
    massage_cat = categories[0]['id']
    spa_cat = categories[1]['id']
    package_cat = categories[2]['id']
    
    # Create products
    products = [
        # Head Massage
        {'id': str(uuid.uuid4()), 'name': 'Head Massage (30 min)', 'price': 49900, 'duration': '30 min', 'category_id': massage_cat, 'type': 'product', 'image': 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Head Massage (45 min)', 'price': 69900, 'duration': '45 min', 'category_id': massage_cat, 'type': 'product', 'image': 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Head Massage (60 min)', 'price': 89900, 'duration': '60 min', 'category_id': massage_cat, 'type': 'product', 'image': 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400'},
        
        # Back Massage
        {'id': str(uuid.uuid4()), 'name': 'Back Massage (30 min)', 'price': 59900, 'duration': '30 min', 'category_id': massage_cat, 'type': 'product', 'image': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Back Massage (45 min)', 'price': 79900, 'duration': '45 min', 'category_id': massage_cat, 'type': 'product', 'image': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Back Massage (60 min)', 'price': 99900, 'duration': '60 min', 'category_id': massage_cat, 'type': 'product', 'image': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400'},
        
        # Foot Reflexology
        {'id': str(uuid.uuid4()), 'name': 'Foot Reflexology (30 min)', 'price': 44900, 'duration': '30 min', 'category_id': massage_cat, 'type': 'product', 'image': 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Foot Reflexology (45 min)', 'price': 64900, 'duration': '45 min', 'category_id': massage_cat, 'type': 'product', 'image': 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Foot Reflexology (60 min)', 'price': 84900, 'duration': '60 min', 'category_id': massage_cat, 'type': 'product', 'image': 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400'},
        
        # Swedish Massage
        {'id': str(uuid.uuid4()), 'name': 'Swedish Massage (60 min)', 'price': 129900, 'duration': '60 min', 'category_id': spa_cat, 'type': 'product', 'image': 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Swedish Massage (90 min)', 'price': 179900, 'duration': '90 min', 'category_id': spa_cat, 'type': 'product', 'image': 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=400'},
        
        # Deep Tissue Massage
        {'id': str(uuid.uuid4()), 'name': 'Deep Tissue Massage (60 min)', 'price': 149900, 'duration': '60 min', 'category_id': spa_cat, 'type': 'product', 'image': 'https://images.unsplash.com/photo-1596178060671-7a80dc8059ea?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Deep Tissue Massage (90 min)', 'price': 199900, 'duration': '90 min', 'category_id': spa_cat, 'type': 'product', 'image': 'https://images.unsplash.com/photo-1596178060671-7a80dc8059ea?w=400'},
        
        # Aromatherapy Massage
        {'id': str(uuid.uuid4()), 'name': 'Aromatherapy Massage (60 min)', 'price': 159900, 'duration': '60 min', 'category_id': spa_cat, 'type': 'product', 'image': 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Aromatherapy Massage (90 min)', 'price': 219900, 'duration': '90 min', 'category_id': spa_cat, 'type': 'product', 'image': 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400'},
        
        # Balinese Massage
        {'id': str(uuid.uuid4()), 'name': 'Balinese Massage (60 min)', 'price': 169900, 'duration': '60 min', 'category_id': spa_cat, 'type': 'product', 'image': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Balinese Massage (90 min)', 'price': 229900, 'duration': '90 min', 'category_id': spa_cat, 'type': 'product', 'image': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400'},
        
        # Thai Massage
        {'id': str(uuid.uuid4()), 'name': 'Thai Massage (60 min)', 'price': 139900, 'duration': '60 min', 'category_id': massage_cat, 'type': 'product', 'image': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Thai Massage (90 min)', 'price': 189900, 'duration': '90 min', 'category_id': massage_cat, 'type': 'product', 'image': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400'},
        
        # Hot Stone Massage
        {'id': str(uuid.uuid4()), 'name': 'Hot Stone Massage (60 min)', 'price': 179900, 'duration': '60 min', 'category_id': spa_cat, 'type': 'product', 'image': 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Hot Stone Massage (90 min)', 'price': 249900, 'duration': '90 min', 'category_id': spa_cat, 'type': 'product', 'image': 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=400'},
        
        # Full Body Oil Massage
        {'id': str(uuid.uuid4()), 'name': 'Full Body Oil Massage (60 min)', 'price': 149900, 'duration': '60 min', 'category_id': massage_cat, 'type': 'product', 'image': 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Full Body Oil Massage (90 min)', 'price': 199900, 'duration': '90 min', 'category_id': massage_cat, 'type': 'product', 'image': 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400'},
        
        # Couple Massage
        {'id': str(uuid.uuid4()), 'name': 'Couple Massage (60 min)', 'price': 259900, 'duration': '60 min', 'category_id': spa_cat, 'type': 'product', 'image': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Couple Massage (90 min)', 'price': 349900, 'duration': '90 min', 'category_id': spa_cat, 'type': 'product', 'image': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400'},
        
        # Packages
        {'id': str(uuid.uuid4()), 'name': 'Relaxation Starter Pack', 'description': 'Head + Back Massage', 'price': 199900, 'duration': '90 min', 'category_id': package_cat, 'type': 'package', 'image': 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Stress Relief Combo', 'description': 'Swedish + Foot Reflexology', 'price': 249900, 'duration': '120 min', 'category_id': package_cat, 'type': 'package', 'image': 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Full Body Relax Pack', 'description': 'Full Body Oil + Hot Stone', 'price': 299900, 'duration': '150 min', 'category_id': package_cat, 'type': 'package', 'image': 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Luxury Spa Experience', 'description': 'Aromatherapy + Balinese + Facial', 'price': 499900, 'duration': '180 min', 'category_id': package_cat, 'type': 'package', 'image': 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Ultimate Stress Release Pack', 'description': 'Deep Tissue + Hot Stone + Aromatherapy', 'price': 599900, 'duration': '210 min', 'category_id': package_cat, 'type': 'package', 'image': 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Monthly Relax Pack', 'description': '4 sessions of choice', 'price': 699900, 'duration': '4 sessions', 'category_id': package_cat, 'type': 'package', 'image': 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Monthly Wellness Pack', 'description': '6 sessions of choice', 'price': 999900, 'duration': '6 sessions', 'category_id': package_cat, 'type': 'package', 'image': 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Premium Home Spa Package', 'description': 'Couple Massage + Aromatherapy', 'price': 799900, 'duration': '180 min', 'category_id': package_cat, 'type': 'package', 'image': 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Ultimate Home Spa Experience', 'description': 'Full day spa at home', 'price': 1199900, 'duration': '8 hours', 'category_id': package_cat, 'type': 'package', 'image': 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400'},
    ]
    
    await db.products.insert_many(products)
    print(f"Created {len(products)} products")
    
    # Create default professional
    professional = {
        'id': str(uuid.uuid4()),
        'name': 'Rajni',
        'email': None,
        'status': 'active',
        'user_id': None
    }
    
    await db.professionals.insert_one(professional)
    print("Created default professional: Rajni")
    
    print("Seeding completed!")
    client.close()

if __name__ == '__main__':
    asyncio.run(seed_data())
