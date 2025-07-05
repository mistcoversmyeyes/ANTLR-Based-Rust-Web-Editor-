package CompilerFronted.AnalysisService.models;

import java.util.ArrayList;
import java.util.List;

public class AnalysisResult {
    public boolean success;
    public List<TokenInfo> tokens;
    public ParseTreeInfo parseTree;
    public List<ErrorInfo> errors;

    public AnalysisResult() {
        this.tokens = new ArrayList<>();
        this.errors = new ArrayList<>();
        this.parseTree = new ParseTreeInfo();
    }

    // Getters and Setters
    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    
    public List<TokenInfo> getTokens() { return tokens; }
    public void setTokens(List<TokenInfo> tokens) { this.tokens = tokens; }
    
    public ParseTreeInfo getParseTree() { return parseTree; }
    public void setParseTree(ParseTreeInfo parseTree) { this.parseTree = parseTree; }
    
    public List<ErrorInfo> getErrors() { return errors; }
    public void setErrors(List<ErrorInfo> errors) { this.errors = errors; }
}
