-- Seed data for development

-- Insert test users (bypassing auth for development)
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'a4b2c8d1-1234-5678-9012-123456789abc',
    'authenticated',
    'authenticated',
    'test@framepicker.ai',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
);

-- Test user profile will be created automatically via trigger

-- Insert test processing session
INSERT INTO public.processing_sessions (
    user_id,
    session_id,
    status,
    message,
    progress,
    original_filename,
    file_size,
    duration,
    fps,
    width,
    height,
    mode,
    quality,
    frame_count
) VALUES (
    'a4b2c8d1-1234-5678-9012-123456789abc',
    'test-session-12345',
    'completed',
    'Processing completed successfully',
    100,
    'test_video.mp4',
    1024000,
    30.5,
    25.0,
    1920,
    1080,
    'profile',
    'balanced',
    3
);

-- Insert test frame results
INSERT INTO public.frame_results (
    session_id,
    frame_index,
    score,
    timestamp,
    file_path,
    file_size,
    width,
    height
) VALUES 
(
    (SELECT id FROM public.processing_sessions WHERE session_id = 'test-session-12345'),
    0,
    0.95,
    12.5,
    '/results/test-session-12345/frame_01.jpg',
    245760,
    1920,
    1080
),
(
    (SELECT id FROM public.processing_sessions WHERE session_id = 'test-session-12345'),
    1,
    0.87,
    18.2,
    '/results/test-session-12345/frame_02.jpg',
    238450,
    1920,
    1080
),
(
    (SELECT id FROM public.processing_sessions WHERE session_id = 'test-session-12345'),
    2,
    0.82,
    25.1,
    '/results/test-session-12345/frame_03.jpg',
    251200,
    1920,
    1080
);

-- Insert test usage tracking
INSERT INTO public.usage_tracking (
    user_id,
    month,
    videos_processed,
    frames_extracted,
    storage_used_bytes,
    api_requests
) VALUES (
    'a4b2c8d1-1234-5678-9012-123456789abc',
    DATE_TRUNC('month', CURRENT_DATE),
    1,
    3,
    7372800, -- ~7MB
    5
);
