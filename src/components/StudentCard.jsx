import { countAttendance } from '../utils'

export default function StudentCard({ student, onClick }) {
  const {
    name, program, activeTerm,
    attendanceCount, hasProgressAlert, hasVideoAlert,
  } = student

  const termLabel = activeTerm?.term_number || '—'
  const totalAttendance = attendanceCount
  const maxAttendance = 10
  const fillPct = Math.min((totalAttendance / maxAttendance) * 100, 100)
  const isComplete = totalAttendance >= 8

  // Find highest attended lesson for "Current Lesson" display
  const attendedLessons = (student.lessons || [])
    .filter(l => l.attendance)
    .sort((a, b) => b.lesson_number - a.lesson_number)
  const currentLesson = attendedLessons[0]?.lesson_number ?? '—'

  return (
    <div className="student-card" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}>
      <div>
        <div className="student-card-name">{name}</div>
        <div className="student-card-meta">
          <span>{program || '—'}</span>
          <span className="dot">•</span>
          <span>{termLabel}</span>
        </div>
      </div>

      <div>
        <div className="attendance-bar">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="form-label">Attendance</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: isComplete ? 'var(--success)' : 'var(--text-secondary)' }}>
              {totalAttendance} / {maxAttendance}
            </span>
          </div>
          <div className="attendance-bar-track">
            <div
              className={`attendance-bar-fill${isComplete ? ' complete' : ''}`}
              style={{ width: `${fillPct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="student-card-stats">
        <div className="stat-item">
          <span className="stat-label">Current Lesson</span>
          <span className="stat-value">
            {currentLesson !== '—' ? `Lesson ${currentLesson}` : '—'}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Term Status</span>
          <span className="stat-value" style={{ color: activeTerm?.status === 'Completed' ? 'var(--success)' : 'var(--warning)' }}>
            {activeTerm?.status || '—'}
          </span>
        </div>
      </div>

      <div className="student-card-alerts">
        {hasProgressAlert && (
          <div className="alert-badge alert-badge-warning">
            ⚠ Progress Update Required
          </div>
        )}
        {hasVideoAlert && (
          <div className="alert-badge alert-badge-info">
            🎬 Video Editing Required
          </div>
        )}
        {!hasProgressAlert && !hasVideoAlert && (
          <div className="alert-badge alert-badge-success">
            ✓ No Alerts
          </div>
        )}
      </div>
    </div>
  )
}
