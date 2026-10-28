import { useState } from 'react'
import { supabase } from '../supabase'
import { formatDateTime, formatDate, shouldShowVideoEditingAlert, computeTermStatus } from '../utils'
import toast from 'react-hot-toast'

export default function VideoTab({ videoEditing, lesson10, showAlert, studentId, termId, termData, onRefresh }) {
  const [saving, setSaving] = useState(false)

  const lesson10Done = lesson10?.attendance === true
  const lesson10Date = lesson10?.attendance_at

  const handleStatusChange = async (newStatus) => {
    if (!videoEditing) {
      toast.error('No video editing record found')
      return
    }
    setSaving(true)
    try {
      const now = new Date().toISOString()

      // 1. Update video_editing record
      const { error: veErr } = await supabase
        .from('video_editing')
        .update({ status: newStatus, updated_at: now })
        .eq('id', videoEditing.id)
      if (veErr) throw veErr

      // 2. Synchronize Term Status (Completed, Graduate for Term 4, or On Progress)
      const companionProgressStatus = termData?.progress_updates?.[0]?.status
      const targetTermStatus = computeTermStatus(termData?.term_number, companionProgressStatus, newStatus)
      const completedAt = (targetTermStatus === 'Completed' || targetTermStatus === 'Graduate') ? now : null

      const { error: termErr } = await supabase
        .from('terms')
        .update({ status: targetTermStatus, completed_at: completedAt, updated_at: now })
        .eq('id', termId)
      if (termErr) {
        console.warn('Could not update term status on terms table:', termErr)
      }

      if (targetTermStatus === 'Graduate') {
        toast.success(`Video Editing set to ${newStatus} · Status Term 4 menjadi Graduate! 🎓`)
      } else if (targetTermStatus === 'Completed') {
        toast.success(`Video Editing set to ${newStatus} · Status ${termData?.term_number || 'Term'} menjadi Completed! ✓`)
      } else {
        toast.success(`Video Editing set to ${newStatus}`)
      }

      await onRefresh()
    } catch (err) {
      toast.error('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 16 }}>
      {/* Lesson 10 status */}
      <div className="card">
        <div className="form-label" style={{ marginBottom: 8 }}>Lesson 10 Status</div>
        {lesson10Done ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div className="alert-badge alert-badge-success" style={{ width: 'fit-content' }}>
              ✓ Lesson 10 completed
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              Attendance: {formatDateTime(lesson10Date)}
            </div>
            {lesson10Date && (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Video Editing alert from: {formatDate(new Date(new Date(lesson10Date).getTime() + 86400000).toISOString())}
              </div>
            )}
          </div>
        ) : (
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            🔒 Lesson 10 not yet completed. Complete Lesson 10 attendance to enable Video Editing tracking.
          </div>
        )}
      </div>

      {/* Alert */}
      {showAlert ? (
        <div className="alert-badge alert-badge-info" style={{ fontSize: '0.9rem', padding: '10px 16px' }}>
          🎬 Video Editing is required — H+1 after Lesson 10
        </div>
      ) : lesson10Done && !showAlert ? (
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span>⏰</span>
          <span>Video Editing alert will appear the day after Lesson 10 attendance.</span>
        </div>
      ) : null}

      {/* Current status */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div className="form-label" style={{ marginBottom: 6 }}>Current Status</div>
            <span className={`status-pill ${videoEditing?.status === 'Completed' ? 'status-completed' : 'status-on-progress'}`}>
              {videoEditing?.status === 'Completed' ? '✓ Completed' : '◷ On Progress'}
            </span>
          </div>
          {videoEditing?.updated_at && (
            <div style={{ textAlign: 'right' }}>
              <div className="form-label">Last Updated</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                {formatDateTime(videoEditing.updated_at)}
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="form-label" style={{ marginBottom: 8 }}>Change Status</div>
          <div className="status-selector">
            <button
              className={`status-option${videoEditing?.status === 'On Progress' ? ' active-on-progress' : ''}`}
              onClick={() => handleStatusChange('On Progress')}
              disabled={saving}
            >
              ◷ On Progress
            </button>
            <button
              className={`status-option${videoEditing?.status === 'Completed' ? ' active-completed' : ''}`}
              onClick={() => handleStatusChange('Completed')}
              disabled={saving}
            >
              ✓ Completed
            </button>
          </div>
        </div>
      </div>

      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', background: 'var(--bg-input)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
        💡 <strong>Aturan Status Term:</strong> Jika Progress Update dan Video Editing keduanya <em>Completed</em>, status term otomatis menjadi <strong>Completed</strong> (atau <strong>Graduate 🎓</strong> jika di Term 4).
      </div>
    </div>
  )
}

