import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { commsService } from '../services/api';
import { Megaphone, Plus, Trash2, Calendar, AlertCircle } from 'lucide-react';
import './Announcements.css';

export default function Announcements() {
  const { role } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAnn, setNewAnn] = useState({ title: '', content: '', priority: 'normal' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await commsService.getAnnouncements();
      if (res.success) setAnnouncements(res.announcements || []);
    } catch (err) {
      console.error('Announcements error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await commsService.createAnnouncement(newAnn);
      if (res.success) {
        setShowCreateModal(false);
        setNewAnn({ title: '', content: '', priority: 'normal' });
        loadAnnouncements();
      }
    } catch (err) {
      alert(err.message || 'Failed to post announcement');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await commsService.deleteAnnouncement(id);
      loadAnnouncements();
    } catch (err) {
      alert(err.message || 'Failed to delete');
    }
  };

  return (
    <div className="ann-page-container">
      <div className="ann-page-header">
        <div>
          <h1>Company Announcements & Circulars</h1>
          <p>Official notices broadcast across all organization dashboards.</p>
        </div>

        {(role === 'admin' || role === 'hr') && (
          <button className="att-btn primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> Post Announcement
          </button>
        )}
      </div>

      <div className="ann-feed-grid">
        {loading ? (
          <p className="empty-sub">Loading announcements...</p>
        ) : announcements.length === 0 ? (
          <p className="empty-sub">No company announcements posted yet.</p>
        ) : (
          announcements.map((a) => (
            <div key={a._id} className={`ann-card priority-${a.priority}`}>
              <div className="ann-card-header">
                <span className={`ann-priority-pill ${a.priority}`}>{a.priority?.toUpperCase()}</span>
                {(role === 'admin' || role === 'hr') && (
                  <button className="ann-delete-btn" onClick={() => handleDelete(a._id)} title="Delete Announcement">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <h3 className="ann-card-title">{a.title}</h3>
              <p className="ann-card-content">{a.content}</p>
              <div className="ann-card-footer">
                <span>By: <strong>{a.postedBy}</strong> ({a.postedByRole})</span>
                <span>{new Date(a.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Post Company Announcement</h3>
              <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate} className="modal-form">
              <div className="form-field">
                <label>Announcement Headline *</label>
                <input
                  type="text"
                  placeholder="e.g. Annual Town Hall Schedule / Eid Holiday Notice"
                  value={newAnn.title}
                  onChange={(e) => setNewAnn({ ...newAnn, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-field">
                <label>Priority Level</label>
                <select
                  value={newAnn.priority}
                  onChange={(e) => setNewAnn({ ...newAnn, priority: e.target.value })}
                >
                  <option value="normal">Normal (Informative)</option>
                  <option value="important">Important (Action Required)</option>
                  <option value="urgent">Urgent (Immediate Notice)</option>
                </select>
              </div>
              <div className="form-field">
                <label>Announcement Content *</label>
                <textarea
                  rows={4}
                  placeholder="Type official details..."
                  value={newAnn.content}
                  onChange={(e) => setNewAnn({ ...newAnn, content: e.target.value })}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="att-btn secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="att-btn primary">Broadcast to All</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
