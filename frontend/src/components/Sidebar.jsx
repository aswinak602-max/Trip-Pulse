import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  Compass,
  Map,
  Calendar,
  DollarSign,
  CloudSun,
  Ticket,
  Receipt,
  Users,
  CheckSquare,
  Bot,
  Settings,
  Sparkles
} from 'lucide-react';

export const Sidebar = ({ 
  activePage, 
  setActivePage,
  isMobileNavOpen = false,
  onCloseMobileNav = () => {}
}) => {
  const navSections = [
    {
      title: 'PLAN',
      items: [
        { id: 'dashboard', label: 'Trip Overview', icon: LayoutDashboard },
        { id: 'trip-dashboard', label: 'Active Trip Hub', icon: Compass },
        { id: 'create-trip', label: 'Create New Trip', icon: PlusCircle, badge: 'AI', badgeColor: 'teal' },
        { id: 'itinerary', label: 'Itinerary Plan', icon: Calendar },
        { id: 'map', label: 'Map & Routes', icon: Map },
      ]
    },
    {
      title: 'DISCOVER',
      items: [
        { id: 'search', label: 'Explore Places', icon: Compass },
        { id: 'weather', label: 'Weather & Alternatives', icon: CloudSun },
        { id: 'reservations', label: 'Reservations', icon: Ticket },
      ]
    },
    {
      title: 'FINANCE & ML',
      items: [
        { id: 'cost-prediction', label: 'ML Cost Predictor', icon: DollarSign, badge: 'ML', badgeColor: 'gold' },
        { id: 'expenses', label: 'Expenses & Split', icon: Receipt },
      ]
    },
    {
      title: 'COLLABORATION',
      items: [
        { id: 'members', label: 'Group Members', icon: Users },
        { id: 'checklist', label: 'Trip Checklists', icon: CheckSquare },
      ]
    },
    {
      title: 'AI CONCIERGE',
      items: [
        { id: 'assistant', label: 'AI Travel Assistant', icon: Bot, badge: 'NEW', badgeColor: 'coral' },
      ]
    },
    {
      title: 'SETTINGS',
      items: [
        { id: 'settings', label: 'Preferences & Keys', icon: Settings },
      ]
    }
  ];

  const handleNavClick = (id) => {
    setActivePage(id);
    onCloseMobileNav();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileNavOpen && (
        <div className="mobile-backdrop" onClick={onCloseMobileNav} />
      )}

      <aside style={{
        width: '248px',
        minWidth: '248px',
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '18px 12px',
        gap: '16px',
        overflowY: 'auto',
        userSelect: 'none',
        zIndex: 45,
        transition: 'transform var(--transition-normal)'
      }}>
        {navSections.map((section, sIdx) => (
          <div key={section.title || sIdx} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{
              padding: '4px 12px',
              color: 'var(--text-dim)',
              fontSize: '0.68rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase'
            }}>
              {section.title}
            </div>

            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    background: isActive ? 'var(--primary-light)' : 'transparent',
                    color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                    fontSize: '0.86rem',
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)',
                    textAlign: 'left',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'var(--bg-subtle)';
                      e.currentTarget.style.color = 'var(--text-main)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-muted)';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={17} style={{ color: isActive ? 'var(--primary)' : 'var(--text-dim)' }} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span 
                      className={`badge ${
                        item.badgeColor === 'teal' ? 'badge-teal' :
                        item.badgeColor === 'coral' ? 'badge-coral' :
                        item.badgeColor === 'gold' ? 'badge-gold' : 'badge-navy'
                      }`}
                      style={{ fontSize: '0.62rem', padding: '1px 6px' }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </aside>
    </>
  );
};

export default Sidebar;
