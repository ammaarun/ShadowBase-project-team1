import React, { useState, useEffect } from 'react';

function MigrationHistoryView() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      let url = 'http://localhost:8081/api/migrations/history?';
      if (searchTerm) url += `search=${encodeURIComponent(searchTerm)}&`;
      if (statusFilter !== 'ALL') url += `status=${statusFilter}&`;
      if (riskFilter !== 'ALL') url += `riskLevel=${riskFilter}&`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.error("Error fetching migration history:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [searchTerm, statusFilter, riskFilter]);

  const clearHistory = async () => {
    if (!window.confirm("Are you sure you want to clear all migration history audit logs?")) return;
    try {
      await fetch('http://localhost:8081/api/migrations/history', { method: 'DELETE' });
      fetchHistory();
    } catch (e) {
      console.error("Error clearing history:", e);
    }
  };

  const getRiskBadgeClass = (level) => {
    switch (level) {
      case 'CRITICAL': return 'banner-critical';
      case 'HIGH': return 'banner-high';
      case 'MEDIUM': return 'banner-medium';
      case 'LOW': return 'banner-low';
      default: return 'banner-low';
    }
  };

  return (
    <div className="migration-history-view">
      {/* FILTER & CONTROL BAR */}
      <div className="card-panel">
        <div className="panel-header">
          <h3>📜 Migration Audit Log History (H2 JPA Persisted)</h3>
          <div className="action-buttons">
            <button className="btn btn-secondary btn-sm" onClick={fetchHistory}>
              🔄 Refresh
            </button>
            <button className="btn btn-danger btn-sm" onClick={clearHistory}>
              🗑️ Clear History
            </button>
          </div>
        </div>

        <div className="filter-bar">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search SQL script or table name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Status:</label>
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="FAILED">FAILED</option>
              <option value="BLOCKED">BLOCKED</option>
              <option value="ANALYZED">ANALYZED</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Risk Level:</label>
            <select
              className="filter-select"
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
            >
              <option value="ALL">All Risk Levels</option>
              <option value="LOW">LOW Risk</option>
              <option value="MEDIUM">MEDIUM Risk</option>
              <option value="HIGH">HIGH Risk</option>
              <option value="CRITICAL">CRITICAL Risk</option>
            </select>
          </div>
        </div>
      </div>

      {/* HISTORY AUDIT DATA TABLE */}
      <div className="card-panel" style={{ marginTop: '16px' }}>
        {loading ? (
          <div className="loading-container"><div className="spinner"></div><p>Loading History...</p></div>
        ) : history.length === 0 ? (
          <div className="empty-state">No migration records match your filter criteria. Run a migration to generate history!</div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>SQL Script</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Risk Score</th>
                  <th>Affected Table</th>
                  <th>Duration</th>
                  <th>Timestamp</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id}>
                    <td className="font-mono text-cyan">{item.migrationId}</td>
                    <td className="font-mono text-snippet" title={item.sqlScript}>
                      {item.sqlScript.length > 45 ? item.sqlScript.substring(0, 45) + '...' : item.sqlScript}
                    </td>
                    <td><span className="type-badge">{item.migrationType}</span></td>
                    <td>
                      <span className={`status-pill ${item.status?.toLowerCase()}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <span className={`risk-pill ${getRiskBadgeClass(item.riskLevel)}`}>
                        {item.riskLevel} ({item.riskScore}/100)
                      </span>
                    </td>
                    <td className="font-mono">{item.affectedTable}</td>
                    <td>{item.executionTimeMs} ms</td>
                    <td className="text-muted" style={{ fontSize: '0.75rem' }}>{item.createdTimestamp}</td>
                    <td>
                      <button className="btn btn-sm btn-secondary" onClick={() => setSelectedRecord(item)}>
                        👁️ View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedRecord && (
        <div className="modal-backdrop" onClick={() => setSelectedRecord(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Migration Audit Detail: {selectedRecord.migrationId}</h3>
              <button className="close-btn" onClick={() => setSelectedRecord(null)}>✖</button>
            </div>
            <div className="modal-body">
              <div className="modal-grid">
                <div><strong>Status:</strong> <span className={`status-pill ${selectedRecord.status?.toLowerCase()}`}>{selectedRecord.status}</span></div>
                <div><strong>Risk Level:</strong> <span className={`risk-pill ${getRiskBadgeClass(selectedRecord.riskLevel)}`}>{selectedRecord.riskLevel} ({selectedRecord.riskScore}/100)</span></div>
                <div><strong>Affected Table:</strong> <code>{selectedRecord.affectedTable}</code></div>
                <div><strong>Duration:</strong> {selectedRecord.executionTimeMs} ms</div>
                <div><strong>Type:</strong> {selectedRecord.migrationType}</div>
                <div><strong>Timestamp:</strong> {selectedRecord.createdTimestamp}</div>
              </div>

              <div className="modal-section">
                <h4>Complete SQL Migration Script</h4>
                <pre className="code-block">{selectedRecord.sqlScript}</pre>
              </div>

              {selectedRecord.errorMessage && (
                <div className="modal-section error-section">
                  <h4>Error & Exception Traceback</h4>
                  <pre className="code-block error">{selectedRecord.errorMessage}</pre>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedRecord(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MigrationHistoryView;
