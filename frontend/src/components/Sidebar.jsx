import React from 'react';

function Sidebar({ activeTab, setActiveTab, activeContainersCount, cdcOnline }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'databases', label: 'Databases', icon: '🖥️', badge: activeContainersCount > 0 ? `${activeContainersCount} Active` : null },
    { id: 'migration', label: 'Migration Testing', icon: '📝' },
    { id: 'history', label: 'Migration History', icon: '📜' },
    { id: 'diff', label: 'Schema Diff', icon: '🔍' },
    { id: 'workspace', label: 'SQL Workspace', icon: '💻' },
    { id: 'logs', label: 'Logs & CDC Errors', icon: '📑', badge: cdcOnline ? 'CDC' : null },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <aside className="app-sidebar">
      <div className="brand-header" onClick={() => setActiveTab('dashboard')} style={{ cursor: 'pointer' }}>
        <div className="brand-logo">🌒</div>
        <div className="brand-text">
          <h2>ShadowBase</h2>
          <span className="brand-tag">MIGRATION PLATFORM</span>
        </div>
      </div>

      <nav className="nav-menu">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {item.badge && <span className="nav-badge">{item.badge}</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="system-indicator">
          <span className="dot pulse"></span>
          <span>Engine v2.4 Active</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
