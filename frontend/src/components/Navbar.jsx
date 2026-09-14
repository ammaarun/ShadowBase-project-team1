import React from 'react';

function Navbar({ activeTab, stats, onRefresh }) {
  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Developer Platform Dashboard';
      case 'databases': return 'Database Environment Manager';
      case 'migration': return 'Monaco SQL Migration Testing';
      case 'history': return 'Migration Audit History';
      case 'diff': return 'Schema Visual Diff Viewer';
      case 'workspace': return 'Shadow Database SQL Workspace';
      case 'logs': return 'CDC Stream Replayer & Audit Logs';
      case 'settings': return 'Platform Settings & Configurations';
      default: return 'ShadowBase Sandbox';
    }
  };

  return (
    <header className="top-navbar">
      <div className="navbar-left">
        <h1 className="page-title">{getTitle()}</h1>
      </div>

      <div className="navbar-right">
        <div className="target-badge">
          <span className="badge-dot"></span>
          <span>Target: Shadow PostgreSQL (Containerized)</span>
        </div>

        {stats && (
          <div className={`health-badge ${stats.systemHealth}`}>
            <span className="health-icon">{stats.systemHealth === 'HEALTHY' ? '🟢' : '🟡'}</span>
            <span>{stats.systemHealth}</span>
          </div>
        )}

        <button className="btn btn-icon" onClick={onRefresh} title="Refresh System Stats">
          🔄
        </button>
      </div>
    </header>
  );
}

export default Navbar;
