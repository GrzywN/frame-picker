-- Rollback initial database schema

-- Drop triggers
DROP TRIGGER IF EXISTS update_timestamp ON users;
DROP TRIGGER IF EXISTS update_timestamp ON sessions;
DROP TRIGGER IF EXISTS update_timestamp ON video_files;
DROP TRIGGER IF EXISTS update_timestamp ON processing_jobs;
DROP TRIGGER IF EXISTS update_timestamp ON frame_results;
DROP TRIGGER IF EXISTS set_created_at ON users;
DROP TRIGGER IF EXISTS set_created_at ON sessions;
DROP TRIGGER IF EXISTS set_created_at ON video_files;
DROP TRIGGER IF EXISTS set_created_at ON processing_jobs;
DROP TRIGGER IF EXISTS set_created_at ON frame_results;

-- Drop foreign key constraints
ALTER TABLE frame_results
    DROP CONSTRAINT IF EXISTS fk_frame_results_processing_job_id;
ALTER TABLE processing_jobs
    DROP CONSTRAINT IF EXISTS fk_processing_jobs_video_file_id,
    DROP CONSTRAINT IF EXISTS fk_processing_jobs_session_id;
ALTER TABLE video_files
    DROP CONSTRAINT IF EXISTS fk_video_files_session_id;
ALTER TABLE sessions
    DROP CONSTRAINT IF EXISTS fk_sessions_user_id;

-- Drop indexes first
DROP INDEX IF EXISTS idx_frame_results_processing_job_id;
DROP INDEX IF EXISTS idx_processing_jobs_video_file_id;
DROP INDEX IF EXISTS idx_processing_jobs_session_id;
DROP INDEX IF EXISTS idx_video_files_session_id;
DROP INDEX IF EXISTS idx_sessions_user_id;

-- Drop tables in reverse order of creation
DROP TABLE IF EXISTS frame_results;
DROP TABLE IF EXISTS processing_jobs;
DROP TABLE IF EXISTS video_files;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS users;

-- Remove UUID extension
DROP EXTENSION IF EXISTS "uuid-ossp";