import React from 'react';

function RiskScorePanel({ astResult }) {
  if (!astResult) return null;

  const score = astResult.riskScore || 10;
  const level = astResult.riskLevel || 'LOW';

  const getGaugeColor = (lvl) => {
    switch (lvl) {
      case 'CRITICAL': return 'var(--danger)';
      case 'HIGH': return '#f43f5e';
      case 'MEDIUM': return 'var(--warning)';
      case 'LOW': return 'var(--success)';
      default: return 'var(--success)';
    }
  };

  return (
    <div className={`risk-score-panel ${level}`}>
      <div className="risk-score-header">
        <div className="risk-score-gauge">
          <div className="score-circle-wrapper">
            <div className="score-value" style={{ color: getGaugeColor(level) }}>
              {score}
            </div>
            <div className="score-denom">/100</div>
          </div>
          <div className="score-label">
            <span className="score-title">MIGRATION RISK SCORE</span>
            <span className={`risk-pill banner-${level?.toLowerCase()}`} style={{ fontSize: '0.85rem', marginTop: '4px', display: 'inline-block' }}>
              {level} RISK LEVEL
            </span>
          </div>
        </div>

        <div className="risk-progress-bar flex-1">
          <div className="progress-track" style={{ height: '14px' }}>
            <div
              className={`progress-fill ${level?.toLowerCase()}`}
              style={{
                width: `${score}%`,
                background: getGaugeColor(level)
              }}
            ></div>
          </div>
          <div className="recommendation-box" style={{ marginTop: '8px' }}>
            <strong>Verdict:</strong> {astResult.recommendation}
          </div>
        </div>
      </div>

      <div className="risk-score-body">
        {/* DETECTED OPERATIONS */}
        {astResult.detectedOperations && astResult.detectedOperations.length > 0 && (
          <div className="risk-section">
            <h5>🔍 Detected Operations ({astResult.detectedOperations.length})</h5>
            <div className="tag-group">
              {astResult.detectedOperations.map((op, i) => (
                <span key={i} className="op-tag">{op}</span>
              ))}
            </div>
          </div>
        )}

        {/* AFFECTED TABLES */}
        {astResult.affectedTables && astResult.affectedTables.length > 0 && (
          <div className="risk-section">
            <h5>🎯 Affected Targets</h5>
            <div className="tag-group">
              {astResult.affectedTables.map((tbl, i) => (
                <span key={i} className="table-tag"><code>{tbl}</code></span>
              ))}
            </div>
          </div>
        )}

        {/* COMPATIBILITY ISSUES */}
        {astResult.compatibilityIssues && astResult.compatibilityIssues.length > 0 && (
          <div className="risk-section danger-bg">
            <h5 className="text-danger">⚠️ Potential Production Compatibility Issues</h5>
            <ul>
              {astResult.compatibilityIssues.map((issue, i) => (
                <li key={i}>{issue}</li>
              ))}
            </ul>
          </div>
        )}

        {/* SAFER ALTERNATIVES */}
        {astResult.suggestedAlternatives && astResult.suggestedAlternatives.length > 0 && (
          <div className="risk-section success-bg">
            <h5 className="text-success">💡 Recommended Safer Migration Strategy</h5>
            <ul>
              {astResult.suggestedAlternatives.map((alt, i) => (
                <li key={i}>{alt}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default RiskScorePanel;
