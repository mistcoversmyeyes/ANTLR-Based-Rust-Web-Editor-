package CompilerFronted.AnalysisService.analyzers;

import CompilerFronted.Core.RustLexer;
import org.antlr.v4.runtime.CharStream;
import org.antlr.v4.runtime.CharStreams;
import org.antlr.v4.runtime.Token;

import java.util.List;

/**
 * 词法分析器包装类
 * 
 * 负责执行词法分析相关的操作，
 * 封装了 ANTLR 词法分析器的使用细节。
 * 
 * 职责：
 * - 创建和配置词法分析器
 * - 执行词法分析
 * - 收集 Token 流
 * - 提供词法分析器实例供语法分析使用
 * 
 * @author Compiler Frontend Team
 * @version 1.0
 * @date 2025-07-07
 */
public class LexicalAnalyzer {
    
    private final String sourceCode;
    private RustLexer lexer;
    private List<? extends Token> tokens;
    
    /**
     * 构造函数
     * 
     * @param sourceCode 待分析的源代码
     */
    public LexicalAnalyzer(String sourceCode) {
        this.sourceCode = sourceCode;
        initializeLexer();
    }
    
    /**
     * 初始化词法分析器
     */
    private void initializeLexer() {
        CharStream input = CharStreams.fromString(sourceCode);
        this.lexer = new RustLexer(input);
    }
    
    /**
     * 执行词法分析
     * 
     * @return Token 列表
     */
    public List<? extends Token> analyze() {
        if (tokens == null) {
            tokens = lexer.getAllTokens();
            // 重置词法分析器以便后续语法分析使用
            lexer.reset();
        }
        return tokens;
    }
    
    /**
     * 获取词法分析器实例
     * 
     * @return 词法分析器实例
     */
    public RustLexer getLexer() {
        return lexer;
    }
    
    /**
     * 获取已分析的 Token 列表
     * 
     * @return Token 列表，如果尚未分析则返回 null
     */
    public List<? extends Token> getTokens() {
        return tokens;
    }
    
    /**
     * 重置词法分析器状态
     */
    public void reset() {
        lexer.reset();
        tokens = null;
    }
}
