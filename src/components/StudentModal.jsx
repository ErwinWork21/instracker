import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { formatDateTime, formatDate, shouldShowVideoEditingAlert, countAttendance } from '../utils'
import { TERMS } from '../config'
import LessonsTab from './LessonsTab'
import ProgressTab from './ProgressTab'
import VideoTab from './VideoTab'
import NotesTab from './NotesTab'
import toast from 'react-hot-toast'

const TABS = ['Lessons', 'Progress Update', 'Video Editing', "Teacher's Notes"]

export default function StudentModal({ student: initialStudent, onClose, onRefresh }) {
  const [tab, setTab] = useState('Lessons')
  const [student, setStudent] = useState(initialStudent)
  const [terms, setTerms] = useState([])
  const [selectedTermId, setSelectedTermId] = useState(initialStudent.active_term_id)
  const [termData, setTermData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [addingTerm, setAddingTerm] = useState(false)

  const loadStudentData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: studentFresh } = await supabase
        .from('students')
        .select('*')
        .eq('id', initialStudent.id)
        .single()
      if (studentFresh) setStudent(studentFresh)

      const { data: termsData } = await supabase
        .from('terms')
        .select('*')
        .eq('student_id', initialStudent.id)
        .order('created_at')
      setTerms(termsData || [])

      const termId = selectedTermId || studentFresh?.active_term_id
      if (termId) {
        const { data: term } = await supabase
          .from('terms')
          .select(`
            *,
            lessons ( * ),
            progress_updates ( * ),
            video_editing ( * )
          `)
          .eq('id', termId)
          .single()
        setTermData(term)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [initialStudent.id, selectedTermId])

  useEffect(() => { loadStudentData() }, [loadStudentData])

  const handleTermChange = (termId) => {
    setSelectedTermId(termId)
  }

  const handleAddTerm = async () => {
    // Find next term not yet used
    const usedTerms = terms.map(t => t.term_number)
    const nextTerm = TERMS.find(t => !usedTerms.includes(t))
    if (!nextTerm) { toast.error('All terms already created'); return }

    setAddingTerm(true)
    try {
      const { data: newTerm, error: termErr } = await supabase
        .from('terms')
        .insert({ student_id: student.id, term_number: nextTerm, status: 'On Progress' })
        .select()
        .single()
      if (termErr) throw termErr

      const lessons = Array.from({ length: 10 }, (_, i) => ({
        term_id: newTerm.id,
        lesson_number: i + 1,
        attendance: false,
      }))
      await supabase.from('lessons').insert(lessons)
      await supabase.from('progress_updates').insert({ student_id: student.id, term_id: newTerm.id, status: 'On Progress' })
      await supabase.from('video_editing').insert({ student_id: student.id, term_id: newTerm.id, status: 'On Progress' })

      // Set new term as active
      await supabase.from('students').update({ active_term_id: newTerm.id }).eq('id', student.id)

      toast.success(`${nextTerm} created and set as active!`)
      setSelectedTermId(newTerm.id)
      await loadStudentData()
    } catch (err) {
      toast.error('Error creating term: ' + err.message)
    } finally {
      setAddingTerm(false)
    }
  }

  const handleSetActiveTerm = async (termId) => {
    try {
      await supabase.from('students').update({ active_term_id: termId }).eq('id', student.id)
      toast.success('Active term updated')
      await loadStudentData()
    } catch (err) {
      toast.error('Error: ' + err.message)
    }
  }

  const lessons = termData?.lessons?.sort((a, b) => a.lesson_number - b.lesson_number) || []
  const attendanceCount = countAttendance(lessons)
  const progressUpdate = termData?.progress_updates?.[0]
  const videoEditing = termData?.video_editing?.[0]
  const lesson10 = lessons.find(l => l.lesson_number === 10)
  const showVideoAlert = shouldShowVideoEditingAlert(lesson10?.attendance_at)

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-wide">
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="modal-title">{student.name}</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span className="tag tag-accent">{student.program}</span>
              <span className="tag">{student.foundation}</span>
              {termData && (
                <span className="tag" style={{ color: 'var(--text-secondary)' }}>
                  {termData.term_number}
                </span>
              )}
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>

        {/* Term selector */}
        <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="form-label" style={{ marginRight: 4 }}>Term:</span>
          {terms.map(t => (
            <button
              key={t.id}
              className={`btn btn-sm ${selectedTermId === t.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleTermChange(t.id)}
            >
              {t.term_number}
              {student.active_term_id === t.id && <span style={{ fontSize: '0.7rem', opacity: 0.8 }}> (active)</span>}
            </button>
          ))}
          {selectedTermId !== student.active_term_id && (
            <button className="btn btn-sm btn-success" onClick={() => handleSetActiveTerm(selectedTermId)}>
              Set as Active
            </button>
          )}
          <button className="btn btn-sm btn-ghost" onClick={handleAddTerm} disabled={addingTerm}>
            {addingTerm ? '…' : '+ New Term'}
          </button>
        </div>

        {/* Attendance summary */}
        {!loading && termData && (
          <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div className="stat-item">
              <span className="stat-label">Attendance</span>
              <span className="stat-value" style={{ color: attendanceCount >= 8 ? 'var(--success)' : 'var(--text-primary)' }}>
                {attendanceCount} / 10
              </span>
            </div>
            {attendanceCount >= 8 && progressUpdate?.status !== 'Completed' && (
              <div className="alert-badge alert-badge-warning">⚠ Progress Update Required</div>
            )}
            {showVideoAlert && videoEditing?.status !== 'Completed' && (
              <div className="alert-badge alert-badge-info">🎬 Video Editing Required</div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="tabs" style={{ margin: '0 24px', paddingTop: 4 }}>
          {TABS.map(t => (
            <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ padding: '0 24px 24px' }}>
          {loading ? (
            <div className="loading"><div className="spinner" /><span>Loading…</span></div>
          ) : !termData ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <p>No term data available</p>
            </div>
          ) : (
            <>
              {tab === 'Lessons' && (
                <LessonsTab
                  lessons={lessons}
                  attendanceCount={attendanceCount}
                  termId={termData.id}
                  onRefresh={loadStudentData}
                />
              )}
              {tab === 'Progress Update' && (
                <ProgressTab
                  progressUpdate={progressUpdate}
                  attendanceCount={attendanceCount}
                  studentId={student.id}
                  termId={termData.id}
                  onRefresh={loadStudentData}
                />
              )}
              {tab === 'Video Editing' && (
                <VideoTab
                  videoEditing={videoEditing}
                  lesson10={lesson10}
                  showAlert={showVideoAlert}
                  studentId={student.id}
                  termId={termData.id}
                  onRefresh={loadStudentData}
                />
              )}
              {tab === "Teacher's Notes" && (
                <NotesTab
                  studentId={student.id}
                  termId={termData.id}
                  activeTermId={student.active_term_id}
                  terms={terms}
                  lessons={lessons}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
