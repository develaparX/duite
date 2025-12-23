CREATE TABLE "bill_reminders" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'IDR',
	"due_date" date NOT NULL,
	"frequency" varchar(20) NOT NULL,
	"category" varchar(100),
	"payee" varchar(255) NOT NULL,
	"reminder_days" integer DEFAULT 3,
	"is_active" boolean DEFAULT true,
	"is_paid" boolean DEFAULT false,
	"last_paid_date" date,
	"next_due_date" date NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "frequency_check" CHECK ("bill_reminders"."frequency" IN ('monthly', 'quarterly', 'yearly', 'weekly')),
	CONSTRAINT "amount_check" CHECK ("bill_reminders"."amount" > 0),
	CONSTRAINT "reminder_days_check" CHECK ("bill_reminders"."reminder_days" >= 0)
);
--> statement-breakpoint
CREATE TABLE "budgets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(100),
	"category_id" integer,
	"amount" numeric(12, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'IDR',
	"period" varchar(20) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"alert_threshold" numeric(5, 2) DEFAULT '80.00',
	"is_active" boolean DEFAULT true,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "period_check" CHECK ("budgets"."period" IN ('weekly', 'monthly', 'yearly')),
	CONSTRAINT "amount_check" CHECK ("budgets"."amount" > 0),
	CONSTRAINT "threshold_check" CHECK ("budgets"."alert_threshold" >= 0 AND "budgets"."alert_threshold" <= 100)
);
--> statement-breakpoint
CREATE TABLE "cash_flow_projections" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"projection_date" date NOT NULL,
	"projected_income" numeric(15, 2) DEFAULT '0.00',
	"projected_expenses" numeric(15, 2) DEFAULT '0.00',
	"projected_balance" numeric(15, 2) DEFAULT '0.00',
	"actual_income" numeric(15, 2),
	"actual_expenses" numeric(15, 2),
	"actual_balance" numeric(15, 2),
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" varchar(20) NOT NULL,
	"parent_id" integer,
	"color" varchar(7) DEFAULT '#6B7280',
	"icon" varchar(50),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "type_check" CHECK ("categories"."type" IN ('income', 'expense'))
);
--> statement-breakpoint
CREATE TABLE "financial_goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"target_amount" numeric(15, 2) NOT NULL,
	"current_amount" numeric(15, 2) DEFAULT '0.00',
	"currency" varchar(3) DEFAULT 'IDR',
	"target_date" date,
	"category" varchar(50) NOT NULL,
	"priority" varchar(20) DEFAULT 'medium',
	"is_completed" boolean DEFAULT false,
	"auto_contribute" boolean DEFAULT false,
	"monthly_contribution" numeric(12, 2),
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "priority_check" CHECK ("financial_goals"."priority" IN ('low', 'medium', 'high')),
	CONSTRAINT "target_amount_check" CHECK ("financial_goals"."target_amount" > 0),
	CONSTRAINT "current_amount_check" CHECK ("financial_goals"."current_amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "investment_balances" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"account_name" varchar(255) NOT NULL,
	"balance" numeric(15, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'IDR',
	"account_type" varchar(100) DEFAULT 'general',
	"broker" varchar(255),
	"asset_class" varchar(100),
	"recorded_at" timestamp DEFAULT now(),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"priority" varchar(20) DEFAULT 'medium',
	"related_id" integer,
	"related_type" varchar(50),
	"scheduled_for" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "priority_check" CHECK ("notifications"."priority" IN ('low', 'medium', 'high'))
);
--> statement-breakpoint
CREATE TABLE "recurring_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" varchar(20) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'IDR',
	"description" text NOT NULL,
	"category" varchar(100),
	"category_id" integer,
	"frequency" varchar(20) NOT NULL,
	"interval_value" integer DEFAULT 1,
	"start_date" date NOT NULL,
	"end_date" date,
	"next_due_date" date NOT NULL,
	"is_active" boolean DEFAULT true,
	"related_party" varchar(255),
	"tags" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "type_check" CHECK ("recurring_transactions"."type" IN ('income', 'expense', 'debt', 'receivable')),
	CONSTRAINT "frequency_check" CHECK ("recurring_transactions"."frequency" IN ('daily', 'weekly', 'monthly', 'yearly')),
	CONSTRAINT "amount_check" CHECK ("recurring_transactions"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "savings_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"account_type" varchar(50) NOT NULL,
	"balance" numeric(15, 2) DEFAULT '0.00',
	"currency" varchar(3) DEFAULT 'IDR',
	"interest_rate" numeric(5, 4) DEFAULT '0.0000',
	"goal_id" integer,
	"is_active" boolean DEFAULT true,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "balance_check" CHECK ("savings_accounts"."balance" >= 0),
	CONSTRAINT "interest_rate_check" CHECK ("savings_accounts"."interest_rate" >= 0)
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" varchar(20) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'IDR',
	"description" text NOT NULL,
	"category" varchar(100),
	"category_id" integer,
	"transaction_date" date NOT NULL,
	"status" varchar(20) DEFAULT 'active',
	"related_party" varchar(255),
	"due_date" date,
	"recurring_id" integer,
	"tags" text,
	"notes" text,
	"attachments" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "type_check" CHECK ("transactions"."type" IN ('income', 'expense', 'debt', 'receivable', 'transfer')),
	CONSTRAINT "status_check" CHECK ("transactions"."status" IN ('active', 'settled', 'cancelled', 'pending')),
	CONSTRAINT "amount_check" CHECK ("transactions"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"currency" varchar(3) DEFAULT 'IDR',
	"timezone" varchar(50) DEFAULT 'UTC',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "bill_reminders" ADD CONSTRAINT "bill_reminders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_flow_projections" ADD CONSTRAINT "cash_flow_projections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_goals" ADD CONSTRAINT "financial_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment_balances" ADD CONSTRAINT "investment_balances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_accounts" ADD CONSTRAINT "savings_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_accounts" ADD CONSTRAINT "savings_accounts_goal_id_financial_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."financial_goals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_recurring_id_recurring_transactions_id_fk" FOREIGN KEY ("recurring_id") REFERENCES "public"."recurring_transactions"("id") ON DELETE no action ON UPDATE no action;