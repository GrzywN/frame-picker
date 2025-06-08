-- Initial database schema for Frame Picker

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    tier VARCHAR(50) NOT NULL DEFAULT 'FREE',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255) NOT NULL UNIQUE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'created',
    message TEXT,
    progress INTEGER DEFAULT 0,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Video files table
CREATE TABLE video_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    original_filename VARCHAR(255) NOT NULL,
    safe_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    content_type VARCHAR(100),
    duration FLOAT,
    fps FLOAT,
    width INTEGER,
    height INTEGER,
    frame_count INTEGER,
    format VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Processing jobs table
CREATE TABLE processing_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    video_file_id UUID NOT NULL REFERENCES video_files(id) ON DELETE CASCADE,
    mode VARCHAR(50) NOT NULL,
    quality VARCHAR(50) NOT NULL,
    count INTEGER NOT NULL,
    sample_rate INTEGER NOT NULL,
    min_interval FLOAT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    error TEXT,
    estimated_time INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Frame results table
CREATE TABLE frame_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    processing_job_id UUID NOT NULL REFERENCES processing_jobs(id) ON DELETE CASCADE,
    frame_index INTEGER NOT NULL,
    score FLOAT NOT NULL,
    timestamp FLOAT NOT NULL,
    file_path VARCHAR(500),
    file_size INTEGER,
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_video_files_session_id ON video_files(session_id);
CREATE INDEX idx_processing_jobs_session_id ON processing_jobs(session_id);
CREATE INDEX idx_processing_jobs_video_file_id ON processing_jobs(video_file_id);
CREATE INDEX idx_frame_results_processing_job_id ON frame_results(processing_job_id);

-- Add foreign key constraints
ALTER TABLE sessions
    ADD CONSTRAINT fk_sessions_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE video_files
    ADD CONSTRAINT fk_video_files_session_id FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE;
ALTER TABLE processing_jobs
    ADD CONSTRAINT fk_processing_jobs_session_id FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_processing_jobs_video_file_id FOREIGN KEY (video_file_id) REFERENCES video_files(id) ON DELETE CASCADE;
ALTER TABLE frame_results
    ADD CONSTRAINT fk_frame_results_processing_job_id FOREIGN KEY (processing_job_id) REFERENCES processing_jobs(id) ON DELETE CASCADE;

