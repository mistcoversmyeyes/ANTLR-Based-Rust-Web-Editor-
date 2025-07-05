package CompilerFronted.AnalysisService.models;

import org.antlr.v4.runtime.Token;
import org.antlr.v4.runtime.Vocabulary;

import CompilerFronted.Core.RustParser;

public class TokenInfo {
    public String type;
    public String text;
    public int line;
    public int column;

    public TokenInfo(Token token) {
        this.type = token.getType() > 0 ? RustParser.VOCABULARY.getSymbolicName(token.getType()) : "EOF";
        this.text = token.getText();
        this.line = token.getLine();
        this.column = token.getCharPositionInLine();
    }

    // Getters
    public String getType() { return type; }
    public String getText() { return text; }
    public int getLine() { return line; }
    public int getColumn() { return column; }

    // toString
}
