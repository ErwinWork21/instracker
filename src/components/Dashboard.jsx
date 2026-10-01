import { PROGRAMS, TERM_OPTIONS } from '../config'
import StudentCard from './StudentCard'

export default function Dashboard({
  students, allStudents, loading,
  search, setSearch,
  filterProgram, setFilterProgram,
  filterTerm, setFilterTerm,
  filterStatus, setFilterStatus,
  filterAlert, setFilterAlert,
  onSelectStudent,
}) {
  const alertCount = allStudents.filter(s => s.hasProgressAlert || s.hasVideoAlert).length

  return (
    <div className="fade-in">
      {/* Stats summary */}
      <div className="section-header">
        <div>
          <h2 className="section-title">Students</h2>
          <p className="section-subtitle">
            {allStudents.length} total · {alertCount > 0 ? `${alertCount} need attention` : 'All clear ✓'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <input
          className="input"
          placeholder="🔍  Search student..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="select" value={filterProgram} onChange={e => setFilterProgram(e.target.value)}>
          <option value="">All Programs</option>
          {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="select" value={filterTerm} onChange={e => setFilterTerm(e.target.value)}>
          <option value="">All Terms</option>
          {TERM_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="On Progress">On Progress</option>
          <option value="Completed">Completed</option>
        </select>
        <select className="select" value={filterAlert} onChange={e => setFilterAlert(e.target.value)}>
          <option value="">All Alerts</option>
          <option value="any">Has Alert</option>
          <option value="progress">Progress Alert</option>
          <option value="video">Video Alert</option>
          <option value="none">No Alerts</option>
        </select>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner" />
          <span>Loading students…</span>
        </div>
      ) : students.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎓</div>
          <p className="empty-state-text">No students found</p>
          <p className="empty-state-sub">Try adjusting your filters or add a new student</p>
        </div>
      ) : (
        <div className="students-grid">
          {students.map(student => (
            <StudentCard
              key={student.id}
              student={student}
              onClick={() => onSelectStudent(student)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
