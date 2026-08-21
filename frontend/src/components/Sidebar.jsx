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
  Settings
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
        { id: 'create-trip', label: 'Create New Trip', icon: PlusCircle },
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
      title: 'MONEY',
      items: [
        { id: 'cost-prediction', label: 'Budget & ML Cost', icon: DollarSign, badge: 'ML' },
        { id: 'expenses', label: 'Expenses & Split', icon: Receipt },
      ]
    },
    {
      title: 'GROUP & PREP',
      items: [
        { id: 'members', label: 'Group Members', icon: Users },
        { id: 'checklist', label: 'Trip Checklists', icon: CheckSquare },
      ]
    },
    {
      title: 'ASSIST',
      items: [
        { id: 'assistant', label: 'AI Tourist Assistant', icon: Bot, badge: 'AI' },
      ]
    },
    {
      title: 'SETTINGS',
      items: [
        { id: 'settings', label: 'Settings & Preferences', icon: Settings },
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
        width: '240px',
        minWidth: '240px',
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 10px',
        gap: '14px',
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
              fontWeight: 700,
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
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    background: isActive ? 'rgba(59, 130, 246, 0.14)' : 'transparent',
                    color: isActive ? '#93c5fd' : 'var(--text-muted)',
                    fontSize: '0.84rem',
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)',
                    textAlign: 'left',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
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
                    <Icon size={16} style={{ color: isActive ? '#3b82f6' : 'var(--text-dim)' }} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span style={{
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: '4px',
                      background: item.badge === 'AI' ? 'rgba(168, 85, 247, 0.18)' : 'rgba(59, 130, 246, 0.18)',
                      color: item.badge === 'AI' ? '#c084fc' : '#93c5fd',
                      border: `1px solid ${item.badge === 'AI' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`
                    }}>
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
