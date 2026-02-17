-- Seed data for Shree Bhagvan Singh Kirana Store
-- Run this in your Supabase SQL Editor after creating the tables

-- Insert 30+ products
INSERT INTO public.products (name, name_hindi, category, price, unit, stock, description, featured, tags) VALUES
-- Grains (अनाज)
('HMT Rice', 'एचएमटी चावल', 'grains', 45, 'kg', 50, 'Premium quality HMT rice, perfect for daily meals. Sourced from the finest farms.', true, ARRAY['rice', 'staple', 'premium']),
('Khanda Rice', 'खंडा चावल', 'grains', 40, 'kg', 45, 'Traditional khanda rice with authentic taste and aroma.', false, ARRAY['rice', 'staple']),
('Basmati Rice', 'बासमती चावल', 'grains', 80, 'kg', 35, 'Long grain aromatic basmati rice for special occasions.', true, ARRAY['rice', 'premium', 'aromatic']),
('Wheat Flour', 'गेहूं का आटा', 'grains', 32, 'kg', 60, 'Freshly ground wheat flour for soft rotis.', false, ARRAY['flour', 'staple']),
('Bajra', 'बाजरा', 'grains', 35, 'kg', 25, 'Nutritious pearl millet, perfect for winter meals.', false, ARRAY['millet', 'healthy']),
('Jowar', 'ज्वार', 'grains', 30, 'kg', 30, 'Healthy sorghum grain for traditional recipes.', false, ARRAY['millet', 'healthy']),

-- Pulses (दालें)
('Arhar Dal', 'अरहर दाल', 'pulses', 120, 'kg', 30, 'Premium toor dal for delicious dal tadka.', true, ARRAY['dal', 'protein']),
('Chana Dal', 'चना दाल', 'pulses', 80, 'kg', 40, 'Split chickpeas perfect for dal and snacks.', false, ARRAY['dal', 'protein']),
('Moong Dal', 'मूंग दाल', 'pulses', 100, 'kg', 35, 'Split green gram, easy to digest.', false, ARRAY['dal', 'healthy', 'protein']),
('Masoor Dal', 'मसूर दाल', 'pulses', 90, 'kg', 38, 'Red lentils for quick cooking.', false, ARRAY['dal', 'quick', 'protein']),
('Urad Dal', 'उड़द दाल', 'pulses', 110, 'kg', 28, 'Black gram for idli, dosa, and dal makhani.', false, ARRAY['dal', 'protein']),
('Rajma', 'राजमा', 'pulses', 130, 'kg', 22, 'Kashmiri kidney beans for rich curry.', true, ARRAY['beans', 'protein', 'kashmiri']),

-- Spices (मसाले)
('Turmeric Powder', 'हल्दी पाउडर', 'spices', 60, '100g', 40, 'Pure turmeric powder with natural color and medicinal properties.', true, ARRAY['spice', 'masala', 'healthy']),
('Red Chili Powder', 'लाल मिर्च पाउडर', 'spices', 80, '100g', 35, 'Hot and flavorful red chili powder.', false, ARRAY['spice', 'masala', 'hot']),
('Coriander Powder', 'धनिया पाउडर', 'spices', 50, '100g', 42, 'Freshly ground coriander powder.', false, ARRAY['spice', 'masala']),
('Garam Masala', 'गरम मसाला', 'spices', 45, '50g', 30, 'Blend of aromatic spices for perfect curry.', true, ARRAY['spice', 'blend', 'aromatic']),
('Cumin Seeds', 'जीरा', 'spices', 120, '100g', 25, 'Whole cumin seeds for tempering.', false, ARRAY['spice', 'whole']),
('Mustard Seeds', 'सरसों', 'spices', 40, '100g', 50, 'Black mustard seeds for tadka.', false, ARRAY['spice', 'whole']),

-- Oil (तेल)
('Mustard Oil', 'सरसों का तेल', 'oil', 140, 'liter', 25, 'Pure kachi ghani mustard oil for cooking and pickles.', true, ARRAY['oil', 'cooking', 'traditional']),
('Refined Oil', 'रिफाइंड तेल', 'oil', 110, 'liter', 40, 'Light and healthy refined vegetable oil.', false, ARRAY['oil', 'cooking', 'light']),
('Desi Ghee', 'देसी घी', 'oil', 450, '500g', 20, 'Pure cow ghee for authentic taste.', true, ARRAY['ghee', 'pure', 'traditional']),
('Sunflower Oil', 'सूरजमुखी तेल', 'oil', 130, 'liter', 35, 'Heart-healthy sunflower oil.', false, ARRAY['oil', 'healthy', 'cooking']),

