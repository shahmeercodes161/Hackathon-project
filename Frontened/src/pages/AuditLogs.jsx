import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { commsService } from '../services/api';
import { Shield, Filter, Eye, X, Terminal, Clock, CheckCircle2 } from 'lucide-react';
import './AuditLogs.css';

export default function AuditLogs() {
  const { role } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedEntity, setSelectedEntity] = useState('All');
  const [selectedAction, setSelectedAction] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // JSON Diff Modal
  const [inspectLog, setInspectLog] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await commsService.getAuditLogs({
        entity: selectedEntity,
        action: selectedAction,
        page,
        limit: 25,
      });
      if (res.success) {
        setLogs(res.logs || []);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error('Audit logs error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedEntity, selectedAction, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="audit-container">
      <div className="audit-header">
        <div>
          <h1>Immutable System Audit Trail</h1>
          <p>
            Cryptographically logged record of all create, update, approve, and finalize operations. Read-only and permanent.
          </p>
        </div>

        {/* Filters */}
        <div className="audit-filters-bar">
          <div className="filter-select-wrapper">
            <Filter size={14} className="filter-icon" />
            <select value={selectedEntity} onChange={(e) => { setSelectedEntity(e.target.value); setPage(1); }}>
              <option value="All">All Entities</option>
              <option value="Company">Company</option>
              <option value="Employee">Employee</option>
              <option value="Attendance">Attendance</option>
              <option value="Leave">Leave</option>
              <option value="Payroll">Payroll</option>
              <option value="User">User</option>
              <option value="Department">Department</option>
            </select>
          </div>

          <div className="filter-select-wrapper">
            <Filter size={14} className="filter-icon" />
            <select value={selectedAction} onChange={(e) => { setSelectedAction(e.target.value); setPage(1); }}>
              <option value="All">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="APPROVE">APPROVE</option>
              <option value="REJECT">REJECT</option>
              <option value="FINALIZE">FINALIZE</option>
              <option value="DELETE">DELETE</option>
              <option value="LOGIN">LOGIN</option>
            </select>
          </div>
        </div>
      </div>

      <div className="audit-table-card">
        <div className="table-responsive">
          <table className="audit-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor (User)</th>
                <th>Role</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Description</th>
                <th>Inspect State</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="table-empty">Loading audit records...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan="7" className="table-empty">No audit logs matching filters.</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id}>
                    <td>
                      <span className="timestamp-badge">
                        <Clock size={12} />
                        {new Date(log.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </td>
                    <td>
                      <div className="actor-col">
                        <strong>{log.actor?.name}</strong>
                        <span className="text-muted">{log.actor?.email}</span>
                      </div>
                    </td>
                    <td><span className={`pill-role ${log.actor?.role}`}>{log.actor?.role}</span></td>
                    <td><span className="action-tag">{log.action}</span></td>
                    <td><strong>{log.entity}</strong></td>
                    <td>{log.description}</td>
                    <td>
                      {(log.before || log.after) ? (
                        <button className="inspect-btn" onClick={() => setInspectLog(log)}>
                          <Terminal size={12} /> JSON State
                        </button>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON State Diff Modal */}
      {inspectLog && (
        <div className="modal-overlay" onClick={() => setInspectLog(null)}>
          <div className="modal-card wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Audit State Snapshot: {inspectLog.action} {inspectLog.entity}</h3>
              <button className="modal-close-btn" onClick={() => setInspectLog(null)}><X size={18} /></button>
            </div>

            <p className="modal-info">
              Logged by <strong>{inspectLog.actor?.name}</strong> ({inspectLog.actor?.email}) on {new Date(inspectLog.createdAt).toLocaleString()}
            </p>

            <div className="diff-view-grid">
              <div className="diff-col">
                <span className="diff-title">State Before Action</span>
                <pre className="json-pre">
                  {inspectLog.before ? JSON.stringify(inspectLog.before, null, 2) : '(Initial creation / None)'}
                </pre>
              </div>
              <div className="diff-col">
                <span className="diff-title green">State After Action</span>
                <pre className="json-pre green">
                  {inspectLog.after ? JSON.stringify(inspectLog.after, null, 2) : '(None)'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
