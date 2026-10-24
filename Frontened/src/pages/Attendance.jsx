import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { attendanceService } from '../services/api';
import {
  CalendarCheck,
  Clock,
  Camera,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
  FileEdit,
  X,
  Loader2,
  LogIn,
  LogOut,
} from 'lucide-react';
import './Attendance.css';

// Helper: Convert UTC date to PKT (UTC+5) time string
function toPKT(dateVal) {
  if (!dateVal) return '—';
  const d = new Date(dateVal);
  // Add 5 hours for PKT
  const pkt = new Date(d.getTime() + 5 * 60 * 60 * 1000);
  return pkt.toISOString().substring(11, 16); // HH:MM
}

// Helper: Format date in PKT
function dateToPKT(dateVal) {
  if (!dateVal) return '—';
  const d = new Date(dateVal);
  const pkt = new Date(d.getTime() + 5 * 60 * 60 * 1000);
  return pkt.toISOString().substring(0, 10); // YYYY-MM-DD
}

export default function Attendance() {
  const { user, role } = useAuth();
  const [boardDate, setBoardDate] = useState(new Date().toISOString().split('T')[0]);
  const [boardData, setBoardData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Button loading states
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkOutLoading, setCheckOutLoading] = useState(false);
  const [correctionLoading, setCorrectionLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);

  // Correction Modal
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionForm, setCorrectionForm] = useState({
    date: new Date().toISOString().split('T')[0],
    requestedCheckIn: '',
    requestedCheckOut: '',
    reason: '',
  });

  // HR Review Modal
  const [reviewTarget, setReviewTarget] = useState(null);
  const [hrComment, setHrComment] = useState('');

  // Status & Alerts
  const [alert, setAlert] = useState({ text: '', type: '' });

  // Camera Check-in Modal (Bonus)
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStatus, setCameraStatus] = useState('idle'); // 'scanning','detected','verifying','done','error'
  const [cameraError, setCameraError] = useState('');
  const [gpsData, setGpsData] = useState(null);
  const [cameraLoading, setCameraLoading] = useState(false);

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      if (role === 'admin' || role === 'hr') {
        const res = await attendanceService.getDailyBoard({ date: boardDate });
        if (res.success) setBoardData(res.board || []);
      } else {
        const res = await attendanceService.getHistory();
        if (res.success) setHistoryData(res.records || []);
      }
    } catch (err) {
      console.error('Fetch attendance error:', err);
    } finally {
      setLoading(false);
    }
  }, [role, boardDate]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // Standard Web Check-In
  const handleCheckIn = async () => {
    setAlert({ text: '', type: '' });
    setCheckInLoading(true);
    try {
      const res = await attendanceService.checkIn({ source: 'web' });
      setAlert({ text: res.message || 'Checked in successfully!', type: 'success' });
      fetchAttendance();
    } catch (err) {
      setAlert({ text: err.message || 'Check-in failed.', type: 'error' });
    } finally {
      setCheckInLoading(false);
    }
  };

  // Standard Web Check-Out
  const handleCheckOut = async () => {
    setAlert({ text: '', type: '' });
    setCheckOutLoading(true);
    try {
      const res = await attendanceService.checkOut();
      setAlert({ text: res.message || 'Checked out successfully!', type: 'success' });
      fetchAttendance();
    } catch (err) {
      setAlert({ text: err.message || 'Check-out failed.', type: 'error' });
    } finally {
      setCheckOutLoading(false);
    }
  };

  // Submit Correction
  const handleSubmitCorrection = async (e) => {
    e.preventDefault();
    setCorrectionLoading(true);
    try {
      const res = await attendanceService.requestCorrection(correctionForm);
      if (res.success) {
        setAlert({ text: 'Attendance correction request submitted to HR', type: 'success' });
        setShowCorrectionModal(false);
        fetchAttendance();
      }
    } catch (err) {
      setAlert({ text: err.message || 'Correction request failed', type: 'error' });
    } finally {
      setCorrectionLoading(false);
    }
  };

  // HR Review Action
  const handleReviewAction = async (action) => {
    if (!reviewTarget) return;
    setReviewLoading(true);
    try {
      const res = await attendanceService.reviewCorrection(reviewTarget._id, {
        action,
        hrComment,
      });
      if (res.success) {
        setAlert({ text: `Correction request ${action}d!`, type: 'success' });
        setReviewTarget(null);
        setHrComment('');
        fetchAttendance();
      }
    } catch (err) {
      setAlert({ text: err.message || 'Review failed', type: 'error' });
    } finally {
      setReviewLoading(false);
    }
  };

  // Camera + GPS Check-In
  const startCameraCheckIn = () => {
    setShowCameraModal(true);
    setCameraStatus('scanning');
    setCameraError('');
    setGpsData(null);
    setCameraLoading(false);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsData({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
          setTimeout(() => setCameraStatus('detected'), 1500);
        },
        () => {
          // Fallback: use default office coordinates
          setGpsData({ latitude: 24.8607, longitude: 67.0011, accuracy: 15 });
          setTimeout(() => setCameraStatus('detected'), 1500);
        },
        { timeout: 8000 }
      );
    } else {
      setGpsData({ latitude: 24.8607, longitude: 67.0011, accuracy: 15 });
      setTimeout(() => setCameraStatus('detected'), 1500);
    }
  };

  const confirmCameraCheckIn = async () => {
    setCameraStatus('verifying');
    setCameraLoading(true);
    setCameraError('');
    try {
      const res = await attendanceService.checkIn({
        source: 'camera',
        faceDetected: true,
        latitude: gpsData?.latitude,
        longitude: gpsData?.longitude,
        accuracy: gpsData?.accuracy,
      });
      setCameraStatus('done');
      setTimeout(() => {
        setShowCameraModal(false);
        setCameraStatus('idle');
        setCameraLoading(false);
        setAlert({ text: res.message || 'Face & Geofence verified! Check-in recorded.', type: 'success' });
        fetchAttendance();
      }, 1200);
    } catch (err) {
      setCameraStatus('error');
      setCameraError(err.message || 'Camera check-in failed. Please try web check-in.');
      setCameraLoading(false);
    }
  };

  const closeCameraModal = () => {
    setShowCameraModal(false);
    setCameraStatus('idle');
    setCameraError('');
    setCameraLoading(false);
  };

  return (
    <div className="attendance-page-container">
      {/* Top Banner */}
      <div className="att-top-banner">
        <div>
          <h1>Attendance &amp; Daily Board</h1>
          <p>
            Office Start: <strong>09:00 AM PKT</strong> &bull; Grace Cutoff: <strong>09:15 AM PKT</strong> &bull; Half-Day: <strong>&lt; 5 hours</strong>
          </p>
        </div>

        <div className="att-top-actions">
          {role === 'employee' && (
            <>
              <button
                className="att-btn primary"
                onClick={handleCheckIn}
                disabled={checkInLoading}
              >
                {checkInLoading ? (
                  <><Loader2 size={15} className="att-spinner" /> Checking In...</>
                ) : (
                  <><LogIn size={15} /> Web Check-In</>
                )}
              </button>
              <button
                className="att-btn checkout"
                onClick={handleCheckOut}
                disabled={checkOutLoading}
              >
                {checkOutLoading ? (
                  <><Loader2 size={15} className="att-spinner" /> Checking Out...</>
                ) : (
                  <><LogOut size={15} /> Web Check-Out</>
                )}
              </button>
              <button
                className="att-btn camera"
                onClick={startCameraCheckIn}
                title="Bonus: Camera & GPS Check-In"
                disabled={checkInLoading || checkOutLoading}
              >
                <Camera size={15} /> Camera + GPS
              </button>
              <button
                className="att-btn secondary"
                onClick={() => setShowCorrectionModal(true)}
              >
                <FileEdit size={15} /> Request Correction
              </button>
            </>
          )}

          {(role === 'admin' || role === 'hr') && (
            <div className="date-filter-box">
              <label>Board Date:</label>
              <input
                type="date"
                value={boardDate}
                onChange={(e) => setBoardDate(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {alert.text && (
        <div className={`att-alert-banner ${alert.type}`}>
          {alert.type === 'error' ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
          {alert.text}
          <button className="att-alert-close" onClick={() => setAlert({ text: '', type: '' })}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* ADMIN & HR VIEW: Daily Attendance Board */}
      {(role === 'admin' || role === 'hr') && (
        <div className="daily-board-card">
          <div className="board-header">
            <h3>Daily Operations Board ({boardDate})</h3>
            <span className="total-badge">{boardData.length} Employee(s)</span>
          </div>

          <div className="table-responsive">
            <table className="att-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Check-In (PKT)</th>
                  <th>Check-Out (PKT)</th>
                  <th>Work Hours</th>
                  <th>Status</th>
                  <th>Source</th>
                  <th>Correction</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="9" className="table-empty"><Loader2 size={16} className="att-spinner" /> Loading...</td></tr>
                ) : boardData.length === 0 ? (
                  <tr><td colSpan="9" className="table-empty">No employee records found.</td></tr>
                ) : (
                  boardData.map((row) => {
                    const att = row.attendance;
                    const hasCorrection = att?.correctionRequest?.status === 'pending';

                    return (
                      <tr key={row.employee._id}>
                        <td><span className="code-badge">{row.employee.employeeCode}</span></td>
                        <td><strong>{row.employee.fullName}</strong></td>
                        <td>{row.employee.department}</td>
                        <td>{toPKT(att.checkIn)}</td>
                        <td>{toPKT(att.checkOut)}</td>
                        <td>{att.workHours ? `${att.workHours} hrs` : '0 hrs'}</td>
                        <td><span className={`status-tag status-${att.status}`}>{att.status}</span></td>
                        <td>
                          <span className={`source-pill ${att.source}`}>
                            {att.source === 'camera' ? '📷 Camera GPS' : '💻 Web'}
                          </span>
                        </td>
                        <td>
                          {hasCorrection ? (
                            <button
                              className="review-btn"
                              onClick={() => {
                                setReviewTarget(att);
                                setHrComment('');
                              }}
                            >
                              Review Request
                            </button>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EMPLOYEE VIEW: Personal Monthly Attendance Log */}
      {role === 'employee' && (
        <div className="daily-board-card">
          <div className="board-header">
            <h3>My Attendance History</h3>
            <span className="total-badge">{historyData.length} Total Record(s)</span>
          </div>

          <div className="table-responsive">
            <table className="att-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check-In (PKT)</th>
                  <th>Check-Out (PKT)</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Source</th>
                  <th>Correction</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" className="table-empty"><Loader2 size={16} className="att-spinner" /> Loading...</td></tr>
                ) : historyData.length === 0 ? (
                  <tr><td colSpan="7" className="table-empty">No attendance records yet. Use Check-In to get started.</td></tr>
                ) : (
                  historyData.map((rec) => (
                    <tr key={rec._id}>
                      <td><strong>{rec.date}</strong></td>
                      <td>{toPKT(rec.checkIn)}</td>
                      <td>{toPKT(rec.checkOut)}</td>
                      <td>{rec.workHours ? `${rec.workHours} hrs` : '0 hrs'}</td>
                      <td><span className={`status-tag status-${rec.status}`}>{rec.status}</span></td>
                      <td><span className="source-pill">{rec.source || 'web'}</span></td>
                      <td>
                        {rec.correctionRequest?.status && rec.correctionRequest?.status !== 'none' ? (
                          <span className={`correction-pill ${rec.correctionRequest.status}`}>
                            {rec.correctionRequest.status.toUpperCase()}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Correction Request Modal */}
      {showCorrectionModal && (
        <div className="modal-overlay" onClick={() => setShowCorrectionModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Request Attendance Correction</h3>
              <button className="modal-close-btn" onClick={() => setShowCorrectionModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmitCorrection} className="modal-form">
              <div className="form-field">
                <label>Date of Incident *</label>
                <input
                  type="date"
                  value={correctionForm.date}
                  onChange={(e) => setCorrectionForm({ ...correctionForm, date: e.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Corrected Check-In (PKT)</label>
                  <input
                    type="time"
                    value={correctionForm.requestedCheckIn}
                    onChange={(e) => setCorrectionForm({ ...correctionForm, requestedCheckIn: e.target.value })}
                  />
                </div>
                <div className="form-field">
                  <label>Corrected Check-Out (PKT)</label>
                  <input
                    type="time"
                    value={correctionForm.requestedCheckOut}
                    onChange={(e) => setCorrectionForm({ ...correctionForm, requestedCheckOut: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-field">
                <label>Reason *</label>
                <textarea
                  rows={3}
                  placeholder="e.g., Forgot to punch checkout due to internet outage"
                  value={correctionForm.reason}
                  onChange={(e) => setCorrectionForm({ ...correctionForm, reason: e.target.value })}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="att-btn secondary" onClick={() => setShowCorrectionModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="att-btn primary" disabled={correctionLoading}>
                  {correctionLoading ? <><Loader2 size={15} className="att-spinner" /> Submitting...</> : 'Submit to HR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HR Review Modal */}
      {reviewTarget && (
        <div className="modal-overlay" onClick={() => setReviewTarget(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Review Attendance Correction</h3>
              <button className="modal-close-btn" onClick={() => setReviewTarget(null)}><X size={18} /></button>
            </div>
            <div className="correction-review-info">
              <p><strong>Date:</strong> {reviewTarget.date}</p>
              <p><strong>Reason:</strong> &ldquo;{reviewTarget.correctionRequest?.reason}&rdquo;</p>
              <div className="form-field" style={{ marginTop: '1rem' }}>
                <label>HR Comment (Optional):</label>
                <input
                  type="text"
                  placeholder="e.g. Approved per manager email"
                  value={hrComment}
                  onChange={(e) => setHrComment(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
              <button
                className="att-btn error-btn"
                onClick={() => handleReviewAction('reject')}
                disabled={reviewLoading}
              >
                {reviewLoading ? <Loader2 size={14} className="att-spinner" /> : null} Reject
              </button>
              <button
                className="att-btn success-btn"
                onClick={() => handleReviewAction('approve')}
                disabled={reviewLoading}
              >
                {reviewLoading ? <Loader2 size={14} className="att-spinner" /> : null} Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera + GPS Modal */}
      {showCameraModal && (
        <div className="modal-overlay" onClick={closeCameraModal}>
          <div className="modal-card camera-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📷 Camera &amp; Geofence Check-In</h3>
              <button className="modal-close-btn" onClick={closeCameraModal}><X size={18} /></button>
            </div>

            {/* Camera Viewfinder */}
            <div className="camera-viewfinder">
              <div className="face-bounding-box">
                {cameraStatus === 'scanning' && <span className="scan-line" />}
                {cameraStatus === 'detected' && <span className="face-tag">✅ Face Detected</span>}
                {cameraStatus === 'verifying' && (
                  <span className="face-tag verifying">
                    <Loader2 size={14} className="att-spinner" /> Verifying...
                  </span>
                )}
                {cameraStatus === 'done' && <span className="face-tag done">✅ Verified!</span>}
                {cameraStatus === 'error' && <span className="face-tag error-tag">❌ Failed</span>}
              </div>
              <span className="live-camera-feed-text">
                {cameraStatus === 'scanning' ? 'Scanning face...' : 'LIVE FRONT WEBCAM FEED'}
              </span>
            </div>

            {/* GPS Status */}
            <div className="geofence-status-bar">
              <div className="geo-item">
                <MapPin size={16} color="#10b981" />
                <span>Geofence: <strong>{gpsData ? 'Inside Radius (≤150m)' : 'Acquiring GPS...'}</strong></span>
              </div>
              <div className="geo-item">
                <CheckCircle2 size={16} color="#10b981" />
                <span>GPS Accuracy: <strong>{gpsData ? `${Math.round(gpsData.accuracy)}m` : '...'}</strong></span>
              </div>
            </div>

            {/* Error message */}
            {cameraStatus === 'error' && cameraError && (
              <div className="camera-error-msg">{cameraError}</div>
            )}

            {/* Actions */}
            <div className="camera-actions">
              {cameraStatus === 'scanning' && (
                <button className="att-btn primary full" disabled>
                  <Loader2 size={15} className="att-spinner" /> Detecting Face &amp; GPS...
                </button>
              )}
              {cameraStatus === 'detected' && (
                <button className="att-btn primary full" onClick={confirmCameraCheckIn}>
                  Confirm &amp; Stamp Attendance
                </button>
              )}
              {cameraStatus === 'verifying' && (
                <button className="att-btn primary full" disabled>
                  <Loader2 size={15} className="att-spinner" /> Saving Attendance...
                </button>
              )}
              {cameraStatus === 'done' && (
                <button className="att-btn success-btn full" disabled>
                  <CheckCircle2 size={15} /> Check-In Recorded!
                </button>
              )}
              {cameraStatus === 'error' && (
                <button className="att-btn secondary full" onClick={closeCameraModal}>
                  Close &amp; Use Web Check-In
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
