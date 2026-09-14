package com.shadowbase.dto;

import java.util.List;

public class AstAnalysisResponse {
    private boolean hasRisk;
    private String riskLevel; // LOW, MEDIUM, HIGH, CRITICAL
    private int riskScore; // 0 - 100
    private List<String> warnings;
    private int statementsParsed;
    private List<String> detectedOperations;
    private List<String> affectedTables;
    private List<String> compatibilityIssues;
    private List<String> suggestedAlternatives;
    private String recommendation;

    public AstAnalysisResponse() {}

    public AstAnalysisResponse(boolean hasRisk, String riskLevel, int riskScore, List<String> warnings,
                               int statementsParsed, List<String> detectedOperations,
                               List<String> affectedTables, List<String> compatibilityIssues,
                               List<String> suggestedAlternatives, String recommendation) {
        this.hasRisk = hasRisk;
        this.riskLevel = riskLevel;
        this.riskScore = riskScore;
        this.warnings = warnings;
        this.statementsParsed = statementsParsed;
        this.detectedOperations = detectedOperations;
        this.affectedTables = affectedTables;
        this.compatibilityIssues = compatibilityIssues;
        this.suggestedAlternatives = suggestedAlternatives;
        this.recommendation = recommendation;
    }

    public boolean isHasRisk() { return hasRisk; }
    public void setHasRisk(boolean hasRisk) { this.hasRisk = hasRisk; }

    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

    public int getRiskScore() { return riskScore; }
    public void setRiskScore(int riskScore) { this.riskScore = riskScore; }

    public List<String> getWarnings() { return warnings; }
    public void setWarnings(List<String> warnings) { this.warnings = warnings; }

    public int getStatementsParsed() { return statementsParsed; }
    public void setStatementsParsed(int statementsParsed) { this.statementsParsed = statementsParsed; }

    public List<String> getDetectedOperations() { return detectedOperations; }
    public void setDetectedOperations(List<String> detectedOperations) { this.detectedOperations = detectedOperations; }

    public List<String> getAffectedTables() { return affectedTables; }
    public void setAffectedTables(List<String> affectedTables) { this.affectedTables = affectedTables; }

    public List<String> getCompatibilityIssues() { return compatibilityIssues; }
    public void setCompatibilityIssues(List<String> compatibilityIssues) { this.compatibilityIssues = compatibilityIssues; }

    public List<String> getSuggestedAlternatives() { return suggestedAlternatives; }
    public void setSuggestedAlternatives(List<String> suggestedAlternatives) { this.suggestedAlternatives = suggestedAlternatives; }

    public String getRecommendation() { return recommendation; }
    public void setRecommendation(String recommendation) { this.recommendation = recommendation; }
}
