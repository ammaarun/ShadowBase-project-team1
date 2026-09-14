package com.shadowbase.service;

import com.shadowbase.dto.AstAnalysisResponse;
import net.sf.jsqlparser.parser.CCJSqlParserUtil;
import net.sf.jsqlparser.statement.Statement;
import net.sf.jsqlparser.statement.Statements;
import net.sf.jsqlparser.statement.alter.Alter;
import net.sf.jsqlparser.statement.alter.AlterExpression;
import net.sf.jsqlparser.statement.drop.Drop;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
public class SqlAstAnalysisService {

    /**
     * Parses DDL migration scripts into an Abstract Syntax Tree (AST) using JSqlParser,
     * calculates a 0-100 Risk Score, detects affected objects, and recommends safer alternatives.
     */
    public AstAnalysisResponse analyzeScript(String sql) {
        List<String> warnings = new ArrayList<>();
        List<String> detectedOperations = new ArrayList<>();
        Set<String> affectedTables = new LinkedHashSet<>();
        List<String> compatibilityIssues = new ArrayList<>();
        List<String> suggestedAlternatives = new ArrayList<>();

        boolean hasRisk = false;
        int riskScore = 10;
        String riskLevel = "LOW";
        int parsedCount = 0;
        String recommendation = "Safe to execute migration script against Shadow Database.";

        if (sql == null || sql.trim().isEmpty()) {
            return new AstAnalysisResponse(
                    false, "LOW", 0, List.of("SQL script is empty."), 0,
                    List.of(), List.of(), List.of(), List.of(), "No SQL statements provided."
            );
        }

        try {
            Statements statements = CCJSqlParserUtil.parseStatements(sql);
            parsedCount = statements.getStatements().size();

            for (Statement stmt : statements.getStatements()) {
                // 1. Check ALTER TABLE statements
                if (stmt instanceof Alter alter) {
                    String tableName = alter.getTable().getName();
                    affectedTables.add(tableName);

                    if (alter.getAlterExpressions() != null) {
                        for (AlterExpression alterExpr : alter.getAlterExpressions()) {
                            String exprStr = alterExpr.toString().toUpperCase();

                            if (exprStr.contains("DROP COLUMN") || exprStr.contains("DROP")) {
                                hasRisk = true;
                                riskScore = Math.max(riskScore, 85);
                                riskLevel = "HIGH";
                                detectedOperations.add("DROP COLUMN on table '" + tableName + "'");
                                warnings.add("⚠️ HIGH RISK AST WARNING: Migration drops column/constraint from table '" 
                                        + tableName + "'. Production traffic querying this column will throw exceptions!");
                                compatibilityIssues.add("Active production queries selecting from table '" + tableName + "' will crash with 'Column Not Found' errors.");
                                suggestedAlternatives.add("Use the Expand/Contract Pattern: Keep old column, mark as deprecated, deploy application code changes first, then drop column in a secondary migration.");
                            } else if (exprStr.contains("MODIFY") || exprStr.contains("TYPE") || exprStr.contains("ALTER COLUMN")) {
                                hasRisk = true;
                                riskScore = Math.max(riskScore, 45);
                                if (!"HIGH".equals(riskLevel) && !"CRITICAL".equals(riskLevel)) riskLevel = "MEDIUM";
                                detectedOperations.add("MODIFY COLUMN TYPE on table '" + tableName + "'");
                                warnings.add("⚡ MEDIUM RISK AST WARNING: Migration modifies column data type in table '" 
                                        + tableName + "'. Potential data truncation or type casting failure.");
                                compatibilityIssues.add("Column type change may cause implicit type coercion or truncation errors for active ORM models.");
                                suggestedAlternatives.add("Add a new column with the target data type, backfill data asynchronously, then switch application pointers.");
                            } else if (exprStr.contains("ADD")) {
                                detectedOperations.add("ADD COLUMN on table '" + tableName + "'");
                                warnings.add("ℹ️ Safe Operation: Adding new column to table '" + tableName + "'.");
                            }
                        }
                    }
                }
                // 2. Check DROP TABLE statements
                else if (stmt instanceof Drop drop) {
                    String objName = drop.getName() != null ? drop.getName().getName() : "unknown";
                    affectedTables.add(objName);
                    hasRisk = true;
                    riskScore = Math.max(riskScore, 95);
                    riskLevel = "CRITICAL";
                    detectedOperations.add("DROP TABLE '" + objName + "'");
                    warnings.add("💥 CRITICAL RISK AST WARNING: Migration drops entire database table/object '" + objName + "'.");
                    compatibilityIssues.add("Dropping table '" + objName + "' will permanently destroy all records and break all dependent application services!");
                    suggestedAlternatives.add("Verify zero active read/write database connections to table '" + objName + "' via APM tools before dropping table.");
                }
            }

            if (riskScore >= 86) {
                riskLevel = "CRITICAL";
                recommendation = "CRITICAL: Do NOT deploy to production without architectural sign-off. Test against CDC Traffic Shadowing first.";
            } else if (riskScore >= 51) {
                riskLevel = "HIGH";
                recommendation = "HIGH RISK: Test against live CDC Traffic Simulator in Shadow Sandbox before approving deployment.";
            } else if (riskScore >= 21) {
                riskLevel = "MEDIUM";
                recommendation = "MEDIUM RISK: Review column constraint modifications and backfill scripts.";
            } else {
                recommendation = "LOW RISK: Migration script follows zero-downtime guidelines. Safe to proceed.";
            }

            if (!hasRisk) {
                warnings.add("✅ AST Analysis Passed: Clean migration script. No destructive operations detected.");
            }

            return new AstAnalysisResponse(
                    hasRisk, riskLevel, riskScore, warnings, parsedCount,
                    detectedOperations, new ArrayList<>(affectedTables),
                    compatibilityIssues, suggestedAlternatives, recommendation
            );

        } catch (Exception e) {
            // Fallback string pattern matching for dialect variations
            String upperSql = sql.toUpperCase();
            if (upperSql.contains("DROP TABLE")) {
                return new AstAnalysisResponse(
                        true, "CRITICAL", 95,
                        List.of("💥 CRITICAL RISK AST WARNING: Destructive DROP TABLE operation detected!"), 1,
                        List.of("DROP TABLE"), List.of("Unknown"),
                        List.of("Table drop destroys records permanently."),
                        List.of("Archive table data before dropping."),
                        "CRITICAL: Do NOT deploy to production without architectural review."
                );
            } else if (upperSql.contains("DROP COLUMN") || upperSql.contains("DROP")) {
                return new AstAnalysisResponse(
                        true, "HIGH", 85,
                        List.of("⚠️ HIGH RISK AST WARNING: Destructive DROP COLUMN operation detected in migration script!"), 1,
                        List.of("DROP COLUMN"), List.of("Unknown"),
                        List.of("Existing production queries querying this column will fail."),
                        List.of("Follow Expand/Contract two-phase migration pattern."),
                        "HIGH RISK: Test against live CDC Traffic Simulator in Shadow Sandbox first."
                );
            }
            return new AstAnalysisResponse(
                    false, "LOW", 10,
                    List.of("ℹ️ AST Static Analysis Completed."), 1,
                    List.of("STANDARD SQL"), List.of(),
                    List.of(), List.of(),
                    "LOW RISK: Migration script appears clean."
            );
        }
    }
}
