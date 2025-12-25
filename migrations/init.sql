-- Finance Tracker Database Schema - Enhanced Version
-- This script initializes the PostgreSQL database with all required tables for comprehensive financial management

-- PostgreSQL 18+ has native UUIDv7 support, no extension needed
-- UUIDv7 provides timestamp-based UUIDs that are sortable and have good index locality

-- FORCE DROP ALL EXISTING TABLES AND FUNCTIONS (for clean reinstall)
-- Drop all tables in correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS cash_flow_projections CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS bill_reminders CASCADE;
DROP TABLE IF EXISTS investment_balances CASCADE;
DROP TABLE IF EXISTS savings_accounts CASCADE;
DROP TABLE IF EXISTS financial_goals CASCADE;
DROP TABLE IF EXISTS budgets CASCADE;
DROP TABLE IF EXISTS recurring_transactions CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop any existing functions and triggers
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS create_default_categories_for_user(UUID) CASCADE;
DROP FUNCTION IF EXISTS create_default_categories_for_user(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS trigger_create_default_categories() CASCADE;

-- Drop existing tables if they exist (for clean reinstall) - REDUNDANT BUT KEPT FOR SAFETY
DROP TABLE IF EXISTS cash_flow_projections CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS bill_reminders CASCADE;
DROP TABLE IF EXISTS investment_balances CASCADE;
DROP TABLE IF EXISTS savings_accounts CASCADE;
DROP TABLE IF EXISTS financial_goals CASCADE;
DROP TABLE IF EXISTS budgets CASCADE;
DROP TABLE IF EXISTS recurring_transactions CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table for authentication (Enhanced with currency and timezone)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    currency VARCHAR(3) DEFAULT 'IDR',
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table for organizing transactions (Enhanced with hierarchical support)
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    color VARCHAR(7) DEFAULT '#6B7280',
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name, type, parent_id)
);

