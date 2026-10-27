import { PROGRAMS, TERM_OPTIONS } from '../config'
import StudentCard from './StudentCard'
import AlertMonitor from './AlertMonitor'

export default function Dashboard({
  students,
  allStudents,
  loading,
  search,
  setSearch,
  filterProgram,
  setFilterProgram,
  filterTerm,
  setFilterTerm,
  filterStatus,
  setFilterStatus,
  filterProgressUpdate,
  setFilterProgressUpdate,
  filterVideo,
  setFilterVideo,
  quickFilter,
  setQuickFilter,
  onResetFilters,
  onSelectStudent,
}) {
  const alertCount = allStudents.filter(s => s.hasProgressAlert || s.hasVideoAlert).length
  const isFiltered = Boolean(
    search ||
    filterProgram ||
    filterTerm ||
    filterStatus ||
    filterProgressUpdate ||
    filterVideo ||
    quickFilter !== 'all'
  )

  const handleProgressFilterChange = (val) => {
    setFilterProgressUpdate(val)
    if (val && quickFilter !== 'all') {
      setQuickFilter('all')
    }
  }

  const handleVideoFilterChange = (val) => {
    setFilterVideo(val)
    if (val && quickFilter !== 'all') {
      setQuickFilter('all')
    }
  }

  const handleQuickFilterSelect = (key) => {
    setQuickFilter(key)
    // Clear dropdown-specific alert filters when quick filter is used
    if (key !== 'all') {
      setFilterProgressUpdate('')
      setFilterVideo('')
    }
  }

  return (
    <div className="fade-in">
      {/* Alert Monitoring Section */}
      <AlertMonitor
        allStudents={allStudents}
        onOpenStudent={onSelectStudent}
        quickFilter={quickFilter}
        onSelectQuickFilter={handleQuickFilterSelect}
      />

      {/* Stats summary & Section title */}
      <div className="section-header" style={{ marginTop: '24px' }}>
        <div>
          <h2 className="section-title">Daftar Siswa</h2>
          <p className="section-subtitle">
            {allStudents.length} siswa terdaftar · {alertCount > 0 ? `${alertCount} memerlukan perhatian` : 'Semua aman ✓'}
          </p>
        </div>
        {isFiltered && (
          <button className="btn btn-sm btn-ghost" onClick={onResetFilters}>
            ↺ Reset Semua Filter
          </button>
        )}
      </div>

      {/* Filters Bar with separated alert filters */}
      <div className="filters-bar">
        <input
          className="input"
          placeholder="🔍  Cari nama siswa..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="select" value={filterProgram} onChange={e => setFilterProgram(e.target.value)}>
          <option value="">Semua Program</option>
          {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="select" value={filterTerm} onChange={e => setFilterTerm(e.target.value)}>
          <option value="">Semua Term</option>
          {TERM_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Status Term (Semua)</option>
          <option value="On Progress">Term: On Progress</option>
          <option value="Completed">Term: Completed</option>
        </select>

        {/* SEPARATED: Filter Update Progress */}
        <select
          className={`select ${filterProgressUpdate ? 'select-active-warning' : ''}`}
          value={filterProgressUpdate}
          onChange={e => handleProgressFilterChange(e.target.value)}
        >
          <option value="">Update Progress: Semua</option>
          <option value="alert">⚠️ Butuh Update Progress (Alert)</option>
          <option value="completed">✅ Update Progress Selesai</option>
        </select>

        {/* SEPARATED: Filter Video Progress */}
        <select
          className={`select ${filterVideo ? 'select-active-info' : ''}`}
          value={filterVideo}
          onChange={e => handleVideoFilterChange(e.target.value)}
        >
          <option value="">Video Progress: Semua</option>
          <option value="alert">🎬 Butuh Video Editing (Alert)</option>
          <option value="completed">✅ Video Editing Selesai</option>
        </select>
      </div>

      {/* Active filter count note */}
      <div style={{ marginBottom: '16px', fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>
          Menampilkan <strong>{students.length}</strong> dari <strong>{allStudents.length}</strong> siswa
          {isFiltered && <span style={{ color: 'var(--accent-light)', marginLeft: '6px' }}>(Filter aktif)</span>}
        </span>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner" />
          <span>Memuat data siswa…</span>
        </div>
      ) : students.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎓</div>
          <p className="empty-state-text">Tidak ada siswa yang sesuai kriteria filter</p>
          <p className="empty-state-sub">Coba sesuaikan filter Anda atau reset filter untuk melihat semua siswa</p>
          {isFiltered && (
            <button className="btn btn-secondary" style={{ marginTop: '12px' }} onClick={onResetFilters}>
              Reset Filter
            </button>
          )}
        </div>
      ) : (
        <div className="students-grid">
          {students.map(student => (
            <StudentCard
              key={student.id}
              student={student}
              onClick={() => onSelectStudent(student, 'Lessons')}
            />
          ))}
        </div>
      )}
    </div>
  )
}

