-- Initial schema for Frame Picker
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom types
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'unpaid', 'trialing');
CREATE TYPE user_tier AS ENUM ('free', 'pro');
CREATE TYPE session_status AS ENUM ('created', 'uploaded', 'processing', 'completed', 'failed');
CREATE TYPE processing_mode AS ENUM ('profile', 'action');
CREATE TYPE processing_quality AS ENUM ('fast', 'balanced', 'best');

-- Users table (extends auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    stripe_customer_id TEXT UNIQUE,
    current_tier user_tier DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE public.subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    stripe_subscription_id TEXT UNIQUE NOT NULL,
    stripe_price_id TEXT NOT NULL,
    tier user_tier NOT NULL,
    status subscription_status NOT NULL,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage tracking
CREATE TABLE public.usage_tracking (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    month DATE NOT NULL,
    videos_processed INTEGER DEFAULT 0,
    frames_extracted INTEGER DEFAULT 0,
    storage_used_bytes BIGINT DEFAULT 0,
    api_requests INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, month)
);

-- Processing sessions (simplified)
CREATE TABLE public.processing_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    session_id TEXT UNIQUE NOT NULL,
    status session_status DEFAULT 'created',
    message TEXT,
    progress INTEGER DEFAULT 0,
    error_message TEXT,
    
    -- Video metadata
    original_filename TEXT,
    file_size BIGINT,
    duration FLOAT,
    fps FLOAT,
    width INTEGER,
    height INTEGER,
    
    -- Processing params
    mode processing_mode DEFAULT 'profile',
    quality processing_quality DEFAULT 'balanced',
    frame_count INTEGER DEFAULT 1,
    sample_rate INTEGER DEFAULT 30,
    min_interval FLOAT DEFAULT 2.0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Frame results
CREATE TABLE public.frame_results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES public.processing_sessions(id) ON DELETE CASCADE NOT NULL,
    frame_index INTEGER NOT NULL,
    score FLOAT NOT NULL CHECK (score >= 0 AND score <= 1),
    timestamp FLOAT NOT NULL CHECK (timestamp >= 0),
    file_path TEXT,
    file_size INTEGER,
    width INTEGER,
    height INTEGER,
    download_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_stripe_customer ON public.users(stripe_customer_id);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_usage_tracking_user_month ON public.usage_tracking(user_id, month);
CREATE INDEX idx_processing_sessions_user_id ON public.processing_sessions(user_id);
CREATE INDEX idx_processing_sessions_session_id ON public.processing_sessions(session_id);
CREATE INDEX idx_processing_sessions_status ON public.processing_sessions(status);
CREATE INDEX idx_frame_results_session_id ON public.frame_results(session_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_tracking_updated_at BEFORE UPDATE ON public.usage_tracking 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_processing_sessions_updated_at BEFORE UPDATE ON public.processing_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
