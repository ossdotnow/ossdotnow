-- Custom SQL migration file, put your code below! ---- Phase 3: Contract - Remove old enum columns and types
-- This migration removes the old enum columns and enum types after successful data migration

-- 1. Drop old enum columns from project table
ALTER TABLE project DROP COLUMN IF EXISTS status;
ALTER TABLE project DROP COLUMN IF EXISTS type;
ALTER TABLE project DROP COLUMN IF EXISTS tags;

-- 2. Drop old enum types (optional - keep commented for rollback safety)
-- DROP TYPE IF EXISTS project_status;
-- DROP TYPE IF EXISTS project_type;
-- DROP TYPE IF EXISTS tags;

-- 3. Verification - ensure foreign keys are working
DO $$
DECLARE
    orphaned_projects integer;
BEGIN
    -- Check for any projects without valid status_id
    SELECT COUNT(*) INTO orphaned_projects
    FROM project p
    LEFT JOIN category_project_statuses s ON p.status_id = s.id
    WHERE s.id IS NULL;

    IF orphaned_projects > 0 THEN
        RAISE WARNING 'Found % projects with invalid status_id references', orphaned_projects;
    END IF;

    -- Check for any projects without valid type_id
    SELECT COUNT(*) INTO orphaned_projects
    FROM project p
    LEFT JOIN category_project_types t ON p.type_id = t.id
    WHERE t.id IS NULL;

    IF orphaned_projects > 0 THEN
        RAISE WARNING 'Found % projects with invalid type_id references', orphaned_projects;
    END IF;

    RAISE NOTICE 'Contract migration verification complete';
END;
$$ LANGUAGE plpgsql;
