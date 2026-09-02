import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import './index.css';

const DEFAULT_MIGRATION_SQL = `-- ShadowBase Schema Migration Script
-- Write your migration SQL here to test against the active container environment

ALTER TABLE users ADD COLUMN bio VARCHAR(255);
`;

function App() {
  const [environment, setEnvironment] = useState(null);
  const [productionDb, setProductionDb] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sql, setSql] = useState(DEFAULT_MIGRATION_SQL);
  const [astResult, setAstResult] = useState(null);
  const [logs, setLogs] = useState([
    { type: 'info', text: 'ShadowBase Sandbox ready. Start an environment to begin.' }
  ]);

  // Tabular result state
  const [queryResult, setQueryResult] = useState(null);

  const addLog = (type, text) => {
    setLogs((prev) => [...prev, { type, text: `[${new Date().toLocaleTimeString()}] ${text}` }]);
  };

  // Poll Production DB Status & CDC metrics
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('http://localhost:8081/api/production/status');
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'ONLINE') {
            setProductionDb(data);
          } else {
            setProductionDb(null);
          }
        }
      } catch (e) {
        // Backend offline or compiling
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const analyzeAst = async (codeToAnalyze = null) => {
    const targetSql = codeToAnalyze !== null ? codeToAnalyze : sql;
    if (!targetSql || !targetSql.trim()) return;
    try {
      const response = await fetch('http://localhost:8081/api/ast/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: targetSql })
      });
      const data = await response.json();
      setAstResult(data);
    } catch (e) {
      console.error("AST Analysis error:", e);
    }
  };

  const exportMigrationScript = () => {
    const element = document.createElement("a");
    const file = new Blob([sql], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "migration_script.sql";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    addLog('info', 'Migration script exported as migration_script.sql');
  };

  const startEnvironment = async () => {
    setLoading(true);
    addLog('info', 'Provisioning fresh Shadow PostgreSQL container...');
    try {
      const response = await fetch('http://localhost:8081/api/environments/start', {
        method: 'POST'
      });
      const data = await response.json();
      setEnvironment(data);
      addLog('success', `Shadow DB container started successfully (ID: ${data.environmentId.substring(0, 8)}...)`);
    } catch (error) {
      console.error("Failed to start environment:", error);
      addLog('error', 'Failed to connect to backend API. Ensure Spring Boot is running on port 8081.');
    } finally {
      setLoading(false);
    }
  };

  const startProductionDb = async () => {
    setLoading(true);
    addLog('info', 'Spinning up Mock Production DB with wal_level=logical enabled...');
    try {
      const response = await fetch('http://localhost:8081/api/production/start', {
        method: 'POST'
      });
      const data = await response.json();
      setProductionDb(data);
      addLog('success', 'Production DB online with PostgreSQL WAL Logical Replication enabled!');
    } catch (error) {
      addLog('error', `Failed to start Production DB: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const simulateProductionTraffic = async () => {
    if (!productionDb) return;
    setLoading(true);
    addLog('info', 'Simulating live production transaction (INSERT INTO users)...');
    try {
      const randomId = Math.floor(Math.random() * 10000);
      const sql = `INSERT INTO users (name, email) VALUES ('User_${randomId}', 'user_${randomId}@prod.com');`;
      const response = await fetch('http://localhost:8081/api/production/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql })
      });
      const data = await response.json();
      if (data.success) {
        addLog('success', `Production Transaction Captured: ${data.message}`);
        const statusRes = await fetch('http://localhost:8081/api/production/status');
        const statusData = await statusRes.json();
        setProductionDb(statusData);
      } else {
        addLog('error', `Production Transaction Error: ${data.message}`);
      }
    } catch (error) {
      addLog('error', `Traffic Simulation Network Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const seedEnvironment = async () => {
    if (!environment) return;
    setLoading(true);
    addLog('info', 'Seeding shadow database with mock production schema (users, orders)...');
    try {
      const response = await fetch(`http://localhost:8081/api/environments/${environment.environmentId}/seed`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        addLog('success', 'Database seeded successfully with sample tables (users, orders)!');
      } else {
        addLog('error', `Seeding Error: ${data.message} - ${data.errorDetails}`);
      }
    } catch (error) {
      addLog('error', `Network Error seeding database: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const executeSqlScript = async (customSql = null) => {
    if (!environment) return;
    const sqlToRun = customSql || sql;
    setLoading(true);
    addLog('info', `Running SQL: ${sqlToRun.substring(0, 60)}...`);
    try {
      const response = await fetch(`http://localhost:8081/api/environments/${environment.environmentId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: sqlToRun })
      });
      const data = await response.json();
      if (data.success) {
        addLog('success', `${data.message}`);
        if (data.columns && data.data) {
          setQueryResult({ columns: data.columns, data: data.data });
        } else {
          setQueryResult(null);
        }
      } else {
        addLog('error', `Execution Failed! ${data.message}`);
        if (data.errorDetails) {
          addLog('error', `Traceback: ${data.errorDetails}`);
        }
      }
    } catch (error) {
      addLog('error', `Network Error executing SQL: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchTables = () => {
    executeSqlScript("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';");
  };

  const fetchUsers = () => {
    executeSqlScript("SELECT * FROM users;");
  };

  const stopEnvironment = async () => {
    if (!environment) return;
    setLoading(true);
    addLog('info', 'Destroying shadow database container...');
    try {
      await fetch(`http://localhost:8081/api/environments/${environment.environmentId}`, {
        method: 'DELETE'
      });
      addLog('info', `Environment ${environment.environmentId.substring(0, 8)}... destroyed.`);
      setEnvironment(null);
      setQueryResult(null);
    } catch (error) {
      addLog('error', `Error stopping environment: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const stopProductionDb = async () => {
    if (!productionDb) return;
    setLoading(true);
    try {
      await fetch('http://localhost:8081/api/production', { method: 'DELETE' });
      addLog('info', 'Production DB stopped.');
      setProductionDb(null);
    } catch (e) {
      addLog('error', `Error stopping Production DB: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <h1 className="logo">
          <span>🌒</span> ShadowBase
        </h1>
        
        <div className="control-panel">
          {!environment ? (
            <button 
              className="btn btn-primary" 
              onClick={startEnvironment}
              disabled={loading}
            >
              {loading ? "Starting..." : "🚀 Start Shadow DB"}
            </button>
          ) : (
            <button 
              className="btn btn-danger" 
              onClick={stopEnvironment}
              disabled={loading}
            >
              {loading ? "Stopping..." : "🛑 Destroy Shadow DB"}
            </button>
          )}

          {!productionDb ? (
            <button 
              className="btn btn-secondary" 
              onClick={startProductionDb}
              disabled={loading}
            >
              📡 Start Production DB (CDC)
            </button>
          ) : (
            <>
              <button 
                className="btn btn-warning" 
                onClick={simulateProductionTraffic}
                disabled={loading}
              >
                ⚡ Simulate Live Traffic
              </button>
              <button 
                className="btn btn-danger" 
                onClick={stopProductionDb}
                disabled={loading}
              >
                🛑 Stop Production DB
              </button>
            </>
          )}
        </div>

        {/* SHADOW ENVIRONMENT STATUS CARD */}
        <div className="environment-card">
          <h3>Shadow Sandbox Status</h3>
          {environment ? (
            <>
              <div className="status-badge">🟢 Container Active</div>
              <div className="info-row">
                <span className="info-label">Environment ID</span>
                <span className="info-value">{environment.environmentId.substring(0, 16)}...</span>
              </div>
              <div className="info-row">
                <span className="info-label">JDBC URL</span>
                <span className="info-value">{environment.jdbcUrl}</span>
              </div>
            </>
          ) : (
            <>
              <div className="status-badge offline">🔴 Offline</div>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Click Start Shadow DB to provision a new isolated container.
              </p>
            </>
          )}
        </div>

        {/* PRODUCTION CDC DB CARD */}
        <div className="environment-card">
          <h3>Production CDC Engine</h3>
          {productionDb ? (
            <>
              <div className="status-badge">📡 WAL Logical Mode</div>
              <div className="info-row">
                <span className="info-label">CDC Events Captured</span>
                <span className="info-value" style={{ color: '#38bdf8', fontWeight: 'bold' }}>
                  {productionDb.cdcEventsCaptured || 0} Events
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="status-badge offline">🔴 CDC Offline</div>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Start Production DB to capture live WAL transactions.
              </p>
            </>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="main-content">
        {/* TOOLBAR HEADER */}
        <header className="editor-header">
          <div className="editor-title">
            <span>📝</span> Migration Script (Monaco IDE)
          </div>
          <div className="editor-actions">
            <button 
              className="btn btn-secondary" 
              onClick={() => analyzeAst()}
            >
              🛡️ Analyze AST Risk
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={exportMigrationScript}
            >
              💾 Save .sql
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={seedEnvironment} 
              disabled={!environment || loading}
            >
              🌱 Seed Schema
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={fetchTables} 
              disabled={!environment || loading}
            >
              🔍 List Tables
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={fetchUsers} 
              disabled={!environment || loading}
            >
              👥 View Users
            </button>
            <button 
              className="btn btn-success" 
              onClick={() => executeSqlScript()} 
              disabled={!environment || loading}
            >
              ⚡ Run Migration
            </button>
          </div>
        </header>

        {/* PRE-FLIGHT AST RISK WARNING BANNER */}
        {astResult && astResult.warnings && astResult.warnings.length > 0 && (
          <div className={`ast-banner ${astResult.riskLevel}`}>
            {astResult.warnings.map((warn, i) => (
              <div key={i}>{warn}</div>
            ))}
          </div>
        )}

        {/* MONACO EDITOR WITH SMOOTH CURSOR WHEEL SCROLLING */}
        <div className="editor-wrapper">
          <Editor
            height="100%"
            defaultLanguage="sql"
            theme="vs-dark"
            value={sql}
            onChange={(value) => {
              setSql(value || '');
              analyzeAst(value || '');
            }}
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

        {/* TABULAR QUERY RESULTS VIEW */}
        {queryResult && queryResult.columns && queryResult.columns.length > 0 && (
          <div className="table-panel">
            <div className="console-header">Query Results Data Grid ({queryResult.data.length} Rows)</div>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    {queryResult.columns.map((col, idx) => (
                      <th key={idx}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {queryResult.data.map((row, rowIdx) => (
                    <tr key={rowIdx}>
                      {queryResult.columns.map((col, colIdx) => (
                        <td key={colIdx}>{row[col]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* LIVE TERMINAL / CONSOLE */}
        <div className="console-panel">
          <div className="console-header">Console Output & Exception Log</div>
          <div className="console-logs">
            {logs.map((log, index) => (
              <div key={index} className={`log-entry ${log.type}`}>
                {log.text}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
