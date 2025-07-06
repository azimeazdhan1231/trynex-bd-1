-- TryneX Lifestyle Database Setup for Supabase
-- Run these SQL commands in your Supabase SQL editor to set up the database

-- Enable Row Level Security (RLS) and create tables
-- Make sure to enable RLS on all tables for security

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    image_url TEXT,
    badge VARCHAR(50),
    feature BOOLEAN DEFAULT FALSE,
    stock_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255),
    customer_address TEXT,
    items JSONB NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0,
    delivery_fee DECIMAL(10,2) DEFAULT 60,
    total DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'booked',
    payment_status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(50),
    voucher_code VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vouchers table
CREATE TABLE IF NOT EXISTS vouchers (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'fixed')),
    value DECIMAL(10,2) NOT NULL,
    description TEXT,
    expiry_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    max_usage INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promotions table
CREATE TABLE IF NOT EXISTS promotions (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'fixed')),
    value DECIMAL(10,2) NOT NULL,
    start_date DATE,
    end_date DATE,
    is_popup BOOLEAN DEFAULT FALSE,
    popup_title VARCHAR(255),
    popup_message TEXT,
    button_text VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    icon VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site settings table
CREATE TABLE IF NOT EXISTS site_settings (
    id BIGSERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Featured products table (junction table)
CREATE TABLE IF NOT EXISTS featured_products (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_products ENABLE ROW LEVEL SECURITY;

-- Create policies to allow read access for all users and write access for authenticated users
-- Products policies
CREATE POLICY IF NOT EXISTS "Allow read access for products" ON products FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Allow insert for products" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow update for products" ON products FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "Allow delete for products" ON products FOR DELETE USING (true);

-- Orders policies
CREATE POLICY IF NOT EXISTS "Allow read access for orders" ON orders FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Allow insert for orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow update for orders" ON orders FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "Allow delete for orders" ON orders FOR DELETE USING (true);

-- Vouchers policies
CREATE POLICY IF NOT EXISTS "Allow read access for vouchers" ON vouchers FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Allow insert for vouchers" ON vouchers FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow update for vouchers" ON vouchers FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "Allow delete for vouchers" ON vouchers FOR DELETE USING (true);

-- Promotions policies
CREATE POLICY IF NOT EXISTS "Allow read access for promotions" ON promotions FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Allow insert for promotions" ON promotions FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow update for promotions" ON promotions FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "Allow delete for promotions" ON promotions FOR DELETE USING (true);

-- Categories policies
CREATE POLICY IF NOT EXISTS "Allow read access for categories" ON categories FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Allow insert for categories" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow update for categories" ON categories FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "Allow delete for categories" ON categories FOR DELETE USING (true);

-- Site settings policies
CREATE POLICY IF NOT EXISTS "Allow read access for site_settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Allow insert for site_settings" ON site_settings FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow update for site_settings" ON site_settings FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "Allow delete for site_settings" ON site_settings FOR DELETE USING (true);

-- Featured products policies
CREATE POLICY IF NOT EXISTS "Allow read access for featured_products" ON featured_products FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Allow insert for featured_products" ON featured_products FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow update for featured_products" ON featured_products FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "Allow delete for featured_products" ON featured_products FOR DELETE USING (true);

-- Create triggers to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to all tables that have updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vouchers_updated_at BEFORE UPDATE ON vouchers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON promotions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing
INSERT INTO products (name, description, price, category, image_url, badge, feature) VALUES
('Custom Photo Mug', 'Personalized ceramic mug with your favorite photo', 350, 'Custom Gifts', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400', 'Popular', true),
('Custom T-Shirt', 'High-quality cotton t-shirt with custom design', 450, 'Apparel', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', 'New', true),
('Personalized Keychain', 'Metal keychain with custom engraving', 120, 'Accessories', 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400', 'Bestseller', false),
('Custom Photo Frame', 'Wooden frame with personalized text', 280, 'Custom Gifts', 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400', '', false)
ON CONFLICT DO NOTHING;

-- Insert default vouchers
INSERT INTO vouchers (code, type, value, description, expiry_date) VALUES
('TRYNEX20', 'percentage', 20, 'Get 20% off on all custom products', '2025-12-31'),
('SAVE100', 'fixed', 100, 'Save 100 BDT on orders above 1000', '2025-12-31'),
('WELCOME15', 'percentage', 15, 'Welcome discount for new customers', '2025-12-31')
ON CONFLICT DO NOTHING;

-- Insert default categories
INSERT INTO categories (name, slug, description, image_url) VALUES
('Custom Gifts', 'custom-gifts', 'Personalized gifts for special occasions', 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400'),
('Apparel', 'apparel', 'Custom clothing and wearables', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'),
('Accessories', 'accessories', 'Personal accessories and small items', 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400'),
('Personalized Items', 'personalized', 'Fully customizable personal items', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400')
ON CONFLICT DO NOTHING;

-- Insert default site settings
INSERT INTO site_settings (setting_key, setting_value, description) VALUES
('site_name', 'TryneX Lifestyle', 'The name of the website'),
('hero_title', 'Create Memories with Custom Gifts', 'Main hero section title'),
('hero_subtitle', 'Personalized mugs, t-shirts, and lifestyle products crafted with love', 'Hero section subtitle'),
('contact_phone', '+880 1747 292277', 'Primary contact phone number'),
('contact_email', 'info@trynexlifestyle.com', 'Primary contact email'),
('whatsapp_number', '+880 1747 292277', 'WhatsApp contact number'),
('delivery_fee', '60', 'Standard delivery fee in BDT')
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Database setup completed successfully! All tables, policies, and sample data have been created.' AS status;