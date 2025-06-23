# Backend Structure: AI Returns Agent (Supabase)

## 1. Overview

This document specifies the database schema for the AI Returns Agent project, to be implemented in Supabase. Supabase uses a PostgreSQL database.

## 2. Authentication

- We will use Supabase's built-in authentication.
- **Table**: `auth.users` (managed by Supabase)
- **Primary User Role**: `business_admin`
- **Authentication Method**: Email/Password and social provider (Google).

## 3. Database Tables

We will need the following tables to store our application's data.

### Table 1: `profiles`

This table stores public data related to a registered user. It has a one-to-one relationship with the `auth.users` table.

- **Purpose**: To store business-specific information not suitable for the `auth.users` table.
- **Fields**:
  - `id` (uuid, Primary Key): Foreign key to `auth.users.id`.
  - `created_at` (timestamp with time zone): Automatically managed.
  - `business_name` (text): The name of the e-commerce business.
  - `website` (text, nullable): The company's website.

### Table 2: `return_policies`

Stores the specific return policy rules for each business.

- **Purpose**: To allow the AI to look up and apply the correct return rules for a given business.
- **Fields**:
  - `id` (bigint, Primary Key): Auto-incrementing unique identifier.
  - `created_at` (timestamp with time zone): Automatically managed.
  - `business_id` (uuid): Foreign key to `profiles.id`. Links the policy to a business.
  - `return_window_days` (integer): The number of days a customer has to return an item (e.g., 30).
  - `non_returnable_categories` (array of text, nullable): List of product categories that cannot be returned (e.g., `["final_sale", "gift_cards"]`).
  - `requires_photo_for_defect` (boolean, default: true): Whether a photo is mandatory for "defective" returns.

### Table 3: `return_requests`

The core table that tracks every single return request initiated by a customer.

- **Purpose**: To serve as the main log of all return activities, viewable on the admin dashboard.
- **Fields**:
  - `id` (bigint, Primary Key): Auto-incrementing unique identifier.
  - `public_id` (uuid, default: `gen_random_uuid()`): A unique, non-guessable identifier for public-facing links.
  - `created_at` (timestamp with time zone): Automatically managed.
  - `business_id` (uuid): Foreign key to `profiles.id`. Links the request to a business.
  - `order_id` (text): The original order number from the e-commerce store (e.g., "ORDER-12345").
  - `customer_email` (text): The email of the customer making the return.
  - `reason_for_return` (text): The reason provided by the customer.
  - `status` (text): The current status of the request. Must be one of: `pending`, `approved`, `rejected`, `escalated`, `shipped`, `completed`.
  - `product_photos_urls` (array of text, nullable): An array of URLs pointing to images uploaded by the customer.
  - `rma_number` (text, nullable): The unique Return Merchandise Authorization number generated upon approval.
  - `disposition` (text, nullable): The final decision for the item: `return_to_stock`, `refurbish`, `donate`, `recycle`.
  - `admin_notes` (text, nullable): Internal notes added by a customer service agent or admin.

### Table 4: `mock_orders`

A simple table to simulate an external ERP/order management system for the hackathon POC.

- **Purpose**: To allow the chatbot to look up an order and verify its existence and purchase date.
- **Fields**:
  - `id` (bigint, Primary Key): Auto-incrementing unique identifier.
  - `order_id` (text, unique): The order number (e.g., "ORDER-12345").
  - `purchase_date` (timestamp with time zone): The date the order was placed.
  - `customer_email` (text): The email associated with the order.
  - `product_name` (text): Name of the product purchased.
  - `product_category` (text): Category of the product.

## 4. Storage

- We will use **Supabase Storage**.
- A single bucket named `product-images` will be created.
- It will be used to store the photos customers upload for their return requests.
- Row Level Security (RLS) policies will be configured to ensure that users can only upload images for their own return requests and that images are not publicly readable without permission. 