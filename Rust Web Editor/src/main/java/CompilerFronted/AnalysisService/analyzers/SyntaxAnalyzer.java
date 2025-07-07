package CompilerFronted.AnalysisService.analyzers;

import CompilerFronted.Core.RustParser;
import CompilerFronted.AnalysisService.models.ErrorInfo;

import org.antlr.v4.runtime.*;
import org.antlr.v4.runtime.tree.ParseTree;

import java.util.ArrayList;
import java.util.List;

/**
 * 语法分析器包装类
 * 
 * 负责执行语法分析相关的操作，
 * 封装了 ANTLR 语法分析器的使用细节。
 * 
 * 职责：
 * - 创建和配置语法分析器
 * - 设置错误监听器
 * - 执行语法分析
 * - 收集语法错误
 * - 生成解析树
 * 
 * @author Compiler Frontend Team
 * @version 1.0
 * @date 2025-07-07
 */
public class SyntaxAnalyzer {
    
    private final TokenStream tokenStream;
    private RustParser parser;
    private List<ErrorInfo> errors;
    private ParseTree parseTree;
    
    /**
     * 构造函数
     * 
     * @param tokenStream Token 流
     */
    public SyntaxAnalyzer(TokenStream tokenStream) {
        this.tokenStream = tokenStream;
        this.errors = new ArrayList<>();
        initializeParser();
    }
    
    /**
     * 初始化语法分析器
     */
    private void initializeParser() {
        this.parser = new RustParser(tokenStream);
        setupErrorListener();
    }
    
    /**
     * 设置错误监听器
     */
    private void setupErrorListener() {
        parser.removeErrorListeners();
        parser.addErrorListener(new BaseErrorListener() {
            @Override
            public void syntaxError(Recognizer<?, ?> recognizer, Object offendingSymbol, 
                                  int line, int charPositionInLine, String msg, RecognitionException e) {
                errors.add(new ErrorInfo(line, charPositionInLine, msg));
            }
        });
    }
    
    /**
     * 执行语法分析
     * 
     * @return 解析树根节点
     */
    public ParseTree analyze() {
        if (parseTree == null) {
            parseTree = parser.crate();
        }
        return parseTree;
    }
    
    /**
     * 获取语法分析器实例
     * 
     * @return 语法分析器实例
     */
    public RustParser getParser() {
        return parser;
    }
    
    /**
     * 获取解析树
     * 
     * @return 解析树，如果尚未分析则返回 null
     */
    public ParseTree getParseTree() {
        return parseTree;
    }
    
    /**
     * 获取收集到的错误信息
     * 
     * @return 错误信息列表
     */
    public List<ErrorInfo> getErrors() {
        return new ArrayList<>(errors); // 返回副本以保护内部状态
    }
    
    /**
     * 检查是否有语法错误
     * 
     * @return 如果有错误返回 true
     */
    public boolean hasErrors() {
        return !errors.isEmpty();
    }
    
    /**
     * 清除错误信息
     */
    public void clearErrors() {
        errors.clear();
    }
}
