package com.shadowbase.dto;

import java.util.List;

public class AstAnalysisResponse {
    private boolean hasRisk;
    private String riskLevel; // LOW, MEDIUM, HIGH
    private List<String> warnings;
    private int statementsParsed;

    public AstAnalysisResponse() {}

    public AstAnalysisResponse(boolean hasRisk, String riskLevel, List<String> warnings, int statementsParsed) {
        this.hasRisk = hasRisk;
        this.riskLevel = riskLevel;
        this.warnings = warnings;
        this.statementsParsed = statementsParsed;
    }

    public boolean isHasRisk() { return hasRisk; }
    public void setHasRisk(boolean hasRisk) { this.hasRisk = hasRisk; }

    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

    public List<String> getWarnings() { return warnings; }
    public void setWarnings(List<String> warnings) { this.warnings = warnings; }

    public int getStatementsParsed() { return statementsParsed; }
    public void setStatementsParsed(int statementsParsed) { this.statementsParsed = statementsParsed; }
}
