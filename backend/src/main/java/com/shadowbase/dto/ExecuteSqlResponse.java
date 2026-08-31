package com.shadowbase.dto;

import java.util.List;
import java.util.Map;

public class ExecuteSqlResponse {
    private boolean success;
    private String message;
    private String errorDetails;
    private int rowsAffected;
    private List<String> columns;
    private List<Map<String, Object>> data;

    public ExecuteSqlResponse() {}

    public ExecuteSqlResponse(boolean success, String message, String errorDetails, int rowsAffected, List<String> columns, List<Map<String, Object>> data) {
        this.success = success;
        this.message = message;
        this.errorDetails = errorDetails;
        this.rowsAffected = rowsAffected;
        this.columns = columns;
        this.data = data;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getErrorDetails() {
        return errorDetails;
    }

    public void setErrorDetails(String errorDetails) {
        this.errorDetails = errorDetails;
    }

    public int getRowsAffected() {
        return rowsAffected;
    }

    public void setRowsAffected(int rowsAffected) {
        this.rowsAffected = rowsAffected;
    }

    public List<String> getColumns() {
        return columns;
    }

    public void setColumns(List<String> columns) {
        this.columns = columns;
    }

    public List<Map<String, Object>> getData() {
        return data;
    }

    public void setData(List<Map<String, Object>> data) {
        this.data = data;
    }
}
