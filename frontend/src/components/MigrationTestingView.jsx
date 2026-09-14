import React from 'react';
import Editor from '@monaco-editor/react';
import RiskScorePanel from './RiskScorePanel';

function MigrationTestingView({
  environment,
  productionDb,
  loading,
  sql,
  setSql,
  astResult,
  analyzeAst,
  exportMigrationScript,
  seedEnvironment,
  fetchTables,
  fetchUsers,
  executeSqlScript,
  queryResult,
  logs
}) {
  return (
    <div className="migration-testing-view">
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

      {/* ENHANCED AST RISK SCORE PANEL */}
      <RiskScorePanel astResult={astResult} />

      {/* PRE-FLIGHT AST RISK WARNING BANNER */}
      {astResult && astResult.warnings && astResult.warnings.length > 0 && (
        <div className={`ast-banner ${astResult.riskLevel}`}>
          {astResult.warnings.map((warn, i) => (
            <div key={i}>{warn}</div>
          ))}
        </div>
      )}

      {/* MONACO EDITOR */}
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
    </div>
  );
}

export default MigrationTestingView;
