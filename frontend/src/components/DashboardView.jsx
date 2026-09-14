import React from 'react';

function DashboardView({ stats, onNavigate }) {
  if (!stats) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading Dashboard Analytics...</p>
      </div>
    );
  }

  const successRate = stats.totalMigrationsTested > 0
    ? Math.round((stats.successfulMigrations / stats.totalMigrationsTested) * 100)
    : 100;

  return (
    <div className="dashboard-view">
      {/* SECTION 1: KPI SUMMARY CARDS */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Total Shadow DBs</span>
            <span className="kpi-icon">🗄️</span>
          </div>
          <div className="kpi-value">{stats.totalShadowDatabases}</div>
          <div className="kpi-subtext">
            <span className="pill-active">{stats.activeShadowDatabases} Active Container(s)</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Migrations Tested</span>
            <span className="kpi-icon">⚡</span>
          </div>
          <div className="kpi-value">{stats.totalMigrationsTested}</div>
          <div className="kpi-subtext">
            <span className="text-success">{successRate}% Success Rate</span>
          </div>
        </div>

        <div className="kpi-card success">
          <div className="kpi-header">
            <span className="kpi-title">Successful</span>
            <span className="kpi-icon">✅</span>
          </div>
          <div className="kpi-value text-success">{stats.successfulMigrations}</div>
          <div className="kpi-subtext">Passed without exceptions</div>
        </div>

        <div className="kpi-card danger">
          <div className="kpi-header">
            <span className="kpi-title">Failed Migrations</span>
            <span className="kpi-icon">💥</span>
          </div>
          <div className="kpi-value text-danger">{stats.failedMigrations}</div>
          <div className="kpi-subtext">Caught by CDC shadow replayer</div>
        </div>

        <div className="kpi-card warning">
          <div className="kpi-header">
            <span className="kpi-title">High-Risk Migrations</span>
            <span className="kpi-icon">⚠️</span>
          </div>
          <div className="kpi-value text-warning">{stats.highRiskMigrations}</div>
          <div className="kpi-subtext">Flagged by AST Risk Analyzer</div>
        </div>
      </div>

      {/* SECTION 2: SYSTEM HEALTH & CHARTS ROW */}
      <div className="dashboard-row">
        {/* DATABASE HEALTH INDICATORS */}
        <div className="card-panel flex-1">
          <div className="panel-header">
            <h3>Engine & Database Health</h3>
            <span className="status-badge-sm healthy">System Online</span>
          </div>
          <div className="health-grid">
            <div className="health-item">
              <div className="health-item-title">
                <span>🐳 Testcontainers Engine</span>
                <span className="text-success">HEALTHY</span>
              </div>
              <p className="health-desc">Docker Postgres 15 Alpine sandbox provisioner operational</p>
            </div>

            <div className="health-item">
              <div className="health-item-title">
                <span>📡 Production CDC Engine</span>
                <span className={stats.productionDbOnline ? "text-success" : "text-muted"}>
                  {stats.productionDbOnline ? "ONLINE (WAL Logical)" : "OFFLINE"}
                </span>
              </div>
              <p className="health-desc">
                Captured <strong>{stats.cdcEventsCaptured}</strong> change data events
              </p>
            </div>

            <div className="health-item">
              <div className="health-item-title">
                <span>🛡️ AST Risk Analyzer</span>
                <span className="text-success">ACTIVE</span>
              </div>
              <p className="health-desc">JSqlParser 4.9 DDL Abstract Syntax Tree parser operational</p>
            </div>
          </div>
        </div>

        {/* MIGRATION PERFORMANCE & RATIO CHART */}
        <div className="card-panel flex-1">
          <div className="panel-header">
            <h3>Migration Testing Distribution</h3>
          </div>
          <div className="chart-container">
            <div className="progress-bar-group">
              <div className="bar-label">
                <span>Success Rate</span>
                <span>{successRate}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill success" style={{ width: `${successRate}%` }}></div>
              </div>
            </div>

            <div className="chart-stats-summary">
              <div className="stat-pill success">
                <span className="stat-num">{stats.successfulMigrations}</span>
                <span className="stat-label">Passed</span>
              </div>
              <div className="stat-pill danger">
                <span className="stat-num">{stats.failedMigrations}</span>
                <span className="stat-label">Failed</span>
              </div>
              <div className="stat-pill warning">
                <span className="stat-num">{stats.highRiskMigrations}</span>
                <span className="stat-label">High Risk</span>
              </div>
            </div>

            <div className="quick-actions">
              <button className="btn btn-primary" onClick={() => onNavigate('migration')}>
                📝 Launch Migration Editor
              </button>
              <button className="btn btn-secondary" onClick={() => onNavigate('databases')}>
                🚀 Manage Shadow Containers
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: RECENT ACTIVITY STREAM */}
      <div className="card-panel">
        <div className="panel-header">
          <h3>Recent System Activity</h3>
          <span className="panel-sub">Real-time audit log stream</span>
        </div>
        <div className="activity-list">
          {stats.recentActivities && stats.recentActivities.length > 0 ? (
            stats.recentActivities.map((item, index) => (
              <div key={index} className="activity-item">
                <div className="activity-time">{item.timestamp}</div>
                <div className={`activity-status ${item.status?.toLowerCase()}`}>
                  {item.status}
                </div>
                <div className="activity-action">{item.action}</div>
                <div className="activity-details">{item.details}</div>
              </div>
            ))
          ) : (
            <div className="empty-state">No recent activity logged yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardView;
