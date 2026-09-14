import React, { useState, useEffect } from 'react';

function SchemaDiffView({ environment }) {
  const [diffData, setDiffData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchDiff = async () => {
    if (!environment) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8081/api/schema/diff/${environment.environmentId}`);
      if (res.ok) {
        const data = await res.json();
        setDiffData(data);
      }
    } catch (e) {
      console.error("Error fetching schema diff:", e);
    } finally {
      setLoading(false);
    }
  };

  const captureBaseline = async () => {
    if (!environment) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8081/api/schema/snapshot/${environment.environmentId}`, {
        method: 'POST'
      });
      if (res.ok) {
        setMessage('Baseline schema snapshot captured successfully!');
        setTimeout(() => setMessage(''), 4000);
        fetchDiff();
      }
    } catch (e) {
      console.error("Error capturing baseline:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (environment) {
      fetchDiff();
    }
  }, [environment]);

  if (!environment) {
    return (
      <div className="card-panel">
        <div className="panel-header">
          <h3>🔍 GitHub-Style Schema Visual Diff Viewer</h3>
        </div>
        <div className="empty-state" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <h4>No Active Shadow Database Container</h4>
          <p className="text-muted" style={{ marginTop: '8px' }}>
            Please start a Shadow DB container from the sidebar or top control panel to inspect live schema diffs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="schema-diff-view">
      {/* HEADER & CONTROL BAR */}
      <div className="card-panel">
        <div className="panel-header">
          <div>
            <h3>🔍 GitHub-Style Schema Visual Diff Viewer</h3>
            <span className="text-muted" style={{ fontSize: '0.8rem' }}>
              Comparing active container baseline snapshot vs live schema
            </span>
          </div>
          <div className="action-buttons">
            <button className="btn btn-secondary btn-sm" onClick={captureBaseline} disabled={loading}>
              📸 Set Baseline Snapshot
            </button>
            <button className="btn btn-primary btn-sm" onClick={fetchDiff} disabled={loading}>
              🔄 Refresh Diff
            </button>
          </div>
        </div>

        {message && <div className="alert alert-success">{message}</div>}

        {diffData && (
          <div className="diff-summary-row" style={{ marginTop: '14px', display: 'flex', gap: '12px' }}>
            <div className="diff-summary-pill total">
              <span className="diff-num">{diffData.diffItems ? diffData.diffItems.length : 0}</span>
              <span className="diff-label">Total DDL Changes</span>
            </div>
            <div className="diff-summary-pill success">
              <span className="diff-num text-success">+{diffData.totalAdditions}</span>
              <span className="diff-label">Added Columns / Tables</span>
            </div>
            <div className="diff-summary-pill danger">
              <span className="diff-num text-danger">-{diffData.totalRemovals}</span>
              <span className="diff-label">Removed Columns / Tables</span>
            </div>
            <div className="diff-summary-pill warning">
              <span className="diff-num text-warning">~{diffData.totalModifications}</span>
              <span className="diff-label">Modified Types</span>
            </div>
          </div>
        )}
      </div>

      {/* VISUAL DIFF CONTAINER */}
      <div className="card-panel" style={{ marginTop: '16px' }}>
        <div className="panel-header">
          <h4>SCHEMA CHANGES DETECTED</h4>
          <span className="status-badge-sm healthy">Connected to Shadow Container</span>
        </div>

        {loading ? (
          <div className="loading-container"><div className="spinner"></div><p>Inspecting Catalog Metadata...</p></div>
        ) : !diffData || !diffData.diffItems || diffData.diffItems.length === 0 ? (
          <div className="empty-state" style={{ padding: '30px', textAlign: 'center' }}>
            <p className="text-success">✅ No schema changes detected. Live database matches baseline snapshot!</p>
          </div>
        ) : (
          <div className="diff-viewer-codeblock">
            {diffData.diffItems.map((item, idx) => {
              const isAdd = item.changeType.startsWith('ADDED');
              const isRemove = item.changeType.startsWith('REMOVED');
              const isMod = item.changeType.startsWith('MODIFIED');

              return (
                <div key={idx} className={`diff-line-item ${isAdd ? 'add' : isRemove ? 'remove' : 'modify'}`}>
                  <div className="diff-line-prefix">
                    {isAdd ? '+' : isRemove ? '-' : '~'}
                  </div>
                  <div className="diff-line-content">
                    <span className="diff-target-table">[{item.tableName}]</span>
                    {isAdd && <span className="diff-text-add">{item.newDefinition}</span>}
                    {isRemove && <span className="diff-text-remove">{item.oldDefinition}</span>}
                    {isMod && (
                      <span>
                        <span className="diff-text-remove">{item.oldDefinition}</span>
                        <span className="diff-arrow"> ➔ </span>
                        <span className="diff-text-add">{item.newDefinition}</span>
                      </span>
                    )}
                  </div>
                  <div className="diff-line-badge">
                    <span className={`risk-pill banner-${item.riskImpact?.toLowerCase()}`}>
                      {item.riskImpact} IMPACT
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CURRENT LIVE DATABASE SCHEMA STRUCTURE */}
      {diffData && diffData.currentSchema && diffData.currentSchema.length > 0 && (
        <div className="card-panel" style={{ marginTop: '16px' }}>
          <div className="panel-header">
            <h4>Live Database Schema Snapshot ({diffData.currentSchema.length} Public Tables)</h4>
          </div>
          <div className="schema-tables-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '14px', marginTop: '12px' }}>
            {diffData.currentSchema.map((table, tIdx) => (
              <div key={tIdx} className="health-item">
                <div className="health-item-title font-mono text-cyan">
                  <span>📋 {table.tableName}</span>
                </div>
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {table.columns.map((col, cIdx) => (
                    <div key={cIdx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontFamily: 'monospace' }}>
                      <span>{col.columnName}</span>
                      <span className="text-muted">{col.dataType.toUpperCase()} {col.nullable ? '(NULL)' : '(NOT NULL)'}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SchemaDiffView;
