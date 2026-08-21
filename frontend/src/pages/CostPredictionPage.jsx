import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Brain, 
  Sparkles, 
  Car, 
  Hotel, 
  Users, 
  Calendar, 
  Info,
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export const CostPredictionPage = ({ trip, setActivePage }) => {
  const [params, setParams] = useState({
    distance_km: 550,
    members: 3,
    days: 3,
    transport_mode: 'bus',
    dining_tier: 'budget'
  });

  const [prediction, setPrediction] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runPrediction = async () => {
    try {
      setLoading(true);
      setError('');
      const [predRes, metRes] = await Promise.all([
        api.post('/cost/predict', {
          distance_km: parseFloat(params.distance_km) || 550,
          members: parseInt(params.members) || 3,
          days: parseInt(params.days) || 3,
          transport_mode: params.transport_mode,
          dining_tier: params.dining_tier
        }),
        api.get('/cost/metrics')
      ]);

      if (predRes.success && predRes.data) {
        setPrediction(predRes.data);
      } else {
        setError(predRes.message || 'Unable to calculate the estimated cost. Please check your inputs.');
      }
      if (metRes.success && metRes.data) {
        setMetrics(metRes.data);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to calculate the estimated cost. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runPrediction();
  }, []);

  const handlePredictSubmit = (e) => {
    e.preventDefault();
    runPrediction();
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.45) 0%, rgba(88, 28, 135, 0.35) 50%, rgba(17, 24, 39, 0.9) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        padding: '28px 32px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span className="badge badge-info">
            <Brain size={12} /> RandomForestRegressor ML Model
          </span>
          <span className="badge badge-success">
            Scikit-Learn • Joblib Serialization
          </span>
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
          ML-Based Trip Cost Prediction Engine
        </h1>
        <p style={{ color: '#cbd5e1', fontSize: '0.92rem' }}>
          Calculates realistic trip expenditure across distance, group members, lodging, transit modes, and dining tiers with confidence intervals and model evaluation metrics.
        </p>
      </div>

      {error && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#f87171',
          fontSize: '0.88rem'
        }}>
          {error}
        </div>
      )}

      <div className="grid-3" style={{ gap: '24px', alignItems: 'flex-start' }}>
        
        {/* Left Column: Interactive Feature Config Form */}
        <div className="glass-card" style={{ gridColumn: 'span 1' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: '#93c5fd' }}>
            <DollarSign size={18} /> MODEL INPUT FEATURES
          </h3>

          <form onSubmit={handlePredictSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Route Distance (km)</label>
              <input 
                type="number" 
                min="10"
                step="10"
                className="form-input" 
                value={params.distance_km}
                onChange={(e) => setParams({ ...params, distance_km: parseFloat(e.target.value) || 0 })}
                placeholder="550"
                required
              />
            </div>

            <div className="grid-2" style={{ gap: '10px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Members</label>
                <input 
                  type="number" 
                  min="1" 
                  max="30"
                  className="form-input" 
                  value={params.members}
                  onChange={(e) => setParams({ ...params, members: parseInt(e.target.value) || 1 })}
                  placeholder="3"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Days</label>
                <input 
                  type="number" 
                  min="1" 
                  max="30"
                  className="form-input" 
                  value={params.days}
                  onChange={(e) => setParams({ ...params, days: parseInt(e.target.value) || 1 })}
                  placeholder="3"
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Transportation Mode</label>
              <select 
                className="form-select"
                value={params.transport_mode}
                onChange={(e) => setParams({ ...params, transport_mode: e.target.value })}
              >
                <option value="bus">Bus / Coach</option>
                <option value="train">Train (AC Express)</option>
                <option value="car">Car / Road Trip</option>
                <option value="rental">Self-Drive Rental Vehicle</option>
                <option value="flight">Flight</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Dining Tier</label>
              <select 
                className="form-select"
                value={params.dining_tier}
                onChange={(e) => setParams({ ...params, dining_tier: e.target.value })}
              >
                <option value="budget">Budget / Street Dining</option>
                <option value="standard">Standard Restaurants</option>
                <option value="fine dining">Fine Dining & Heritage Cafes</option>
              </select>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ marginTop: '8px', width: '100%', padding: '12px' }}
              disabled={loading}
            >
              {loading ? <LoadingSpinner text="Predicting..." /> : (
                <>Predict Cost <ArrowRight size={16} /></>
              )}
            </button>
          </form>
        </div>

        {/* Middle & Right Columns: Prediction Output & Breakdown */}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {loading ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '60px 0' }}>
              <LoadingSpinner text="Predicting trip cost using backend ML model..." />
            </div>
          ) : prediction && (
            <>
              {/* Primary Cost Estimation Display Card */}
              <div className="glass-card" style={{
                background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(30, 58, 138, 0.3))',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                padding: '26px 30px'
              }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#93c5fd', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                    ESTIMATED TRIP COST
                  </div>
                  <div style={{ fontSize: '2.6rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
                    ₹{Math.round(prediction.estimated_total).toLocaleString()}
                  </div>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '8px', fontSize: '0.92rem', color: '#cbd5e1' }}>
                    <div>
                      <span style={{ color: 'var(--text-dim)' }}>Estimated range: </span>
                      <strong style={{ color: '#fff' }}>₹{Math.round(prediction.estimated_min).toLocaleString()} – ₹{Math.round(prediction.estimated_max).toLocaleString()}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-dim)' }}>Estimated cost per person: </span>
                      <strong style={{ color: '#34d399' }}>₹{Math.round(prediction.cost_per_person).toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Itemized Cost Breakdown Grid */}
              <div className="glass-card">
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px', color: '#fff' }}>
                  Itemized Expenditure Breakdown
                </h3>

                <div className="grid-3" style={{ gap: '12px' }}>
                  <div style={{ padding: '14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Transportation</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#60a5fa', marginTop: '2px' }}>
                      ₹{Math.round(prediction.breakdown.transportation).toLocaleString()}
                    </div>
                  </div>

                  <div style={{ padding: '14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Accommodation</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>
                      ₹{Math.round(prediction.breakdown.accommodation).toLocaleString()}
                    </div>
                  </div>

                  <div style={{ padding: '14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Food & Dining</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f59e0b', marginTop: '2px' }}>
                      ₹{Math.round(prediction.breakdown.food).toLocaleString()}
                    </div>
                  </div>

                  <div style={{ padding: '14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Activities & Entry</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ec4899', marginTop: '2px' }}>
                      ₹{Math.round(prediction.breakdown.activities).toLocaleString()}
                    </div>
                  </div>

                  <div style={{ padding: '14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Local Travel</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#8b5cf6', marginTop: '2px' }}>
                      ₹{Math.round(prediction.breakdown.local_travel).toLocaleString()}
                    </div>
                  </div>

                  <div style={{ padding: '14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Miscellaneous</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#94a3b8', marginTop: '2px' }}>
                      ₹{Math.round(prediction.breakdown.miscellaneous).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '16px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border)',
                  fontSize: '0.95rem',
                  fontWeight: 700
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>Estimated Total:</span>
                  <span style={{ color: '#fff', fontSize: '1.15rem' }}>₹{Math.round(prediction.estimated_total).toLocaleString()}</span>
                </div>
              </div>
            </>
          )}

          {/* Academic Model Evaluation Metrics Card */}
          {metrics && (
            <div className="glass-card" style={{ border: '1px solid rgba(59, 130, 246, 0.35)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Brain size={18} color="var(--primary)" />
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                    Academic Demonstration: ML Model Evaluation Metrics
                  </h3>
                </div>
                <span className="badge badge-info">{metrics.model_name || 'RandomForestRegressor'}</span>
              </div>

              <div className="grid-3">
                <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Coefficient of Determination (R²)</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>
                    {metrics.r2_score}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Trained Model Accuracy</div>
                </div>

                <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Mean Absolute Error (MAE)</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#60a5fa', marginTop: '2px' }}>
                    ₹{metrics.mae}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Test Set Mean Variance</div>
                </div>

                <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Root Mean Squared Error (RMSE)</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f472b6', marginTop: '2px' }}>
                    ₹{metrics.rmse}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Standard Deviation of Residuals</div>
                </div>
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '12px' }}>
                Trained on <strong>{metrics.dataset_size} multi-feature travel instances</strong> across distance_km, members, days, transport_mode, and dining_tier using Scikit-Learn.
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default CostPredictionPage;
