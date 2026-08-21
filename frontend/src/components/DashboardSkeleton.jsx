import React from 'react';

export const DashboardSkeleton = () => {
  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      
      {/* 1. Trip Hero Skeleton */}
      <div className="glass-card" style={{
        minHeight: '200px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '28px 32px',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.5))',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Shimmer animation bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ width: '160px', height: '24px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: 'var(--radius-full)', animation: 'pulse 1.5s infinite ease-in-out' }} />
            <div style={{ width: '100px', height: '24px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: 'var(--radius-full)', animation: 'pulse 1.5s infinite ease-in-out' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ width: '80px', height: '30px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: 'var(--radius-sm)', animation: 'pulse 1.5s infinite ease-in-out' }} />
            <div style={{ width: '80px', height: '30px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: 'var(--radius-sm)', animation: 'pulse 1.5s infinite ease-in-out' }} />
          </div>
        </div>

        <div style={{ marginTop: '36px' }}>
          <div style={{ width: '280px', height: '32px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: 'var(--radius-sm)', marginBottom: '12px', animation: 'pulse 1.5s infinite ease-in-out' }} />
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ width: '140px', height: '18px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }} />
            <div style={{ width: '100px', height: '18px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }} />
            <div style={{ width: '120px', height: '18px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }} />
          </div>
        </div>
      </div>

      {/* 2. Budget Cards Skeleton */}
      <div>
        <div style={{ width: '200px', height: '20px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', marginBottom: '12px', animation: 'pulse 1.5s infinite ease-in-out' }} />
        <div className="grid-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ width: '80px', height: '14px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', animation: 'pulse 1.5s infinite ease-in-out' }} />
                <div style={{ width: '18px', height: '18px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '50%', animation: 'pulse 1.5s infinite ease-in-out' }} />
              </div>
              <div style={{ width: '110px', height: '26px', background: 'rgba(255, 255, 255, 0.12)', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }} />
              <div style={{ width: '140px', height: '12px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px', animation: 'pulse 1.5s infinite ease-in-out' }} />
            </div>
          ))}
        </div>
      </div>

      {/* 3. Primary Core Cards Skeleton (Next Stop, Weather, Checklist) */}
      <div className="grid-3">
        {/* Next scheduled stop skeleton */}
        <div className="glass-card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '190px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ width: '90px', height: '16px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }} />
              <div style={{ width: '70px', height: '16px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: 'var(--radius-full)', animation: 'pulse 1.5s infinite ease-in-out' }} />
            </div>
            <div style={{ width: '180px', height: '22px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', marginBottom: '8px', animation: 'pulse 1.5s infinite ease-in-out' }} />
            <div style={{ width: '100%', height: '14px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px', marginBottom: '6px', animation: 'pulse 1.5s infinite ease-in-out' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
            <div style={{ flex: 1, height: '32px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: 'var(--radius-sm)', animation: 'pulse 1.5s infinite ease-in-out' }} />
            <div style={{ flex: 1, height: '32px', background: 'rgba(59, 130, 246, 0.2)', borderRadius: 'var(--radius-sm)', animation: 'pulse 1.5s infinite ease-in-out' }} />
          </div>
        </div>

        {/* Destination Weather skeleton */}
        <div className="glass-card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '190px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ width: '130px', height: '16px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }} />
              <div style={{ width: '60px', height: '16px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: 'var(--radius-full)', animation: 'pulse 1.5s infinite ease-in-out' }} />
            </div>
            <div style={{ width: '80px', height: '32px', background: 'rgba(255, 255, 255, 0.12)', borderRadius: '4px', marginBottom: '8px', animation: 'pulse 1.5s infinite ease-in-out' }} />
            <div style={{ width: '100%', height: '14px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px', animation: 'pulse 1.5s infinite ease-in-out' }} />
          </div>
          <div style={{ width: '100%', height: '32px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: 'var(--radius-sm)', marginTop: '14px', animation: 'pulse 1.5s infinite ease-in-out' }} />
        </div>

        {/* Checklist skeleton */}
        <div className="glass-card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '190px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ width: '100px', height: '16px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }} />
              <div style={{ width: '50px', height: '16px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }} />
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', marginBottom: '12px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ width: '80%', height: '14px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '3px', animation: 'pulse 1.5s infinite ease-in-out' }} />
              <div style={{ width: '65%', height: '14px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '3px', animation: 'pulse 1.5s infinite ease-in-out' }} />
            </div>
          </div>
          <div style={{ width: '100%', height: '32px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: 'var(--radius-sm)', marginTop: '14px', animation: 'pulse 1.5s infinite ease-in-out' }} />
        </div>
      </div>

      {/* 4. AI Assistant Panel Skeleton */}
      <div className="glass-card" style={{ padding: '20px 24px', background: 'rgba(15, 23, 42, 0.6)' }}>
        <div style={{ width: '160px', height: '20px', background: 'rgba(168, 85, 247, 0.2)', borderRadius: '4px', marginBottom: '10px', animation: 'pulse 1.5s infinite ease-in-out' }} />
        <div style={{ width: '260px', height: '14px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '3px', marginBottom: '14px', animation: 'pulse 1.5s infinite ease-in-out' }} />
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[1, 2, 3].map((p) => (
            <div key={p} style={{ width: '180px', height: '26px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: 'var(--radius-full)', animation: 'pulse 1.5s infinite ease-in-out' }} />
          ))}
        </div>
      </div>

    </div>
  );
};

export default DashboardSkeleton;
