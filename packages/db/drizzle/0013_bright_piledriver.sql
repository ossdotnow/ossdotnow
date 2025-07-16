-- Migration: Backfill existing enum data to foreign key columns
-- This migration populates status_id, type_id and migrates tags array to many-to-many relationship

-- 1. Migrate existing status enum values to status_id
UPDATE project
SET status_id = (
    SELECT id FROM category_project_statuses
    WHERE name = project.status::text
)
WHERE status IS NOT NULL AND status_id IS NULL;

-- 2. Migrate existing type enum values to type_id
UPDATE project
SET type_id = (
    SELECT id FROM category_project_types
    WHERE name = project.type::text
)
WHERE type IS NOT NULL AND type_id IS NULL;

-- 3. Add unique constraint to project_tag_relations BEFORE using ON CONFLICT
ALTER TABLE project_tag_relations
ADD CONSTRAINT project_tag_relations_unique UNIQUE (project_id, tag_id);

-- 4. Migrate tags array to many-to-many relationship
DO $$
DECLARE
    project_record record;
    tag_name text;
    v_tag_id uuid;
BEGIN
    FOR project_record IN
        SELECT id, tags FROM project
        WHERE tags IS NOT NULL
        AND array_length(tags, 1) > 0
    LOOP
        FOREACH tag_name IN ARRAY project_record.tags LOOP
            SELECT id INTO v_tag_id FROM category_tags WHERE name = tag_name;
            IF v_tag_id IS NOT NULL THEN
                INSERT INTO project_tag_relations (project_id, tag_id)
                VALUES (project_record.id, v_tag_id)
                ON CONFLICT (project_id, tag_id) DO NOTHING;
            END IF;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 5. Set NOT NULL constraints on the new columns
ALTER TABLE project ALTER COLUMN status_id SET NOT NULL;
ALTER TABLE project ALTER COLUMN type_id SET NOT NULL;

-- 6. Verification queries (optional - will show counts)
DO $$
DECLARE
    total_projects integer;
    projects_with_status integer;
    projects_with_type integer;
    total_tag_relations integer;
BEGIN
    SELECT COUNT(*) INTO total_projects FROM project;
    SELECT COUNT(*) INTO projects_with_status FROM project WHERE status_id IS NOT NULL;
    SELECT COUNT(*) INTO projects_with_type FROM project WHERE type_id IS NOT NULL;
    SELECT COUNT(*) INTO total_tag_relations FROM project_tag_relations;

    RAISE NOTICE 'Migration Summary:';
    RAISE NOTICE 'Total projects: %', total_projects;
    RAISE NOTICE 'Projects with status_id: %', projects_with_status;
    RAISE NOTICE 'Projects with type_id: %', projects_with_type;
    RAISE NOTICE 'Total tag relations created: %', total_tag_relations;

    IF projects_with_status != total_projects THEN
        RAISE WARNING 'Some projects missing status_id!';
    END IF;

    IF projects_with_type != total_projects THEN
        RAISE WARNING 'Some projects missing type_id!';
    END IF;
END;
$$ LANGUAGE plpgsql;
