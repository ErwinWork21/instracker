import { useState } from 'react'
import { formatDate } from '../utils'

export default function AlertMonitor({
  allStudents,
  onOpenStudent,
  quickFilter,
  onSelectQuickFilter,
}) {
  const [collapsed, setCollapsed] = useState(false)

  const progressAlertStudents = allStudents.filter(s => s.hasProgressAlert)
  const videoAlertStudents = allStudents.filter(s => s.hasVideoAlert)
  const totalAlertCount = allStudents.filter(s => s.hasProgressAlert || s.hasVideoAlert).length
  const noAlertCount = allStudents.filter(s => !s.hasProgressAlert && !s.hasVideoAlert).length

  return (
    <div className="alert-monitor-card">
      <div className="alert-monitor-header">
        <div className="alert-monitor-title-group">
          <div className="alert-monitor-icon-wrapper">
            {totalAlertCount > 0 ? '🚨' : '✨'}
          </div>
          <div>
            <div className="alert-monitor-title">
              Monitoring Alert & Perhatian
              {totalAlertCount > 0 ? (
                <span className="badge-counter badge-counter-danger">
                  {totalAlertCount} Perlu Tindakan
                </span>
              ) : (
                <span className="badge-counter badge-counter-success">
                  Semua Aman
                </span>
              )}
            </div>
            <p className="alert-monitor-desc">
              Pantau siswa yang memerlukan update progress dan video editing tanpa perlu memeriksa nama satu per satu.
            </p>
          </div>
        </div>

        <button
          className="btn btn-sm btn-ghost"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Tampilkan detail monitor' : 'Sembunyikan detail monitor'}
        >
          {collapsed ? '▼ Tampilkan Detail' : '▲ Ciutkan'}
        </button>
      </div>

      {/* Quick filter pills */}
      <div className="alert-quick-filters">
        <span className="quick-filter-label">Filter Cepat:</span>
        <button
          className={`quick-filter-btn ${quickFilter === 'all' ? 'active' : ''}`}
          onClick={() => onSelectQuickFilter('all')}
        >
          Semua Siswa <span className="pill-count">{allStudents.length}</span>
        </button>
        <button
          className={`quick-filter-btn warning-pill ${quickFilter === 'progress_alert' ? 'active' : ''}`}
          onClick={() => onSelectQuickFilter('progress_alert')}
        >
          ⚠️ Butuh Update Progress <span className="pill-count">{progressAlertStudents.length}</span>
        </button>
        <button
          className={`quick-filter-btn info-pill ${quickFilter === 'video_alert' ? 'active' : ''}`}
          onClick={() => onSelectQuickFilter('video_alert')}
        >
          🎬 Butuh Video Editing <span className="pill-count">{videoAlertStudents.length}</span>
        </button>
        <button
          className={`quick-filter-btn danger-pill ${quickFilter === 'any_alert' ? 'active' : ''}`}
          onClick={() => onSelectQuickFilter('any_alert')}
        >
          🚨 Semua Alert <span className="pill-count">{totalAlertCount}</span>
        </button>
        <button
          className={`quick-filter-btn success-pill ${quickFilter === 'no_alert' ? 'active' : ''}`}
          onClick={() => onSelectQuickFilter('no_alert')}
        >
          ✓ Tanpa Alert <span className="pill-count">{noAlertCount}</span>
        </button>
      </div>

      {/* Expanded Alert Sections */}
      {!collapsed && (
        <div className="alert-monitor-grid">
          {/* Section 1: Update Progress Alert */}
          <div className="alert-panel alert-panel-progress">
            <div className="alert-panel-header">
              <div className="alert-panel-title">
                <span className="panel-icon">⚠️</span>
                <span>Update Progress (Laporan Perkembangan)</span>
              </div>
              <span className={`panel-badge ${progressAlertStudents.length > 0 ? 'badge-warning' : 'badge-neutral'}`}>
                {progressAlertStudents.length} Siswa
              </span>
            </div>
            <div className="alert-panel-criteria">
              Kriteria: Absensi ≥ 8/10 dan status laporan masih On Progress
            </div>

            <div className="alert-student-list">
              {progressAlertStudents.length === 0 ? (
                <div className="alert-empty-state">
                  <span>✓</span> Tidak ada update progress yang tertunda
                </div>
              ) : (
                progressAlertStudents.map(student => (
                  <div key={student.id} className="alert-student-item">
                    <div className="alert-student-info">
                      <div className="alert-student-name">{student.name}</div>
                      <div className="alert-student-meta">
                        <span>{student.program}</span>
                        <span className="dot">•</span>
                        <span>{student.activeTerm?.term_number || 'Term —'}</span>
                        <span className="dot">•</span>
                        <span className="att-highlight">
                          Absensi: {student.attendanceCount} / 10
                        </span>
                      </div>
                    </div>
                    <button
                      className="btn btn-sm btn-primary-outline"
                      onClick={() => onOpenStudent(student, 'Progress Update')}
                    >
                      Buka Progress →
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section 2: Video Progress / Video Editing Alert */}
          <div className="alert-panel alert-panel-video">
            <div className="alert-panel-header">
              <div className="alert-panel-title">
                <span className="panel-icon">🎬</span>
                <span>Video Progress (Video Editing)</span>
              </div>
              <span className={`panel-badge ${videoAlertStudents.length > 0 ? 'badge-info' : 'badge-neutral'}`}>
                {videoAlertStudents.length} Siswa
              </span>
            </div>
            <div className="alert-panel-criteria">
              Kriteria: Lesson 10 sudah selesai dan video editing masih On Progress
            </div>

            <div className="alert-student-list">
              {videoAlertStudents.length === 0 ? (
                <div className="alert-empty-state">
                  <span>✓</span> Tidak ada video editing yang tertunda
                </div>
              ) : (
                videoAlertStudents.map(student => {
                  const lesson10 = student.lessons?.find(l => l.lesson_number === 10)
                  return (
                    <div key={student.id} className="alert-student-item">
                      <div className="alert-student-info">
                        <div className="alert-student-name">{student.name}</div>
                        <div className="alert-student-meta">
                          <span>{student.program}</span>
                          <span className="dot">•</span>
                          <span>{student.activeTerm?.term_number || 'Term —'}</span>
                          {lesson10?.attendance_at && (
                            <>
                              <span className="dot">•</span>
                              <span className="video-date-highlight">
                                Lesson 10: {formatDate(lesson10.attendance_at)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        className="btn btn-sm btn-info-outline"
                        onClick={() => onOpenStudent(student, 'Video Editing')}
                      >
                        Buka Video →
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