-- Snacks (नाश्ता)
('Parle-G', 'पारले-जी', 'snacks', 10, 'pack', 100, 'India favorite glucose biscuit.', true, ARRAY['biscuit', 'sweet']),
('Marie Gold', 'मैरी गोल्ड', 'snacks', 30, 'pack', 80, 'Light and crispy tea-time biscuit.', false, ARRAY['biscuit', 'tea-time']),
('Kurkure', 'कुरकुरे', 'snacks', 20, 'pack', 60, 'Crunchy and spicy snacks.', false, ARRAY['snacks', 'crunchy']),
('Lays', 'लेस', 'snacks', 20, 'pack', 55, 'Classic potato chips in various flavors.', false, ARRAY['chips', 'potato']),
('Haldiram Namkeen', 'हल्दीराम नमकीन', 'snacks', 50, 'pack', 45, 'Assorted savory snacks mix.', true, ARRAY['namkeen', 'savory']),
('Good Day', 'गुड डे', 'snacks', 25, 'pack', 70, 'Buttery cookies with cashews.', false, ARRAY['cookies', 'butter']),

-- Beverages (पेय)
('Tata Tea Premium', 'टाटा चाय प्रीमियम', 'beverages', 85, '100g', 50, 'Premium black tea for strong chai.', true, ARRAY['tea', 'black']),
('Red Label', 'रेड लेबल', 'beverages', 95, '100g', 40, 'Classic blended tea.', false, ARRAY['tea', 'blend']),
('Nescafe Classic', 'नेस्कैफे क्लासिक', 'beverages', 120, '50g', 35, 'Rich and aromatic instant coffee.', true, ARRAY['coffee', 'instant']),
('Bru Coffee', 'ब्रू कॉफी', 'beverages', 100, '50g', 38, 'South Indian filter coffee taste.', false, ARRAY['coffee', 'south-indian']),
('Pepsi 2L', 'पेप्सी 2L', 'beverages', 85, 'bottle', 30, 'Refreshing cola drink.', false, ARRAY['cold-drink', 'cola']),
('Thums Up 2L', 'थम्स अप 2L', 'beverages', 85, 'bottle', 28, 'Strong cola with bold taste.', false, ARRAY['cold-drink', 'cola']),

-- Dairy (डेयरी)
('Amul Milk 500ml', 'अमूल दूध 500ml', 'dairy', 27, 'pack', 100, 'Fresh toned milk.', true, ARRAY['milk', 'fresh']),
('Amul Butter 100g', 'अमूल मक्खन 100g', 'dairy', 50, 'pack', 60, 'Delicious salted butter.', false, ARRAY['butter', 'salted']),
('Amul Cheese Slices', 'अमूल चीज़ स्लाइस', 'dairy', 140, '200g', 40, 'Processed cheese slices for sandwiches.', false, ARRAY['cheese', 'slices']),
('Nestle Curd 400g', 'नेस्ले दही 400g', 'dairy', 45, 'pack', 50, 'Thick and creamy curd.', false, ARRAY['curd', 'creamy']),
('Paneer 200g', 'पनीर 200g', 'dairy', 80, 'pack', 35, 'Fresh cottage cheese.', true, ARRAY['paneer', 'fresh', 'protein']),

-- Household (घरेलू)
('Surf Excel 500g', 'सर्फ एक्सेल 500g', 'household', 95, 'pack', 40, 'Powerful stain removal detergent.', true, ARRAY['detergent', 'washing']),
('Tide 1kg', 'टाइड 1kg', 'household', 120, 'pack', 35, 'Superior cleaning powder.', false, ARRAY['detergent', 'cleaning']),
('Lifebuoy Soap', 'लाइफबॉय साबुन', 'household', 35, 'piece', 80, 'Germ protection soap.', false, ARRAY['soap', 'germ-protection']),
('Dove Soap', 'डव साबुन', 'household', 45, 'piece', 60, 'Moisturizing beauty bar.', false, ARRAY['soap', 'moisturizing']),
('Harpic 500ml', 'हारपिक 500ml', 'household', 85, 'bottle', 45, 'Toilet cleaner for sparkling clean.', true, ARRAY['cleaner', 'toilet']),
('Vim Bar', 'विम बार', 'household', 10, 'piece', 100, 'Dishwash bar for sparkling utensils.', false, ARRAY['dishwash', 'bar']);

-- Insert admin user (you'll need to sign up via the app first, then update role)
-- Or insert directly with proper auth setup
