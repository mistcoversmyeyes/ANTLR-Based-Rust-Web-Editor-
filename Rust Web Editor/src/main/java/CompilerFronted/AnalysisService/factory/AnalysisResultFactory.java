package CompilerFronted.AnalysisService.factory;

import CompilerFronted.AnalysisService.models.*;
import CompilerFronted.AnalysisService.utils.CSTGenerator;
import CompilerFronted.AnalysisService.utils.ASTGenerator;
import CompilerFronted.Core.RustParser;

import org.antlr.v4.runtime.Token;
import org.antlr.v4.runtime.tree.ParseTree;

import java.util.List;

/**
 * 分析结果工厂类
 * 
 * 负责创建和组装 AnalysisResult 对象，
 * 将不同组件的分析结果统一整合。
 * 
 * 职责：
 * - 创建 AnalysisResult 对象
 * - 整合 Token 流信息
 * - 整合 ParseTree 信息
 * - 整合 AST 信息
 * - 整合错误信息
 * - 设置分析状态
 * 
 * @author Compiler Frontend Team
 * @version 1.0
 * @date 2025-07-07
 */
public class AnalysisResultFactory {
    
    /**
     * 创建完整的分析结果
     * 
     * @param tokens Token 流
     * @param parseTree 解析树
     * @param parser 语法分析器
     * @param errors 错误列表
     * @return 完整的分析结果对象
     */
    public static AnalysisResult createAnalysisResult(List<? extends Token> tokens, 
                                                    ParseTree parseTree, 
                                                    RustParser parser, 
                                                    List<ErrorInfo> errors) {
        AnalysisResult result = new AnalysisResult();
        
        // 1. 设置分析状态
        result.setSuccess(errors.isEmpty());
        
        // 2. 处理 Token 流
        populateTokens(result, tokens);
        
        // 3. 处理 ParseTree
        populateParseTree(result, parseTree, parser);
        
        // 4. 处理 AST
        populateAST(result, parseTree, parser);
        
        // 5. 设置错误信息
        result.setErrors(errors);
        
        return result;
    }
    
    /**
     * 创建空的分析结果（用于异常情况）
     * 
     * @param errorMessage 错误消息
     * @return 包含错误信息的分析结果
     */
    public static AnalysisResult createErrorResult(String errorMessage) {
        AnalysisResult result = new AnalysisResult();
        result.setSuccess(false);
        result.getErrors().add(new ErrorInfo(0, 0, "Unexpected error: " + errorMessage));
        return result;
    }
    
    /**
     * 填充 Token 信息
     */
    private static void populateTokens(AnalysisResult result, List<? extends Token> tokens) {
        for (Token token : tokens) {
            result.getTokens().add(new TokenInfo(token));
        }
    }
    
    /**
     * 填充 ParseTree 信息
     */
    private static void populateParseTree(AnalysisResult result, ParseTree parseTree, RustParser parser) {
        ParseTreeInfo parseTreeInfo = result.getParseTree();
        
        // 生成 LISP 格式
        parseTreeInfo.lisp = parseTree.toStringTree(parser);
        
        // 生成 DOT 格式（用于 ParseTree 可视化）
        parseTreeInfo.dot = CSTGenerator.generateDotString(parseTree, parser);
    }
    
    /**
     * 填充 AST 信息
     */
    private static void populateAST(AnalysisResult result, ParseTree parseTree, RustParser parser) {
        try {
            // 生成 AST
            ASTGenerator.ASTNode astRoot = ASTGenerator.generateAST(parseTree, parser);
            
            if (astRoot != null) {
                // 获取 AST 信息对象
                ASTInfo astInfo = result.ast;
                
                // 生成 AST 的 DOT 表示
                String astDot = ASTGenerator.generateASTDotString(astRoot);
                astInfo.setDot(astDot);
                
                System.out.println("AST generated successfully, DOT length: " + astDot.length());
            } else {
                // AST 生成失败，设置空的 DOT 字符串
                result.ast.setDot("");
                System.out.println("AST generation returned null");
            }
        } catch (Exception e) {
            System.err.println("Failed to generate AST: " + e.getMessage());
            // AST 生成失败，设置空的 DOT 字符串
            result.ast.setDot("");
        }
    }
}
