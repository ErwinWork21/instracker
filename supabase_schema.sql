-- =============================================
-- Teacher Tracker — Supabase SQL Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- STUDENTS
-- =============================================
CREATE TABLE IF NOT EXISTS students (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  program       TEXT NOT NULL CHECK (program IN ('Kinder', 'Junior')),
  active_term_id UUID,   -- FK added after terms table
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Drop the old foundation column if it still exists from a previous run
ALTER TABLE students DROP COLUMN IF EXISTS foundation;

-- =============================================
-- TERMS
-- =============================================
CREATE TABLE IF NOT EXISTS terms (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  term_number  TEXT NOT NULL CHECK (term_number IN ('Foundation', 'Foundation 1', 'Foundation 2', 'Term 1', 'Term 2', 'Term 3', 'Term 4')),
  status       TEXT NOT NULL DEFAULT 'On Progress' CHECK (status IN ('On Progress', 'Completed', 'Graduate')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Ensure terms_term_number_check constraint allows Foundation terms if table already exists
ALTER TABLE terms DROP CONSTRAINT IF EXISTS terms_term_number_check;
ALTER TABLE terms ADD CONSTRAINT terms_term_number_check 
  CHECK (term_number IN ('Foundation', 'Foundation 1', 'Foundation 2', 'Term 1', 'Term 2', 'Term 3', 'Term 4'));

-- Ensure terms_status_check constraint allows 'Graduate' status (for Term 4 completions)
ALTER TABLE terms DROP CONSTRAINT IF EXISTS terms_status_check;
ALTER TABLE terms ADD CONSTRAINT terms_status_check 
  CHECK (status IN ('On Progress', 'Completed', 'Graduate'));


-- Now add FK constraint on students.active_term_id idempotently
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_students_active_term' 
      AND table_name = 'students'
  ) THEN
    ALTER TABLE students
      ADD CONSTRAINT fk_students_active_term
      FOREIGN KEY (active_term_id)
      REFERENCES terms(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- =============================================
-- LESSONS
-- =============================================
CREATE TABLE IF NOT EXISTS lessons (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term_id        UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
  lesson_number  INT NOT NULL CHECK (lesson_number BETWEEN 1 AND 10),
  attendance     BOOLEAN NOT NULL DEFAULT FALSE,
  attendance_at  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (term_id, lesson_number)
);

-- =============================================
-- PROGRESS UPDATES
-- =============================================
CREATE TABLE IF NOT EXISTS progress_updates (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  term_id    UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
  status     TEXT NOT NULL DEFAULT 'On Progress' CHECK (status IN ('On Progress', 'Completed')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, term_id)
);

-- =============================================
-- VIDEO EDITING
-- =============================================
CREATE TABLE IF NOT EXISTS video_editing (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  term_id    UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
  status     TEXT NOT NULL DEFAULT 'On Progress' CHECK (status IN ('On Progress', 'Completed')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, term_id)
);

-- =============================================
-- TEACHER NOTES
-- =============================================
CREATE TABLE IF NOT EXISTS teacher_notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  term_id    UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
  lesson_id  UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  note       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- AUTO-UPDATE updated_at TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_students_updated_at ON students;
CREATE TRIGGER trg_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_terms_updated_at ON terms;
CREATE TRIGGER trg_terms_updated_at
  BEFORE UPDATE ON terms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_lessons_updated_at ON lessons;
CREATE TRIGGER trg_lessons_updated_at
  BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_teacher_notes_updated_at ON teacher_notes;
CREATE TRIGGER trg_teacher_notes_updated_at
  BEFORE UPDATE ON teacher_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- AUTO-SYNC TERM STATUS (Completed / Graduate)
-- When both progress_updates and video_editing are Completed:
-- - Term 4 becomes 'Graduate'
-- - Foundation 1-2 & Term 1-3 become 'Completed'
-- Otherwise becomes 'On Progress'
-- =============================================
CREATE OR REPLACE FUNCTION sync_term_status()
RETURNS TRIGGER AS $$
DECLARE
  v_term_id UUID;
  v_term_number TEXT;
  v_pu_status TEXT;
  v_ve_status TEXT;
  v_new_status TEXT;
BEGIN
  v_term_id := NEW.term_id;

  SELECT term_number INTO v_term_number FROM terms WHERE id = v_term_id;
  SELECT status INTO v_pu_status FROM progress_updates WHERE term_id = v_term_id LIMIT 1;
  SELECT status INTO v_ve_status FROM video_editing WHERE term_id = v_term_id LIMIT 1;

  IF v_pu_status = 'Completed' AND v_ve_status = 'Completed' THEN
    IF v_term_number = 'Term 4' THEN
      v_new_status := 'Graduate';
    ELSE
      v_new_status := 'Completed';
    END IF;
    UPDATE terms
      SET status = v_new_status,
          completed_at = COALESCE(completed_at, NOW()),
          updated_at = NOW()
      WHERE id = v_term_id;
  ELSE
    UPDATE terms
      SET status = 'On Progress',
          completed_at = NULL,
          updated_at = NOW()
      WHERE id = v_term_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_term_status_pu ON progress_updates;
CREATE TRIGGER trg_sync_term_status_pu
  AFTER INSERT OR UPDATE OF status ON progress_updates
  FOR EACH ROW EXECUTE FUNCTION sync_term_status();

DROP TRIGGER IF EXISTS trg_sync_term_status_ve ON video_editing;
CREATE TRIGGER trg_sync_term_status_ve
  AFTER INSERT OR UPDATE OF status ON video_editing
  FOR EACH ROW EXECUTE FUNCTION sync_term_status();

-- Sync any existing terms where both progress_updates and video_editing are already completed
UPDATE terms t
SET status = CASE WHEN t.term_number = 'Term 4' THEN 'Graduate' ELSE 'Completed' END,
    completed_at = COALESCE(t.completed_at, NOW())
FROM progress_updates pu, video_editing ve
WHERE pu.term_id = t.id 
  AND ve.term_id = t.id 
  AND pu.status = 'Completed' 
  AND ve.status = 'Completed';


-- =============================================
-- ROW LEVEL SECURITY (basic — adjust as needed)
-- =============================================
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_editing ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_notes ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated and anon (adjust for auth later)
DROP POLICY IF EXISTS "allow_all_students" ON students;
CREATE POLICY "allow_all_students" ON students FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_terms" ON terms;
CREATE POLICY "allow_all_terms" ON terms FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_lessons" ON lessons;
CREATE POLICY "allow_all_lessons" ON lessons FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_progress_updates" ON progress_updates;
CREATE POLICY "allow_all_progress_updates" ON progress_updates FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_video_editing" ON video_editing;
CREATE POLICY "allow_all_video_editing" ON video_editing FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_teacher_notes" ON teacher_notes;
CREATE POLICY "allow_all_teacher_notes" ON teacher_notes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- =============================================
-- PERMISSIONS (GRANT)
-- Required so anon & authenticated roles can access tables
-- =============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT ALL ON TABLE students TO anon, authenticated;
GRANT ALL ON TABLE terms TO anon, authenticated;
GRANT ALL ON TABLE lessons TO anon, authenticated;
GRANT ALL ON TABLE progress_updates TO anon, authenticated;
GRANT ALL ON TABLE video_editing TO anon, authenticated;
GRANT ALL ON TABLE teacher_notes TO anon, authenticated;

GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated;

