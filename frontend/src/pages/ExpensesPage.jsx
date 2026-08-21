import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Receipt, 
  Plus, 
  Trash2, 
  Users, 
  TrendingUp, 
  PieChart, 
  CheckCircle2, 
  AlertCircle,
  Calendar
} from 'lucide-react';
import api from '../services/api';
import { ExpenseCategoryDoughnut, EstimatedVsActualBar } from '../components/ExpenseChart';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';

const EXPENSE_CATEGORIES = [
  'Transport', 'Hotel', 'Food', 'Activities', 'Shopping', 'Rental', 'Other'
];

export const ExpensesPage = ({ trip }) => {
  const [expenseData, setExpenseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const [formData, setFormData] = useState({
    category: 'Food',
    amount: '',
    paid_by: 'Aswin Kumar',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const tripId = trip?.id || 1;

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/expenses/${tripId}`);
      if (res.success && res.data) {
        setExpenseData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [tripId]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) return;

    try {
      const res = await api.post('/expenses', {
        trip_id: tripId,
        category: formData.category,
        amount: parseFloat(formData.amount),
        paid_by: formData.paid_by,
        date: formData.date,
        description: formData.description
      });

      if (res.success) {
        setShowAddModal(false);
        setFormData({
          category: 'Food',
          amount: '',
          paid_by: 'Aswin Kumar',
          date: new Date().toISOString().split('T')[0],
          description: ''
        });
        await fetchExpenses();
      }
    } catch (err) {
      alert(err.message || 'Failed to add expense');
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      const res = await api.delete(`/expenses/${id}`);
      if (res.success) {
        await fetchExpenses();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete expense');
    }
  };

  const allExpenses = expenseData?.expenses || [];
  const totalPages = Math.ceil(allExpenses.length / ITEMS_PER_PAGE);
  const paginatedExpenses = allExpenses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
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
              <Receipt size={12} /> Budget & Expense Management
            </span>
            <span className="badge badge-success">
              Group Split Equalizer
            </span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            Expense Tracking & Group Splitting
          </h1>
        </div>

        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Log New Expense
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <LoadingSpinner text="Computing group splits and budget telemetry..." />
        </div>
      ) : expenseData && (
        <>
          {/* Key Stat Cards */}
          <div className="grid-4">
            <div className="glass-card">
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Allocated Budget</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', marginTop: '4px' }}>
                ₹{expenseData.total_budget.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>Group spending cap</div>
            </div>

            <div className="glass-card">
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Total Actual Spent</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#60a5fa', marginTop: '4px' }}>
                ₹{expenseData.total_actual.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>{expenseData.expenses.length} transaction entries</div>
            </div>

            <div className="glass-card">
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Remaining Budget</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: expenseData.remaining_budget >= 0 ? '#34d399' : '#f87171', marginTop: '4px' }}>
                ₹{expenseData.remaining_budget.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                {expenseData.remaining_budget >= 0 ? 'Comfortable buffer' : 'Exceeded budget target'}
              </div>
            </div>

            <div className="glass-card" style={{ background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#93c5fd' }}>
                <Users size={14} /> Group Equal Split
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', marginTop: '4px' }}>
                ₹{expenseData.cost_per_person.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Per member ({expenseData.members_count} members)
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid-2">
            <div className="glass-card">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '14px', color: '#fff' }}>
                Expenses by Category
              </h3>
              <ExpenseCategoryDoughnut categories={expenseData.by_category || {}} />
            </div>

            <div className="glass-card">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '14px', color: '#fff' }}>
                Budget vs Predicted vs Actual
              </h3>
              <EstimatedVsActualBar 
                budget={expenseData.total_budget}
                estimated={expenseData.total_estimated}
                actual={expenseData.total_actual}
              />
            </div>
          </div>

          {/* Transaction History Table */}
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                Logged Expenses
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                {expenseData.expenses.length} Records
              </span>
            </div>

            {expenseData.expenses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No expenses logged yet. Click "Log New Expense" to start tracking.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255, 255, 255, 0.03)', color: 'var(--text-dim)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '12px 20px' }}>Date</th>
                      <th style={{ padding: '12px 20px' }}>Description</th>
                      <th style={{ padding: '12px 20px' }}>Category</th>
                      <th style={{ padding: '12px 20px' }}>Paid By</th>
                      <th style={{ padding: '12px 20px' }}>Amount</th>
                      <th style={{ padding: '12px 20px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedExpenses.map((exp) => (
                      <tr key={exp.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                        <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>{exp.date}</td>
                        <td style={{ padding: '14px 20px', fontWeight: 600, color: '#fff' }}>{exp.description}</td>
                        <td style={{ padding: '14px 20px' }}>
                          <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>{exp.category}</span>
                        </td>
                        <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>{exp.paid_by}</td>
                        <td style={{ padding: '14px 20px', fontWeight: 800, color: '#34d399' }}>₹{exp.amount.toLocaleString()}</td>
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteExpense(exp.id)}
                            style={{ padding: '4px 8px' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Expenses 5-items Pagination */}
                <div style={{ padding: '12px 20px' }}>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(p) => setCurrentPage(p)}
                    totalItems={allExpenses.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    itemName="expenses"
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Add Expense Modal */}
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
          <div className="glass-card" style={{ width: '460px', maxWidth: '100%', padding: '28px' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '18px' }}>
              Log Trip Expense
            </h3>

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Expense Description</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Fuel refills at Coimbatore highway"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="grid-2" style={{ gap: '10px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Amount (₹ INR)</label>
                  <input 
                    type="number" 
                    step="50"
                    min="1"
                    className="form-input" 
                    placeholder="2500"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Category</label>
                  <select 
                    className="form-select"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid-2" style={{ gap: '10px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Paid By</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.paid_by}
                    onChange={(e) => setFormData({ ...formData, paid_by: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ExpensesPage;
