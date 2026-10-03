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

-- =============================================
-- TERMS
-- =============================================
CREATE TABLE IF NOT EXISTS terms (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  term_number  TEXT NOT NULL CHECK (term_number IN ('Term 1', 'Term 2', 'Term 3', 'Term 4')),
  status       TEXT NOT NULL DEFAULT 'On Progress' CHECK (status IN ('On Progress', 'Completed')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Now add FK constraint on students.active_term_id
ALTER TABLE students
  ADD CONSTRAINT fk_students_active_term
  FOREIGN KEY (active_term_id)
  REFERENCES terms(id)
  ON DELETE SET NULL;

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

CREATE TRIGGER trg_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_terms_updated_at
  BEFORE UPDATE ON terms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_lessons_updated_at
  BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_teacher_notes_updated_at
  BEFORE UPDATE ON teacher_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

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
CREATE POLICY "allow_all_students" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_terms" ON terms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_lessons" ON lessons FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_progress_updates" ON progress_updates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_video_editing" ON video_editing FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_teacher_notes" ON teacher_notes FOR ALL USING (true) WITH CHECK (true);
