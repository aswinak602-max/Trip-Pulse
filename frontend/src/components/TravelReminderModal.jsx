import React from 'react';
import { Clock, Navigation, X, AlertTriangle, ArrowRight, RefreshCw, Settings } from 'lucide-react';

export const TravelReminderModal = ({
  isOpen,
  onClose,
  onViewNextStop,
  onRecalculate,
  onOpenSettings,
  minutesBehind = 25,
  currentLocation = 'Current Location',
  remainingCount = 3,
  nextLocation = 'Next Scheduled Attraction'
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '28px',
      right: '28px',
      zIndex: 999,
      maxWidth: '440px',
      width: 'calc(100vw - 40px)',
      animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(26, 20, 48, 0.96) 0%, rgba(17, 24, 39, 0.98) 100%)',
        border: '1px solid rgba(245, 158, 11, 0.45)',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.55), 0 0 24px rgba(245, 158, 11, 0.2)',
        padding: '22px 24px',
        position: 'relative',
        borderRadius: 'var(--radius-xl)'
      }}>
        {/* Close icon */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: 'none',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'var(--transition-fast)'
          }}
          title="Dismiss reminder"
        >
          <X size={15} />
        </button>

        {/* Title / Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(245, 158, 11, 0.2)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fbbf24',
            flexShrink: 0
          }}>
            <Clock size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.74rem', color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Smart Time & Pace Management
            </span>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              TripPulse Travel Reminder
            </h4>
          </div>
        </div>

        {/* Reminder Message Body */}
        <div style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          marginBottom: '14px'
        }}>
          <p style={{ color: '#fef3c7', fontSize: '0.88rem', lineHeight: 1.5, margin: 0 }}>
            You are spending extra time at <strong style={{ color: '#fff' }}>{currentLocation}</strong> ({minutesBehind} mins behind schedule).
          </p>
        </div>

        <div style={{ marginBottom: '16px', fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.5 }}>
          <p style={{ margin: '0 0 6px 0' }}>
            <strong style={{ color: '#60a5fa' }}>{remainingCount} attraction{remainingCount > 1 ? 's' : ''}</strong> remain today.
          </p>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Head over to <strong style={{ color: '#e2e8f0' }}>{nextLocation}</strong> or recalibrate your day's schedule to stay on track.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            style={{ padding: '7px 12px', fontSize: '0.8rem' }}
          >
            Dismiss
          </button>
          
          {onRecalculate && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                onRecalculate();
                onClose();
              }}
              style={{ padding: '7px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <RefreshCw size={13} /> Recalibrate Schedule
            </button>
          )}

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              if (onViewNextStop) onViewNextStop();
              onClose();
            }}
            style={{
              padding: '7px 14px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              borderColor: '#f59e0b'
            }}
          >
            <Navigation size={13} /> Proceed to Next Spot
          </button>
        </div>

        {/* Footer info link */}
        <div style={{ marginTop: '10px', textAlign: 'right' }}>
          <button
            type="button"
            onClick={() => {
              if (onOpenSettings) onOpenSettings();
              onClose();
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-dim)',
              fontSize: '0.72rem',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Manage reminders in Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default TravelReminderModal;
