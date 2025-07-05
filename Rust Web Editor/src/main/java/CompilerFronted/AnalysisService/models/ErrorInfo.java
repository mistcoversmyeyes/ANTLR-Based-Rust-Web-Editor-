package main.java.CompilerFronted.AnalysisService.models;

public class ErrorInfo {
    public int line;
    public int column;
    public String message;

    public ErrorInfo(int line, int column, String message) {
        this.line = line;
        this.column = column;
        this.message = message;
    }

    // Getters
    public int getLine() { return line; }
    public int getColumn() { return column; }
    public String getMessage() { return message; }
}
