-- 0012_expand_add_lookup_structures.sql
-- Phase 1: Expand - Add new structures alongside existing ones

-- 1. Create lookup tables if not exists
CREATE TABLE IF NOT EXISTS category_project_statuses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  name        TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS category_project_types (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  name        TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS category_tags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  name        TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- 2. Add new nullable foreign-key columns to project (alongside existing enum columns)
ALTER TABLE project
  ADD COLUMN IF NOT EXISTS status_id UUID,
  ADD COLUMN IF NOT EXISTS type_id   UUID;

-- 3. Create many-to-many join table for tags
CREATE TABLE project_tag_relations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  project_id UUID NOT NULL,
  tag_id     UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT project_tag_relations_project_fkey FOREIGN KEY (project_id)
    REFERENCES project(id) ON DELETE CASCADE,
  CONSTRAINT project_tag_relations_tag_fkey FOREIGN KEY (tag_id)
    REFERENCES category_tags(id) ON DELETE CASCADE,
  CONSTRAINT project_tag_relations_unique UNIQUE (project_id, tag_id)
);

-- 4. Add indexes for the new columns and join table
CREATE INDEX IF NOT EXISTS idx_project_status_id
  ON project(status_id);

CREATE INDEX IF NOT EXISTS idx_project_type_id
  ON project(type_id);

CREATE INDEX IF NOT EXISTS idx_ptr_project_id
  ON project_tag_relations(project_id);

CREATE INDEX IF NOT EXISTS idx_ptr_tag_id
  ON project_tag_relations(tag_id);

-- NOT adding foreign key constraints yet
-- This will be done in Phase 3 after data migration