-- Recurring transactions table
CREATE TABLE recurring_transactions (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'debt', 'receivable')),
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'IDR',
    description TEXT NOT NULL,
    category VARCHAR(100),
    category_id UUID REFERENCES categories(id),
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
    interval_value INTEGER DEFAULT 1, -- every X frequency
    start_date DATE NOT NULL,
    end_date DATE,
    next_due_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    related_party VARCHAR(255),
    tags TEXT, -- JSON array of tags
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table for all financial records (Enhanced)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'debt', 'receivable', 'transfer')),
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'IDR',
    description TEXT NOT NULL,
    category VARCHAR(100),
    category_id UUID REFERENCES categories(id),
    transaction_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'settled', 'cancelled', 'pending')),
    related_party VARCHAR(255), -- For debts/receivables (creditor/debtor name)
    due_date DATE, -- For debts/receivables
    recurring_id UUID REFERENCES recurring_transactions(id),
    tags TEXT, -- JSON array of tags
    notes TEXT,
    attachments TEXT, -- JSON array of file paths
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Budgets table for budget planning and tracking
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    category_id UUID REFERENCES categories(id),
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'IDR',
    period VARCHAR(20) NOT NULL CHECK (period IN ('weekly', 'monthly', 'yearly')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    alert_threshold DECIMAL(5,2) DEFAULT 80.00 CHECK (alert_threshold >= 0 AND alert_threshold <= 100),
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Financial goals table for savings and financial targets
CREATE TABLE financial_goals (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target_amount DECIMAL(15,2) NOT NULL CHECK (target_amount > 0),
    current_amount DECIMAL(15,2) DEFAULT 0.00 CHECK (current_amount >= 0),
    currency VARCHAR(3) DEFAULT 'IDR',
    target_date DATE,
    category VARCHAR(50) NOT NULL, -- emergency_fund, vacation, house, car, etc.
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    is_completed BOOLEAN DEFAULT FALSE,
    auto_contribute BOOLEAN DEFAULT FALSE,
    monthly_contribution DECIMAL(12,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Savings accounts table for dedicated savings tracking
CREATE TABLE savings_accounts (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL, -- savings, checking, emergency, goal-based
    balance DECIMAL(15,2) DEFAULT 0.00 CHECK (balance >= 0),
    currency VARCHAR(3) DEFAULT 'IDR',
    interest_rate DECIMAL(5,4) DEFAULT 0.0000 CHECK (interest_rate >= 0),
    goal_id UUID REFERENCES financial_goals(id),
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Investment balances table for tracking portfolio values (Enhanced)
CREATE TABLE investment_balances (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    account_name VARCHAR(255) NOT NULL,
    balance DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'IDR',
    account_type VARCHAR(100) DEFAULT 'general',
    broker VARCHAR(255),
    asset_class VARCHAR(100), -- stocks, bonds, crypto, real_estate, etc.
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Bill reminders table for automated bill tracking
CREATE TABLE bill_reminders (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'IDR',
    due_date DATE NOT NULL,
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('monthly', 'quarterly', 'yearly', 'weekly')),
    category VARCHAR(100),
    payee VARCHAR(255) NOT NULL,
    reminder_days INTEGER DEFAULT 3 CHECK (reminder_days >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    is_paid BOOLEAN DEFAULT FALSE,
    last_paid_date DATE,
    next_due_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table for alerts and reminders
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- budget_alert, bill_reminder, goal_milestone, etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    related_id UUID, -- ID of related entity (budget, bill, goal, etc.)
    related_type VARCHAR(50), -- budget, bill, goal, etc.
    scheduled_for TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cash flow projections table for financial forecasting
CREATE TABLE cash_flow_projections (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    projection_date DATE NOT NULL,
    projected_income DECIMAL(15,2) DEFAULT 0.00,
    projected_expenses DECIMAL(15,2) DEFAULT 0.00,
    projected_balance DECIMAL(15,2) DEFAULT 0.00,
    actual_income DECIMAL(15,2),
    actual_expenses DECIMAL(15,2),
    actual_balance DECIMAL(15,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, projection_date)
);

-- Create indexes for better query performance
CREATE INDEX idx_users_email ON users(email);

CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_type ON categories(type);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_recurring_id ON transactions(recurring_id);

CREATE INDEX idx_recurring_transactions_user_id ON recurring_transactions(user_id);
CREATE INDEX idx_recurring_transactions_next_due ON recurring_transactions(next_due_date);
CREATE INDEX idx_recurring_transactions_active ON recurring_transactions(is_active);

CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_period ON budgets(start_date, end_date);
CREATE INDEX idx_budgets_active ON budgets(is_active);

CREATE INDEX idx_financial_goals_user_id ON financial_goals(user_id);
CREATE INDEX idx_financial_goals_completed ON financial_goals(is_completed);
CREATE INDEX idx_financial_goals_target_date ON financial_goals(target_date);

CREATE INDEX idx_savings_accounts_user_id ON savings_accounts(user_id);
CREATE INDEX idx_savings_accounts_goal_id ON savings_accounts(goal_id);
CREATE INDEX idx_savings_accounts_active ON savings_accounts(is_active);

CREATE INDEX idx_investment_balances_user_id ON investment_balances(user_id);
CREATE INDEX idx_investment_balances_recorded_at ON investment_balances(recorded_at);
CREATE INDEX idx_investment_balances_account_name ON investment_balances(account_name);

CREATE INDEX idx_bill_reminders_user_id ON bill_reminders(user_id);
CREATE INDEX idx_bill_reminders_next_due ON bill_reminders(next_due_date);
CREATE INDEX idx_bill_reminders_active ON bill_reminders(is_active);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_for);

CREATE INDEX idx_cash_flow_projections_user_id ON cash_flow_projections(user_id);
CREATE INDEX idx_cash_flow_projections_date ON cash_flow_projections(projection_date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recurring_transactions_updated_at BEFORE UPDATE ON recurring_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_goals_updated_at BEFORE UPDATE ON financial_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_savings_accounts_updated_at BEFORE UPDATE ON savings_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bill_reminders_updated_at BEFORE UPDATE ON bill_reminders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cash_flow_projections_updated_at BEFORE UPDATE ON cash_flow_projections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a function to automatically create default categories for new users
CREATE OR REPLACE FUNCTION create_default_categories_for_user(p_user_id UUID)
RETURNS VOID AS $
BEGIN
    -- Income Categories
    INSERT INTO categories (user_id, name, type, color, icon) VALUES 
    (p_user_id, 'Salary', 'income', '#10B981', 'briefcase'),
    (p_user_id, 'Freelance', 'income', '#3B82F6', 'laptop'),
    (p_user_id, 'Investment Returns', 'income', '#8B5CF6', 'trending-up'),
    (p_user_id, 'Business Income', 'income', '#F59E0B', 'building'),
    (p_user_id, 'Other Income', 'income', '#6B7280', 'plus-circle');

    -- Expense Categories
    INSERT INTO categories (user_id, name, type, color, icon) VALUES 
    (p_user_id, 'Food & Dining', 'expense', '#EF4444', 'utensils'),
    (p_user_id, 'Transportation', 'expense', '#F97316', 'car'),
    (p_user_id, 'Housing', 'expense', '#84CC16', 'home'),
    (p_user_id, 'Utilities', 'expense', '#06B6D4', 'zap'),
    (p_user_id, 'Healthcare', 'expense', '#EC4899', 'heart'),
    (p_user_id, 'Entertainment', 'expense', '#8B5CF6', 'film'),
    (p_user_id, 'Shopping', 'expense', '#F59E0B', 'shopping-bag'),
    (p_user_id, 'Education', 'expense', '#10B981', 'book'),
    (p_user_id, 'Insurance', 'expense', '#6366F1', 'shield'),
    (p_user_id, 'Other Expenses', 'expense', '#6B7280', 'minus-circle');
END;
$ LANGUAGE plpgsql;

-- Create a trigger to automatically create default categories when a new user is created
CREATE OR REPLACE FUNCTION trigger_create_default_categories()
RETURNS TRIGGER AS $
BEGIN
    PERFORM create_default_categories_for_user(NEW.id);
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER create_default_categories_trigger
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION trigger_create_default_categories();

-- Sample data for testing (optional - remove in production)
-- This creates a test user with some sample data
DO $
DECLARE
    test_user_id UUID;
BEGIN
    -- Create test user (password is 'password123' hashed)
    INSERT INTO users (email, password_hash, full_name, currency) 
    VALUES ('test@example.com', '$2b$10$rOzJqQZQQQQQQQQQQQQQQu', 'Test User', 'IDR')
    RETURNING id INTO test_user_id;

    -- Sample recurring transactions
    INSERT INTO recurring_transactions (user_id, type, amount, description, frequency, start_date, next_due_date) VALUES
    (test_user_id, 'income', 5000000.00, 'Monthly Salary', 'monthly', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 month'),
    (test_user_id, 'expense', 1200000.00, 'Rent Payment', 'monthly', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 month'),
    (test_user_id, 'expense', 300000.00, 'Utilities', 'monthly', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 month');

    -- Sample budget
    INSERT INTO budgets (user_id, name, amount, period, start_date, end_date) VALUES
    (test_user_id, 'Monthly Budget', 4000000.00, 'monthly', DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day');

    -- Sample financial goal
    INSERT INTO financial_goals (user_id, name, target_amount, category, target_date) VALUES
    (test_user_id, 'Emergency Fund', 50000000.00, 'emergency_fund', CURRENT_DATE + INTERVAL '1 year');

    -- Sample bill reminder
    INSERT INTO bill_reminders (user_id, name, amount, due_date, frequency, payee, next_due_date) VALUES
    (test_user_id, 'Credit Card Payment', 2500000.00, CURRENT_DATE + INTERVAL '15 days', 'monthly', 'Bank XYZ', CURRENT_DATE + INTERVAL '15 days');

END $;