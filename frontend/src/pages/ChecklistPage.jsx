import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Square, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  FolderCheck, 
  Briefcase, 
  FileText, 
  ShoppingBag, 
  ListTodo
} from 'lucide-react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const CHECKLIST_CATEGORIES = ['Packing', 'Documents', 'Shopping', 'To-Do', 'Custom'];

export const ChecklistPage = ({ trip }) => {
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    category: 'Packing',
    item_text: '',
    assigned_to: 'All Members'
  });

  const tripId = trip?.id || 1;

  const fetchChecklists = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/checklists/${tripId}`);
      if (res.success && res.data) {
        setChecklists(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChecklists();
  }, [tripId]);

  const handleToggleItem = async (id) => {
    // Optimistic UI update
    setChecklists(prev => prev.map(c => c.id === id ? { ...c, is_completed: !c.is_completed } : c));
    try {
      await api.put(`/checklists/${id}/toggle`);
    } catch (err) {
      // Revert if error
      await fetchChecklists();
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      const res = await api.delete(`/checklists/${id}`);
      if (res.success) {
        setChecklists(prev => prev.filter(c => c.id !== id));
      }
    } catch (err) {
      alert(err.message || 'Failed to delete checklist item');
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newItem.item_text) return;

    try {
      const res = await api.post('/checklists', {
        trip_id: tripId,
        ...newItem
      });
      if (res.success) {
        setShowAddModal(false);
        setNewItem({ category: 'Packing', item_text: '', assigned_to: 'All Members' });
        await fetchChecklists();
      }
    } catch (err) {
      alert(err.message || 'Failed to add item');
    }
  };

  const completedCount = checklists.filter(c => c.is_completed).length;
  const progressPercent = checklists.length > 0 ? Math.round((completedCount / checklists.length) * 100) : 0;

  const filteredItems = selectedCategory === 'All'
    ? checklists
    : checklists.filter(c => c.category === selectedCategory);

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'Packing': return <Briefcase size={16} color="#60a5fa" />;
      case 'Documents': return <FileText size={16} color="#34d399" />;
      case 'Shopping': return <ShoppingBag size={16} color="#ec4899" />;
      default: return <ListTodo size={16} color="#f59e0b" />;
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div className="glass-card" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.4) 0%, rgba(17, 24, 39, 0.85) 100%)',
        padding: '24px 32px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-info">
              <CheckSquare size={12} /> Trip Preparation Checklist
            </span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            Packing & Document Management
          </h1>
        </div>

        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Add Checklist Item
        </button>
      </div>

      {/* Progress Bar Card */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderCheck size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Preparation Progress</h3>
          </div>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: progressPercent === 100 ? '#34d399' : '#93c5fd' }}>
            {completedCount} / {checklists.length} Done ({progressPercent}%)
          </span>
        </div>

        <div style={{ height: '10px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '5px', overflow: 'hidden' }}>
          <div style={{
            width: `${progressPercent}%`,
            height: '100%',
            background: progressPercent === 100 ? 'var(--emerald-gradient)' : 'var(--accent-gradient)',
            borderRadius: '5px',
            transition: 'width 0.4s ease'
          }} />
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {['All', ...CHECKLIST_CATEGORIES].map((cat) => (
          <button
            key={cat}
            className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedCategory(cat)}
            style={{ borderRadius: 'var(--radius-full)' }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Items List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <LoadingSpinner text="Loading checklists..." />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          No items in this category. Click "Add Checklist Item" to create one.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredItems.map((item) => (
            <div 
              key={item.id}
              className="glass-card"
              style={{
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: item.is_completed ? 'rgba(16, 185, 129, 0.06)' : 'var(--bg-card)',
                border: `1px solid ${item.is_completed ? 'rgba(16, 185, 129, 0.25)' : 'var(--border)'}`,
                transition: 'var(--transition-fast)'
              }}
            >
              <div 
                style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, cursor: 'pointer' }}
                onClick={() => handleToggleItem(item.id)}
              >
                <div style={{ color: item.is_completed ? '#34d399' : 'var(--text-muted)' }}>
                  {item.is_completed ? <CheckSquare size={20} /> : <Square size={20} />}
                </div>

                <div>
                  <div style={{
                    fontSize: '0.94rem',
                    fontWeight: item.is_completed ? 500 : 600,
                    color: item.is_completed ? 'var(--text-muted)' : '#fff',
                    textDecoration: item.is_completed ? 'line-through' : 'none'
                  }}>
                    {item.item_text}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {getCategoryIcon(item.category)} {item.category}
                    </span>
                    {item.assigned_to && (
                      <span>• Assigned to: {item.assigned_to}</span>
                    )}
                  </div>
                </div>
              </div>

              <button 
                className="btn btn-danger btn-sm"
                onClick={() => handleDeleteItem(item.id)}
                style={{ padding: '6px 8px' }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-card" style={{ width: '440px', maxWidth: '100%', padding: '28px' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '18px' }}>
              Add Checklist Item
            </h3>

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Category</label>
                <select 
                  className="form-select"
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                >
                  {CHECKLIST_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Item Description</label>
                <input 
                  type="text"
                  className="form-input"
                  placeholder="e.g. Rain poncho & umbrella"
                  value={newItem.item_text}
                  onChange={(e) => setNewItem({ ...newItem, item_text: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Assigned Member</label>
                <input 
                  type="text"
                  className="form-input"
                  value={newItem.assigned_to}
                  onChange={(e) => setNewItem({ ...newItem, assigned_to: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ChecklistPage;
