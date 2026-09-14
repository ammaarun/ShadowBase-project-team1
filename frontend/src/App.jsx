import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import MigrationTestingView from './components/MigrationTestingView';
import MigrationHistoryView from './components/MigrationHistoryView';
import './index.css';

const DEFAULT_MIGRATION_SQL = `-- ShadowBase Schema Migration Script
-- Write your migration SQL here to test against the active container environment

ALTER TABLE users ADD COLUMN bio VARCHAR(255);
`;

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [environment, setEnvironment] = useState(null);
  const [productionDb, setProductionDb] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sql, setSql] = useState(DEFAULT_MIGRATION_SQL);
  const [astResult, setAstResult] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);

  const [logs, setLogs] = useState([
    { type: 'info', text: 'ShadowBase Platform ready. Select a tab to navigate.' }
  ]);
  const [queryResult, setQueryResult] = useState(null);

  const addLog = (type, text) => {
    setLogs((prev) => [...prev, { type, text: `[${new Date().toLocaleTimeString()}] ${text}` }]);
  };

  // Fetch Dashboard Stats from Backend
  const fetchDashboardStats = async () => {
    try {
      const res = await fetch('http://localhost:8081/api/dashboard/stats');
      if (res.ok) {
        const data = await res.json();
        setDashboardStats(data);
      }
    } catch (e) {
      console.error("Error fetching dashboard stats:", e);
    }
  };

  // Poll Production DB Status & Dashboard Stats
  useEffect(() => {
    fetchDashboardStats();
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
        fetchDashboardStats();
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
      fetchDashboardStats();
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
      fetchDashboardStats();
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
      const sqlQuery = `INSERT INTO users (name, email) VALUES ('User_${randomId}', 'user_${randomId}@prod.com');`;
      const response = await fetch('http://localhost:8081/api/production/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: sqlQuery })
      });
      const data = await response.json();
      if (data.success) {
        addLog('success', `Production Transaction Captured: ${data.message}`);
        const statusRes = await fetch('http://localhost:8081/api/production/status');
        const statusData = await statusRes.json();
        setProductionDb(statusData);
        fetchDashboardStats();
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
        fetchDashboardStats();
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
        fetchDashboardStats();
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
      fetchDashboardStats();
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
      fetchDashboardStats();
    } catch (e) {
      addLog('error', `Error stopping Production DB: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* UNIFIED SIDEBAR */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeContainersCount={environment ? 1 : 0}
        cdcOnline={!!productionDb}
      />

      {/* MAIN VIEW AREA */}
      <div className="app-main">
        <Navbar
          activeTab={activeTab}
          stats={dashboardStats}
          onRefresh={fetchDashboardStats}
        />

        <div className="view-container">
          {activeTab === 'dashboard' && (
            <DashboardView
              stats={dashboardStats}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'migration' && (
            <MigrationTestingView
              environment={environment}
              productionDb={productionDb}
              loading={loading}
              sql={sql}
              setSql={setSql}
              astResult={astResult}
              analyzeAst={analyzeAst}
              exportMigrationScript={exportMigrationScript}
              seedEnvironment={seedEnvironment}
              fetchTables={fetchTables}
              fetchUsers={fetchUsers}
              executeSqlScript={executeSqlScript}
              queryResult={queryResult}
              logs={logs}
            />
          )}

          {activeTab === 'databases' && (
            <div className="card-panel">
              <div className="panel-header">
                <h3>Database Environments & Container Controls</h3>
              </div>
              <div className="control-panel" style={{ display: 'flex', gap: '12px', marginTop: '14px' }}>
                {!environment ? (
                  <button className="btn btn-primary" onClick={startEnvironment} disabled={loading}>
                    {loading ? "Starting..." : "🚀 Start Shadow DB Container"}
                  </button>
                ) : (
                  <button className="btn btn-danger" onClick={stopEnvironment} disabled={loading}>
                    🛑 Destroy Shadow DB ({environment.environmentId.substring(0, 8)}...)
                  </button>
                )}

                {!productionDb ? (
                  <button className="btn btn-secondary" onClick={startProductionDb} disabled={loading}>
                    📡 Start Production DB (WAL CDC)
                  </button>
                ) : (
                  <>
                    <button className="btn btn-warning" onClick={simulateProductionTraffic} disabled={loading}>
                      ⚡ Simulate Live Traffic
                    </button>
                    <button className="btn btn-danger" onClick={stopProductionDb} disabled={loading}>
                      🛑 Stop Production DB
                    </button>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                <div className="health-item flex-1">
                  <h4>Shadow Sandbox Status</h4>
                  {environment ? (
                    <div style={{ marginTop: '8px' }}>
                      <span className="status-badge-sm healthy">Active Container</span>
                      <p style={{ fontFamily: 'monospace', fontSize: '0.8rem', marginTop: '6px' }}>{environment.jdbcUrl}</p>
                    </div>
                  ) : (
                    <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '6px' }}>Offline - Click Start Shadow DB to provision a Testcontainer sandbox.</p>
                  )}
                </div>

                <div className="health-item flex-1">
                  <h4>Production CDC Engine Status</h4>
                  {productionDb ? (
                    <div style={{ marginTop: '8px' }}>
                      <span className="status-badge-sm healthy">WAL Logical Mode Online</span>
                      <p style={{ fontSize: '0.85rem', marginTop: '6px' }}>CDC Events Captured: <strong>{productionDb.cdcEventsCaptured || 0}</strong></p>
                    </div>
                  ) : (
                    <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '6px' }}>CDC Offline - Click Start Production DB to capture change logs.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <MigrationHistoryView />
          )}

          {activeTab === 'diff' && (
            <div className="card-panel">
              <div className="panel-header">
                <h3>Schema Diff Viewer</h3>
                <span className="text-muted">Feature 3 Implementation Target</span>
              </div>
              <p className="text-muted" style={{ padding: '20px 0' }}>
                GitHub-style Visual Schema Diff Viewer will be activated in Feature 3!
              </p>
            </div>
          )}

          {activeTab === 'workspace' && (
            <div className="card-panel">
              <div className="panel-header">
                <h3>Dedicated SQL Workspace</h3>
                <span className="text-muted">Feature 5 Implementation Target</span>
              </div>
              <p className="text-muted" style={{ padding: '20px 0' }}>
                Dedicated SQL Query Console will be activated in Feature 5!
              </p>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="card-panel">
              <div className="panel-header">
                <h3>System & CDC Audit Logs</h3>
              </div>
              <div className="console-panel" style={{ height: '300px', marginTop: '10px' }}>
                <div className="console-logs">
                  {logs.map((log, index) => (
                    <div key={index} className={`log-entry ${log.type}`}>
                      {log.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="card-panel">
              <div className="panel-header">
                <h3>Platform & Engine Configurations</h3>
              </div>
              <div className="health-grid" style={{ marginTop: '14px' }}>
                <div className="health-item">
                  <div className="health-item-title">
                    <span>Engine Version</span>
                    <span>v2.4.0-RELEASE</span>
                  </div>
                </div>
                <div className="health-item">
                  <div className="health-item-title">
                    <span>Testcontainers Image</span>
                    <span>postgres:15-alpine</span>
                  </div>
                </div>
                <div className="health-item">
                  <div className="health-item-title">
                    <span>AST Static Parser</span>
                    <span>com.github.jsqlparser:jsqlparser:4.9</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
