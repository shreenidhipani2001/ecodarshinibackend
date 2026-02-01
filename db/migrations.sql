-- =============================================
-- E-COMMERCE BACKEND DATABASE MIGRATIONS
-- =============================================

-- 1. CREATE ENUMS
-- =============================================

-- User Role Enum
CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');

-- Order Status Enum
CREATE TYPE order_status AS ENUM (
  'CREATED',
  'PAID',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED'
);

-- Payment Status Enum
CREATE TYPE payment_status AS ENUM (
  'SUCCESS',
  'FAILED'
);

-- 2. CREATE TABLES
-- =============================================

-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone VARCHAR(20),
  role user_role NOT NULL DEFAULT 'USER',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Addresses Table
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  address_line1 TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  pincode VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'India',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_addresses_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

-- Categories Table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(150) UNIQUE NOT NULL,
  cms_image_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  stock INT NOT NULL CHECK (stock >= 0),
  category_id UUID NOT NULL,
  cms_image_ids JSONB,
  artist_name VARCHAR(150),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id)
    REFERENCES categories(id)
    ON DELETE RESTRICT
);

-- Add added_by and bought_by columns to products
ALTER TABLE products
ADD COLUMN added_by UUID,
ADD COLUMN bought_by UUID;

-- Set default value for added_by (replace with actual admin UUID)
-- UPDATE products
-- SET added_by = 'ADMIN_USER_UUID_HERE';

-- Make added_by NOT NULL after setting default
-- ALTER TABLE products
-- ALTER COLUMN added_by SET NOT NULL;

-- Add foreign key constraints
ALTER TABLE products
ADD CONSTRAINT fk_products_added_by
  FOREIGN KEY (added_by)
  REFERENCES users(id)
  ON DELETE RESTRICT;

ALTER TABLE products
ADD CONSTRAINT fk_products_bought_by
  FOREIGN KEY (bought_by)
  REFERENCES users(id)
  ON DELETE SET NULL;

-- Cart Items Table
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_cart_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_cart_product
    FOREIGN KEY (product_id)
    REFERENCES products(id)
    ON DELETE CASCADE,

  CONSTRAINT uq_user_product_cart
    UNIQUE (user_id, product_id)
);

-- Orders Table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
  status order_status NOT NULL DEFAULT 'CREATED',
  payment_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

-- Add product_id to orders
ALTER TABLE orders
ADD COLUMN product_id UUID,
ADD CONSTRAINT fk_orders_product
  FOREIGN KEY (product_id)
  REFERENCES products(id)
  ON DELETE RESTRICT;

-- Order Items Table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  product_id UUID NOT NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  quantity INT NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id)
    REFERENCES orders(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_order_items_product
    FOREIGN KEY (product_id)
    REFERENCES products(id)
    ON DELETE RESTRICT
);

-- Payments Table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razorpay_order_id TEXT NOT NULL,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  status payment_status NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reviews Table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_reviews_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_reviews_product
    FOREIGN KEY (product_id)
    REFERENCES products(id)
    ON DELETE CASCADE,

  CONSTRAINT uq_user_product_review
    UNIQUE (user_id, product_id)
);

-- Wishlist Items Table
CREATE TABLE wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_wishlist_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_wishlist_product
    FOREIGN KEY (product_id)
    REFERENCES products(id)
    ON DELETE CASCADE,

  CONSTRAINT unique_user_product
    UNIQUE (user_id, product_id)
);

-- 3. CREATE INDEXES
-- =============================================

-- Order Items Indexes
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Orders Indexes
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Payments Indexes
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_razorpay_order_id ON payments(razorpay_order_id);

-- Reviews Indexes
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);

-- Products Indexes
CREATE INDEX idx_products_added_by ON products(added_by);
CREATE INDEX idx_products_bought_by ON products(bought_by);

-- 4. ORDER TRACKING SYSTEM
-- =============================================

-- Tracking Status Enum
CREATE TYPE tracking_status AS ENUM (
  'ORDER_PLACED',
  'PROCESSING',
  'PACKED',
  'SHIPPED',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'FAILED_DELIVERY',
  'RETURNED'
);

-- Order Tracking Table
CREATE TABLE order_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  status tracking_status NOT NULL DEFAULT 'ORDER_PLACED',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address_display TEXT,
  address_road VARCHAR(255),
  address_city VARCHAR(100),
  address_state VARCHAR(100),
  address_country VARCHAR(100),
  address_postcode VARCHAR(20),
  osm_id BIGINT,
  osm_type VARCHAR(10),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_order_tracking_order
    FOREIGN KEY (order_id)
    REFERENCES orders(id)
    ON DELETE CASCADE
);

-- Order Tracking Indexes
CREATE INDEX idx_order_tracking_order_id ON order_tracking(order_id);
CREATE INDEX idx_order_tracking_status ON order_tracking(status);
CREATE INDEX idx_order_tracking_created_at ON order_tracking(created_at);

-- 5. SUBCATEGORIES SYSTEM
-- =============================================

-- Sub-Categories Table
CREATE TABLE sub_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(150) NOT NULL,
  cms_image_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_sub_categories_category
    FOREIGN KEY (category_id)
    REFERENCES categories(id)
    ON DELETE RESTRICT,

  CONSTRAINT uq_sub_category_slug UNIQUE (category_id, slug)
);

-- Add subcategory_id to products
ALTER TABLE products
ADD COLUMN subcategory_id UUID;

-- Add foreign key constraint for subcategory_id
ALTER TABLE products
ADD CONSTRAINT fk_products_subcategory
  FOREIGN KEY (subcategory_id)
  REFERENCES sub_categories(id)
  ON DELETE RESTRICT;

-- Sub-Categories Indexes
CREATE INDEX idx_sub_categories_category_id ON sub_categories(category_id);
CREATE INDEX idx_sub_categories_slug ON sub_categories(slug);
CREATE INDEX idx_products_subcategory_id ON products(subcategory_id);
