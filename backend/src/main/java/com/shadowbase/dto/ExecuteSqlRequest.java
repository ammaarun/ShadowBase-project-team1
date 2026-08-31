package com.shadowbase.dto;

public class ExecuteSqlRequest {
    private String sql;

    public ExecuteSqlRequest() {}

    public ExecuteSqlRequest(String sql) {
        this.sql = sql;
    }

    public String getSql() {
        return sql;
    }

    public void setSql(String sql) {
        this.sql = sql;
    }
}
