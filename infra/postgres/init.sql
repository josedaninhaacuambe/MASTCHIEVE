-- Create n8n database
CREATE DATABASE n8n_db;

-- Extensions for mastchieve_db
\c mastchieve_db;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";
