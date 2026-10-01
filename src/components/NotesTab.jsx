import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { formatDateTime } from '../utils'
import toast from 'react-hot-toast'

export default function NotesTab({ studentId, termId, activeTermId, terms, lessons }) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [noteText, setNoteText] = useState('')
  const [selectedLesson, setSelectedLesson] = useState('')
  const [selectedTermForNote, setSelectedTermForNote] = useState(termId)
  const [saving, setSaving] = useState(false)

  // Load notes for the student
  const loadNotes = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('teacher_notes')
        .select(`
          *,
          lessons ( lesson_number ),
          terms ( term_number )
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
      if (error) throw error
      setNotes(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadNotes() }, [studentId])

  // Load lessons for the selected term for the note form
  const [termLessons, setTermLessons] = useState(lessons)
  useEffect(() => {
    if (selectedTermForNote === termId) {
      setTermLessons(lessons)
    } else {
      // load lessons for selected term
      supabase
        .from('lessons')
        .select('*')
        .eq('term_id', selectedTermForNote)
        .order('lesson_number')
        .then(({ data }) => setTermLessons(data || []))
    }
  }, [selectedTermForNote, termId, lessons])

  const handleSubmit = async () => {
    if (!noteText.trim()) { toast.error('Note cannot be empty'); return }
    if (!selectedLesson) { toast.error('Please select a lesson'); return }
    setSaving(true)
    try {
      const now = new Date().toISOString()
      const { error } = await supabase.from('teacher_notes').insert({
        student_id: studentId,
        term_id: selectedTermForNote,
        lesson_id: selectedLesson,
        note: noteText.trim(),
        created_at: now,
        updated_at: now,
      })
      if (error) throw error
      toast.success('Note saved!')
      setNoteText('')
      setSelectedLesson('')
      await loadNotes()
    } catch (err) {
      toast.error('Error saving note: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 16 }}>
      {/* Add Note Form */}
      <div className="card">
        <div style={{ fontWeight: 600, marginBottom: 14, fontSize: '0.95rem' }}>Add New Note</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="two-col">
            <div className="form-group">
              <label className="form-label">Term</label>
              <select
                className="select"
                value={selectedTermForNote}
                onChange={e => { setSelectedTermForNote(e.target.value); setSelectedLesson('') }}
              >
                {terms.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.term_number}{t.id === activeTermId ? ' (active)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Lesson</label>
              <select
                className="select"
                value={selectedLesson}
                onChange={e => setSelectedLesson(e.target.value)}
              >
                <option value="">Select Lesson…</option>
                {termLessons.map(l => (
                  <option key={l.id} value={l.id}>Lesson {l.lesson_number}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Note</label>
            <textarea
              className="textarea"
              placeholder="Write your note about this lesson…"
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              rows={4}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving…' : 'Submit Note'}
            </button>
          </div>
        </div>
      </div>

      {/* Notes History */}
      <div>
        <div style={{ fontWeight: 600, marginBottom: 12, fontSize: '0.95rem' }}>
          Notes History ({notes.length})
        </div>
        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : notes.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px 0' }}>
            <div className="empty-state-icon">📝</div>
            <p className="empty-state-text">No notes yet</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {notes.map((note, idx) => (
              <div key={note.id} className="note-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className="note-lesson">
                      {note.terms?.term_number} · Lesson {note.lessons?.lesson_number}
                    </span>
                  </div>
                  <span className="note-meta">{formatDateTime(note.created_at)}</span>
                </div>
                <div className="note-text">{note.note}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
