import { useState } from 'react'
import { supabase } from '../supabase'
import { PROGRAMS, TERM_OPTIONS } from '../config'
import toast from 'react-hot-toast'

export default function AddStudentModal({ onClose, onSaved }) {
  const [name, setName] = useState('')
  const [termNumber, setTermNumber] = useState(TERM_OPTIONS[0])
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Student name is required'); return }
    setSaving(true)
    try {
      // 1. Create student (no active_term_id yet)
      const { data: studentData, error: studentErr } = await supabase
        .from('students')
        .insert({ name: name.trim() })
        .select()
        .single()
      if (studentErr) throw studentErr

      // 2. Create the first term
      const { data: termData, error: termErr } = await supabase
        .from('terms')
        .insert({ student_id: studentData.id, term_number: termNumber, status: 'On Progress' })
        .select()
        .single()
      if (termErr) throw termErr

      // 3. Create 10 lessons for the term
      const lessons = Array.from({ length: 10 }, (_, i) => ({
        term_id: termData.id,
        lesson_number: i + 1,
        attendance: false,
      }))
      const { error: lessonsErr } = await supabase.from('lessons').insert(lessons)
      if (lessonsErr) throw lessonsErr

      // 4. Create progress_update record
      const { error: puErr } = await supabase.from('progress_updates').insert({
        student_id: studentData.id,
        term_id: termData.id,
        status: 'On Progress',
      })
      if (puErr) throw puErr

      // 5. Create video_editing record
      const { error: veErr } = await supabase.from('video_editing').insert({
        student_id: studentData.id,
        term_id: termData.id,
        status: 'On Progress',
      })
      if (veErr) throw veErr

      // 6. Update student with active_term_id
      const { error: updateErr } = await supabase
        .from('students')
        .update({ active_term_id: termData.id })
        .eq('id', studentData.id)
      if (updateErr) throw updateErr

      toast.success(`${name.trim()} added successfully!`)
      onSaved()
    } catch (err) {
      console.error(err)
      toast.error('Error adding student: ' + (err.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Add New Student</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Student Name</label>
            <input
              className="input"
              placeholder="Enter full name…"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Starting Term</label>
            <select className="select" value={termNumber} onChange={e => setTermNumber(e.target.value)}>
              {TERM_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Add Student'}
          </button>
        </div>
      </div>
    </div>
  )
}
