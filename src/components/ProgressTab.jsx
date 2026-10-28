import { useState } from 'react'
import { supabase } from '../supabase'
import { formatDateTime, computeTermStatus } from '../utils'
import toast from 'react-hot-toast'

export default function ProgressTab({ progressUpdate, attendanceCount, studentId, termId, termData, onRefresh }) {
  const [saving, setSaving] = useState(false)
  const alertActive = attendanceCount >= 8

  const handleStatusChange = async (newStatus) => {
    if (!progressUpdate) {
      toast.error('No progress update record found')
      return
    }
    setSaving(true)
    try {
      const now = new Date().toISOString()

      // 1. Update progress_updates record
      const { error: puErr } = await supabase
        .from('progress_updates')
        .update({ status: newStatus, updated_at: now })
        .eq('id', progressUpdate.id)
      if (puErr) throw puErr

      // 2. Synchronize Term Status (Completed, Graduate for Term 4, or On Progress)
      const companionVideoStatus = termData?.video_editing?.[0]?.status
      const targetTermStatus = computeTermStatus(termData?.term_number, newStatus, companionVideoStatus)
      const completedAt = (targetTermStatus === 'Completed' || targetTermStatus === 'Graduate') ? now : null

      const { error: termErr } = await supabase
        .from('terms')
        .update({ status: targetTermStatus, completed_at: completedAt, updated_at: now })
        .eq('id', termId)
      if (termErr) {
        console.warn('Could not update term status on terms table:', termErr)
      }

      if (targetTermStatus === 'Graduate') {
        toast.success(`Progress Update set to ${newStatus} · Status Term 4 menjadi Graduate! 🎓`)
      } else if (targetTermStatus === 'Completed') {
        toast.success(`Progress Update set to ${newStatus} · Status ${termData?.term_number || 'Term'} menjadi Completed! ✓`)
      } else {
        toast.success(`Progress Update set to ${newStatus}`)
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
      {/* Alert */}
      {alertActive ? (
        <div className="alert-badge alert-badge-warning" style={{ fontSize: '0.9rem', padding: '10px 16px' }}>
          ⚠ Progress Update is required — 8+ attendances completed
        </div>
      ) : (
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span>📋</span>
          <span>Progress Update alert activates after 8 attendances. Currently: {attendanceCount} / 10</span>
        </div>
      )}

      {/* Current status */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div className="form-label" style={{ marginBottom: 6 }}>Current Status</div>
            <span className={`status-pill ${progressUpdate?.status === 'Completed' ? 'status-completed' : 'status-on-progress'}`}>
              {progressUpdate?.status === 'Completed' ? '✓ Completed' : '◷ On Progress'}
            </span>
          </div>
          {progressUpdate?.updated_at && (
            <div style={{ textAlign: 'right' }}>
              <div className="form-label">Last Updated</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                {formatDateTime(progressUpdate.updated_at)}
              </div>
            </div>
          )}
        </div>

        {/* Change status */}
        <div>
          <div className="form-label" style={{ marginBottom: 8 }}>Change Status</div>
          <div className="status-selector">
            <button
              className={`status-option${progressUpdate?.status === 'On Progress' ? ' active-on-progress' : ''}`}
              onClick={() => handleStatusChange('On Progress')}
              disabled={saving}
            >
              ◷ On Progress
            </button>
            <button
              className={`status-option${progressUpdate?.status === 'Completed' ? ' active-completed' : ''}`}
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

