import React, { useState } from 'react';
import Editor from '@monaco-editor/react';

function SqlWorkspaceView({ environment, onSeed }) {
  const [querySql, setQuerySql] = useState("SELECT * FROM users;");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [executionTime, setExecutionTime] = useState(null);

  const templates = [
    { label: 'Select All Users', sql: 'SELECT * FROM users;' },
    { label: 'Select Specific Columns', sql: 'SELECT id, name, email FROM users;' },
    { label: 'Count Total Users', sql: 'SELECT COUNT(*) FROM users;' },
    { label: 'Select Orders Joined', sql: 'SELECT * FROM orders;' },
  ];

  const handleExecute = async (sqlToRun = null) => {
    const targetSql = sqlToRun || querySql;
    if (!environment || !targetSql || !targetSql.trim()) return;

    setLoading(true);
    setResult(null);
    setErrorDetails(null);
    const startTime = Date.now();

    try {
      const response = await fetch(`http://localhost:8081/api/environments/${environment.environmentId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: targetSql })
      });
      const duration = Date.now() - startTime;
      setExecutionTime(duration);

      const data = await response.json();
      if (data.success) {
        if (data.columns && data.data) {
          setResult({ columns: data.columns, data: data.data, message: data.message });
        } else {
          setResult({ columns: [], data: [], message: data.message });
        }
      } else {
        setErrorDetails({ message: data.message, details: data.errorDetails });
      }
    } catch (e) {
      setErrorDetails({ message: 'Network error executing SQL query', details: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuerySql('');
    setResult(null);
    setErrorDetails(null);
    setExecutionTime(null);
  };

  return (
    <div className="sql-workspace-view">
      {/* CONNECTION TARGET HEADER BANNER */}
      <div className="card-panel">
        <div className="panel-header">
          <div>
            <h3>💻 Dedicated Shadow Database SQL Workspace</h3>
            <span className="text-muted" style={{ fontSize: '0.8rem' }}>
              Execute interactive queries safely against your isolated Testcontainers sandbox.
            </span>
          </div>
          <div>
            {environment ? (
              <span className="target-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)', color: 'var(--success)' }}>
                <span className="badge-dot" style={{ background: 'var(--success)' }}></span>
                Connected to Shadow Database (ID: {environment.environmentId.substring(0, 8)}...)
              </span>
            ) : (
              <span className="target-badge" style={{ background: 'rgba(244, 63, 94, 0.15)', borderColor: 'rgba(244, 63, 94, 0.3)', color: 'var(--danger)' }}>
                <span className="badge-dot" style={{ background: 'var(--danger)' }}></span>
                Shadow DB Offline (Start container first)
              </span>
            )}
          </div>
        </div>

        {/* QUICK QUERY TEMPLATES */}
        <div className="template-bar" style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: '600' }}>Templates:</span>
          {templates.map((tpl, idx) => (
            <button
              key={idx}
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setQuerySql(tpl.sql);
                handleExecute(tpl.sql);
              }}
              disabled={!environment || loading}
            >
              ⚡ {tpl.label}
            </button>
          ))}
          {onSeed && (
            <button className="btn btn-warning btn-sm" onClick={onSeed} disabled={!environment || loading}>
              🌱 Seed Sample Data
            </button>
          )}
        </div>
      </div>

      {/* SQL QUERY EDITOR PANEL */}
      <div className="card-panel" style={{ marginTop: '16px' }}>
        <div className="editor-header">
          <div className="editor-title">
            <span>📝</span> Query Console
          </div>
          <div className="editor-actions">
            <button className="btn btn-secondary" onClick={handleClear}>
              🧹 Clear
            </button>
            <button
              className="btn btn-primary"
              onClick={() => handleExecute()}
              disabled={!environment || loading || !querySql.trim()}
            >
              {loading ? 'Executing...' : '⚡ Execute Query'}
            </button>
          </div>
        </div>

        <div className="editor-wrapper" style={{ height: '220px', minHeight: '220px', marginTop: '10px' }}>
          <Editor
            height="100%"
            defaultLanguage="sql"
            theme="vs-dark"
            value={querySql}
            onChange={(val) => setQuerySql(val || '')}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: true,
              automaticLayout: true,
              smoothScrolling: true,
              scrollbar: {
                vertical: 'visible',
                horizontal: 'auto',
                verticalScrollbarSize: 10,
                alwaysConsumeMouseWheel: false
              },
              fontFamily: "'Fira Code', 'Courier New', monospace"
            }}
          />
        </div>
      </div>

      {/* QUERY EXECUTION RESULTS / ERROR PANEL */}
      <div className="card-panel" style={{ marginTop: '16px' }}>
        <div className="panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h4>Query Result Data Grid</h4>
            {executionTime !== null && (
              <span className="pill-active" style={{ fontSize: '0.75rem' }}>
                ⏱️ Execution Time: {executionTime} ms
              </span>
            )}
          </div>
          {result && (
            <span className="text-muted" style={{ fontSize: '0.8rem' }}>
              {result.data ? `${result.data.length} Row(s) Returned` : 'Execution Complete'}
            </span>
          )}
        </div>

        {errorDetails ? (
          <div className="alert alert-danger" style={{ background: 'rgba(244, 63, 94, 0.15)', borderColor: 'rgba(244, 63, 94, 0.3)', color: '#fecdd3', padding: '16px' }}>
            <h5 style={{ fontWeight: '700', marginBottom: '6px' }}>⚠️ {errorDetails.message}</h5>
            {errorDetails.details && (
              <pre className="code-block error" style={{ marginTop: '8px' }}>{errorDetails.details}</pre>
            )}
          </div>
        ) : loading ? (
          <div className="loading-container" style={{ padding: '30px' }}><div className="spinner"></div><p>Running query against Shadow PostgreSQL...</p></div>
        ) : !result ? (
          <div className="empty-state" style={{ padding: '30px', textAlign: 'center' }}>
            <p className="text-muted">Enter a SQL query above and click <strong>Execute Query</strong> to view tabular results.</p>
          </div>
        ) : result.columns && result.columns.length > 0 ? (
          <div className="table-scroll" style={{ maxHeight: '300px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  {result.columns.map((col, idx) => (
                    <th key={idx}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.data.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {result.columns.map((col, cIdx) => (
                      <td key={cIdx}>{row[col]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="alert alert-success" style={{ padding: '14px' }}>
            ✅ {result.message || 'Statement executed successfully with zero rows returned.'}
          </div>
        )}
      </div>
    </div>
  );
}

export default SqlWorkspaceView;
