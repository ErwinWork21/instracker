import { useState } from 'react'
import { supabase } from '../supabase'
import { formatDateTime } from '../utils'
import toast from 'react-hot-toast'

export default function LessonsTab({ lessons, attendanceCount, termId, onRefresh }) {
  const [updating, setUpdating] = useState(null)

  const isUnlocked = attendanceCount >= 8

  const handleToggle = async (lesson) => {
    if ([9, 10].includes(lesson.lesson_number) && !isUnlocked && !lesson.attendance) {
      toast.error('Complete 8 attendances first to unlock Lesson 9 & 10')
      return
    }

    setUpdating(lesson.id)
    try {
      const newAttendance = !lesson.attendance
      const now = new Date().toISOString()
      const { error } = await supabase
        .from('lessons')
        .update({
          attendance: newAttendance,
          attendance_at: newAttendance ? now : null,
          updated_at: now,
        })
        .eq('id', lesson.id)

      if (error) throw error
      await onRefresh()
    } catch (err) {
      toast.error('Error updating attendance: ' + err.message)
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 16 }}>
      {/* Unlock status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {isUnlocked
            ? '🔓 Lesson 9 & 10 unlocked (8+ attendances)'
            : `🔒 ${8 - attendanceCount} more attendance(s) needed to unlock Lesson 9 & 10`}
        </span>
        <span style={{
          fontSize: '0.9rem', fontWeight: 700,
          color: isUnlocked ? 'var(--success)' : 'var(--text-secondary)'
        }}>
          {attendanceCount} / 10
        </span>
      </div>

      {/* Attendance progress bar */}
      <div className="attendance-bar">
        <div className="attendance-bar-track">
          <div
            className={`attendance-bar-fill${isUnlocked ? ' complete' : ''}`}
            style={{ width: `${Math.min((attendanceCount / 10) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Lessons grid */}
      <div className="lessons-grid">
        {lessons.map(lesson => {
          const isLocked = [9, 10].includes(lesson.lesson_number) && !isUnlocked
          const isChecked = lesson.attendance
          const isLoading = updating === lesson.id

          return (
            <div
              key={lesson.id}
              className={`lesson-cell${isChecked ? ' checked' : ''}${isLocked ? ' locked' : ''}`}
            >
              <div className="lesson-number">Lesson {lesson.lesson_number}</div>
              {isLocked ? (
                <div className="lesson-lock-icon" data-tooltip="Complete 8 attendances to unlock">🔒</div>
              ) : (
                <label className="lesson-checkbox">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={isLoading}
                    onChange={() => handleToggle(lesson)}
                    id={`lesson-${lesson.id}`}
                  />
                  <span style={{ color: isChecked ? 'var(--success)' : 'var(--text-secondary)' }}>
                    {isLoading ? '…' : isChecked ? 'Present' : 'Absent'}
                  </span>
                </label>
              )}
              {isChecked && lesson.attendance_at && (
                <div className="lesson-time">{formatDateTime(lesson.attendance_at)}</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
