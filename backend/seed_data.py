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
    print("Seeding intowns.in data...")
    
    # Clear existing data
    await db.categories.delete_many({})
    await db.products.delete_many({})
    await db.professionals.delete_many({})
    await db.wallet_offers.delete_many({})
    await db.wallet_config.delete_many({})
    
    # ==================== LEVEL 1: MAIN CATEGORIES (4 TILES) ====================
    main_categories = [
        {
            'id': str(uuid.uuid4()),
            'name': 'Massage',
            'image': 'https://images.unsplash.com/photo-1649751295468-953038600bef?crop=entropy&cs=srgb&fm=jpg&q=85',
            'description': 'Relaxing massage therapies',
            'parent_id': None,
            'level': 1
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'Spa',
            'image': 'https://images.unsplash.com/photo-1596178060671-7a80dc8059ea?crop=entropy&cs=srgb&fm=jpg&q=85',
            'description': 'Luxury spa treatments',
            'parent_id': None,
            'level': 1
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'Packages',
            'image': 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?crop=entropy&cs=srgb&fm=jpg&q=85',
            'description': 'Special combo packages',
            'parent_id': None,
            'level': 1
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'Therapy',
            'image': 'https://images.unsplash.com/photo-1630595632518-8217c0bceb8f?crop=entropy&cs=srgb&fm=jpg&q=85',
            'description': 'Specialized therapy services',
            'parent_id': None,
            'level': 1
        }
    ]
    
    await db.categories.insert_many(main_categories)
    print(f"Created {len(main_categories)} main categories")
    
    massage_cat = main_categories[0]['id']
    spa_cat = main_categories[1]['id']
    package_cat = main_categories[2]['id']
    therapy_cat = main_categories[3]['id']
    
    # ==================== LEVEL 2: SUB-CATEGORIES ====================
    
    sub_categories = [
        # Massage sub-categories
        {'id': str(uuid.uuid4()), 'name': 'Head Massage', 'parent_id': massage_cat, 'level': 2, 'image': 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Full Body Massage', 'parent_id': massage_cat, 'level': 2, 'image': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Back & Shoulder', 'parent_id': massage_cat, 'level': 2, 'image': 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Foot Reflexology', 'parent_id': massage_cat, 'level': 2, 'image': 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Deep Tissue', 'parent_id': massage_cat, 'level': 2, 'image': 'https://images.unsplash.com/photo-1596178060671-7a80dc8059ea?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Relaxation', 'parent_id': massage_cat, 'level': 2, 'image': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400'},
        
        # Spa sub-categories
        {'id': str(uuid.uuid4()), 'name': 'Aromatherapy', 'parent_id': spa_cat, 'level': 2, 'image': 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Swedish', 'parent_id': spa_cat, 'level': 2, 'image': 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Thai', 'parent_id': spa_cat, 'level': 2, 'image': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Balinese', 'parent_id': spa_cat, 'level': 2, 'image': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Hot Stone', 'parent_id': spa_cat, 'level': 2, 'image': 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Luxury Spa', 'parent_id': spa_cat, 'level': 2, 'image': 'https://images.unsplash.com/photo-1596178060671-7a80dc8059ea?w=400'},
        
        # Packages sub-categories
        {'id': str(uuid.uuid4()), 'name': 'Relaxation Packages', 'parent_id': package_cat, 'level': 2, 'image': 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Stress Relief Packages', 'parent_id': package_cat, 'level': 2, 'image': 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Couple Packages', 'parent_id': package_cat, 'level': 2, 'image': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Monthly Packages', 'parent_id': package_cat, 'level': 2, 'image': 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Premium Packages', 'parent_id': package_cat, 'level': 2, 'image': 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400'},
        
        # Therapy sub-categories
        {'id': str(uuid.uuid4()), 'name': 'Pain Relief', 'parent_id': therapy_cat, 'level': 2, 'image': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Sports Therapy', 'parent_id': therapy_cat, 'level': 2, 'image': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Senior Therapy', 'parent_id': therapy_cat, 'level': 2, 'image': 'https://images.unsplash.com/photo-1630595632518-8217c0bceb8f?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Recovery Therapy', 'parent_id': therapy_cat, 'level': 2, 'image': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400'},
    ]
    
    await db.categories.insert_many(sub_categories)
    print(f"Created {len(sub_categories)} sub-categories")
    
    # Map sub-categories by name for easy reference
    sub_cat_map = {cat['name']: cat['id'] for cat in sub_categories}
    
    # ==================== PRODUCTS ====================
    
    products = [
        # Head Massage
        {'id': str(uuid.uuid4()), 'name': 'Head Massage (30 min)', 'price': 49900, 'duration': '30 min', 'category_id': massage_cat, 'sub_category_id': sub_cat_map['Head Massage'], 'type': 'product', 'image': 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Head Massage (45 min)', 'price': 69900, 'duration': '45 min', 'category_id': massage_cat, 'sub_category_id': sub_cat_map['Head Massage'], 'type': 'product', 'image': 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Head Massage (60 min)', 'price': 89900, 'duration': '60 min', 'category_id': massage_cat, 'sub_category_id': sub_cat_map['Head Massage'], 'type': 'product', 'image': 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400'},
        
        # Full Body Massage
        {'id': str(uuid.uuid4()), 'name': 'Full Body Massage (60 min)', 'price': 149900, 'duration': '60 min', 'category_id': massage_cat, 'sub_category_id': sub_cat_map['Full Body Massage'], 'type': 'product', 'image': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Full Body Massage (90 min)', 'price': 199900, 'duration': '90 min', 'category_id': massage_cat, 'sub_category_id': sub_cat_map['Full Body Massage'], 'type': 'product', 'image': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400'},
        
        # Back & Shoulder
        {'id': str(uuid.uuid4()), 'name': 'Back & Shoulder (30 min)', 'price': 59900, 'duration': '30 min', 'category_id': massage_cat, 'sub_category_id': sub_cat_map['Back & Shoulder'], 'type': 'product', 'image': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Back & Shoulder (45 min)', 'price': 79900, 'duration': '45 min', 'category_id': massage_cat, 'sub_category_id': sub_cat_map['Back & Shoulder'], 'type': 'product', 'image': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400'},
        
        # Foot Reflexology
        {'id': str(uuid.uuid4()), 'name': 'Foot Reflexology (30 min)', 'price': 44900, 'duration': '30 min', 'category_id': massage_cat, 'sub_category_id': sub_cat_map['Foot Reflexology'], 'type': 'product', 'image': 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Foot Reflexology (45 min)', 'price': 64900, 'duration': '45 min', 'category_id': massage_cat, 'sub_category_id': sub_cat_map['Foot Reflexology'], 'type': 'product', 'image': 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400'},
        
        # Deep Tissue
        {'id': str(uuid.uuid4()), 'name': 'Deep Tissue Massage (60 min)', 'price': 149900, 'duration': '60 min', 'category_id': massage_cat, 'sub_category_id': sub_cat_map['Deep Tissue'], 'type': 'product', 'image': 'https://images.unsplash.com/photo-1596178060671-7a80dc8059ea?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Deep Tissue Massage (90 min)', 'price': 199900, 'duration': '90 min', 'category_id': massage_cat, 'sub_category_id': sub_cat_map['Deep Tissue'], 'type': 'product', 'image': 'https://images.unsplash.com/photo-1596178060671-7a80dc8059ea?w=400'},
        
        # Relaxation
        {'id': str(uuid.uuid4()), 'name': 'Relaxation Massage (60 min)', 'price': 129900, 'duration': '60 min', 'category_id': massage_cat, 'sub_category_id': sub_cat_map['Relaxation'], 'type': 'product', 'image': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400'},
        
        # Aromatherapy
        {'id': str(uuid.uuid4()), 'name': 'Aromatherapy (60 min)', 'price': 159900, 'duration': '60 min', 'category_id': spa_cat, 'sub_category_id': sub_cat_map['Aromatherapy'], 'type': 'product', 'image': 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Aromatherapy (90 min)', 'price': 219900, 'duration': '90 min', 'category_id': spa_cat, 'sub_category_id': sub_cat_map['Aromatherapy'], 'type': 'product', 'image': 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400'},
        
        # Swedish
        {'id': str(uuid.uuid4()), 'name': 'Swedish Massage (60 min)', 'price': 129900, 'duration': '60 min', 'category_id': spa_cat, 'sub_category_id': sub_cat_map['Swedish'], 'type': 'product', 'image': 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Swedish Massage (90 min)', 'price': 179900, 'duration': '90 min', 'category_id': spa_cat, 'sub_category_id': sub_cat_map['Swedish'], 'type': 'product', 'image': 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=400'},
        
        # Thai
        {'id': str(uuid.uuid4()), 'name': 'Thai Massage (60 min)', 'price': 139900, 'duration': '60 min', 'category_id': spa_cat, 'sub_category_id': sub_cat_map['Thai'], 'type': 'product', 'image': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Thai Massage (90 min)', 'price': 189900, 'duration': '90 min', 'category_id': spa_cat, 'sub_category_id': sub_cat_map['Thai'], 'type': 'product', 'image': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400'},
        
        # Balinese
        {'id': str(uuid.uuid4()), 'name': 'Balinese Massage (60 min)', 'price': 169900, 'duration': '60 min', 'category_id': spa_cat, 'sub_category_id': sub_cat_map['Balinese'], 'type': 'product', 'image': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Balinese Massage (90 min)', 'price': 229900, 'duration': '90 min', 'category_id': spa_cat, 'sub_category_id': sub_cat_map['Balinese'], 'type': 'product', 'image': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400'},
        
        # Hot Stone
        {'id': str(uuid.uuid4()), 'name': 'Hot Stone Massage (60 min)', 'price': 179900, 'duration': '60 min', 'category_id': spa_cat, 'sub_category_id': sub_cat_map['Hot Stone'], 'type': 'product', 'image': 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Hot Stone Massage (90 min)', 'price': 249900, 'duration': '90 min', 'category_id': spa_cat, 'sub_category_id': sub_cat_map['Hot Stone'], 'type': 'product', 'image': 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=400'},
        
        # Luxury Spa
        {'id': str(uuid.uuid4()), 'name': 'Luxury Spa Package (120 min)', 'price': 299900, 'duration': '120 min', 'category_id': spa_cat, 'sub_category_id': sub_cat_map['Luxury Spa'], 'type': 'product', 'image': 'https://images.unsplash.com/photo-1596178060671-7a80dc8059ea?w=400'},
        
        # Relaxation Packages
        {'id': str(uuid.uuid4()), 'name': 'Relaxation Starter Pack', 'description': 'Head + Back Massage', 'price': 199900, 'duration': '90 min', 'category_id': package_cat, 'sub_category_id': sub_cat_map['Relaxation Packages'], 'type': 'package', 'image': 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400'},
        
        # Stress Relief Packages
        {'id': str(uuid.uuid4()), 'name': 'Stress Relief Combo', 'description': 'Swedish + Foot Reflexology', 'price': 249900, 'duration': '120 min', 'category_id': package_cat, 'sub_category_id': sub_cat_map['Stress Relief Packages'], 'type': 'package', 'image': 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Ultimate Stress Release', 'description': 'Deep Tissue + Hot Stone + Aromatherapy', 'price': 599900, 'duration': '210 min', 'category_id': package_cat, 'sub_category_id': sub_cat_map['Stress Relief Packages'], 'type': 'package', 'image': 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400'},
        
        # Couple Packages
        {'id': str(uuid.uuid4()), 'name': 'Couple Massage (60 min)', 'price': 259900, 'duration': '60 min', 'category_id': package_cat, 'sub_category_id': sub_cat_map['Couple Packages'], 'type': 'package', 'image': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Couple Massage (90 min)', 'price': 349900, 'duration': '90 min', 'category_id': package_cat, 'sub_category_id': sub_cat_map['Couple Packages'], 'type': 'package', 'image': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400'},
        
        # Monthly Packages
        {'id': str(uuid.uuid4()), 'name': 'Monthly Relax Pack', 'description': '4 sessions of choice', 'price': 699900, 'duration': '4 sessions', 'category_id': package_cat, 'sub_category_id': sub_cat_map['Monthly Packages'], 'type': 'package', 'image': 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Monthly Wellness Pack', 'description': '6 sessions of choice', 'price': 999900, 'duration': '6 sessions', 'category_id': package_cat, 'sub_category_id': sub_cat_map['Monthly Packages'], 'type': 'package', 'image': 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400'},
        
        # Premium Packages
        {'id': str(uuid.uuid4()), 'name': 'Premium Home Spa', 'description': 'Couple Massage + Aromatherapy', 'price': 799900, 'duration': '180 min', 'category_id': package_cat, 'sub_category_id': sub_cat_map['Premium Packages'], 'type': 'package', 'image': 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400'},
        {'id': str(uuid.uuid4()), 'name': 'Ultimate Home Spa', 'description': 'Full day spa at home', 'price': 1199900, 'duration': '8 hours', 'category_id': package_cat, 'sub_category_id': sub_cat_map['Premium Packages'], 'type': 'package', 'image': 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400'},
        
        # Pain Relief
        {'id': str(uuid.uuid4()), 'name': 'Pain Relief Therapy (60 min)', 'price': 149900, 'duration': '60 min', 'category_id': therapy_cat, 'sub_category_id': sub_cat_map['Pain Relief'], 'type': 'product', 'image': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400'},
        
        # Sports Therapy
        {'id': str(uuid.uuid4()), 'name': 'Sports Massage (60 min)', 'price': 169900, 'duration': '60 min', 'category_id': therapy_cat, 'sub_category_id': sub_cat_map['Sports Therapy'], 'type': 'product', 'image': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400'},
        
        # Senior Therapy
        {'id': str(uuid.uuid4()), 'name': 'Senior Care Massage (45 min)', 'price': 99900, 'duration': '45 min', 'category_id': therapy_cat, 'sub_category_id': sub_cat_map['Senior Therapy'], 'type': 'product', 'image': 'https://images.unsplash.com/photo-1630595632518-8217c0bceb8f?w=400'},
        
        # Recovery Therapy
        {'id': str(uuid.uuid4()), 'name': 'Recovery Therapy (60 min)', 'price': 159900, 'duration': '60 min', 'category_id': therapy_cat, 'sub_category_id': sub_cat_map['Recovery Therapy'], 'type': 'product', 'image': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400'},
    ]
    
    await db.products.insert_many(products)
    print(f"Created {len(products)} products")
    
    # ==================== DEFAULT PROFESSIONAL ====================
    
    professional = {
        'id': str(uuid.uuid4()),
        'name': 'Rajni',
        'email': None,
        'status': 'active',
        'user_id': None
    }
    
    await db.professionals.insert_one(professional)
    print("Created default professional: Rajni")
    
    # ==================== WALLET OFFERS ====================
    
    wallet_offers = [
        {'id': str(uuid.uuid4()), 'amount': 50000, 'cashback_percentage': 20, 'max_cashback': 10000, 'active': True, 'created_at': '2025-01-01T00:00:00Z'},
        {'id': str(uuid.uuid4()), 'amount': 70000, 'cashback_percentage': 30, 'max_cashback': 21000, 'active': True, 'created_at': '2025-01-01T00:00:00Z'},
        {'id': str(uuid.uuid4()), 'amount': 100000, 'cashback_percentage': 40, 'max_cashback': 40000, 'active': True, 'created_at': '2025-01-01T00:00:00Z'},
        {'id': str(uuid.uuid4()), 'amount': 1000000, 'cashback_percentage': 100, 'max_cashback': 300000, 'active': True, 'created_at': '2025-01-01T00:00:00Z'},
    ]
    
    await db.wallet_offers.insert_many(wallet_offers)
    print(f"Created {len(wallet_offers)} wallet offers")
    
    # ==================== WALLET CONFIG ====================
    
    wallet_config = {
        'welcome_bonus_enabled': True,
        'welcome_bonus_amount': 10000,  # ₹100
        'welcome_bonus_min_cart': 20000,  # ₹200
        'welcome_bonus_max_deduction': 20000  # ₹200
    }
    
    await db.wallet_config.insert_one(wallet_config)
    print("Created wallet configuration")
    
    print("\n✅ Seeding completed successfully!")
    print(f"   - 4 main categories (Level 1)")
    print(f"   - {len(sub_categories)} sub-categories (Level 2)")
    print(f"   - {len(products)} products")
    print(f"   - 1 professional (Rajni)")
    print(f"   - {len(wallet_offers)} wallet offers")
    print(f"   - Wallet configuration with ₹100 welcome bonus\n")
    
    client.close()

if __name__ == '__main__':
    asyncio.run(seed_data())
