package CompilerFronted.AnalysisService;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import CompilerFronted.AnalysisService.models.*;
import CompilerFronted.AnalysisService.factory.AnalysisResultFactory;
import CompilerFronted.AnalysisService.analyzers.LexicalAnalyzer;
import CompilerFronted.AnalysisService.analyzers.SyntaxAnalyzer;

import org.antlr.v4.runtime.*;
import org.antlr.v4.runtime.tree.*;

import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Rust 代码分析服务
 * 
 * 面向对象重构版本，职责清晰分离：
 * - 协调词法分析和语法分析过程
 * - 管理分析状态和配置
 * - 提供分析结果的 JSON 序列化
 * - 处理调试信息的保存
 * 
 * 设计原则：
 * - 单一职责：每个组件只负责特定的分析任务
 * - 开闭原则：易于扩展新的分析功能
 * - 依赖倒置：依赖抽象而非具体实现
 * 
 * @author Compiler Frontend Team
 * @version 2.0 (面向对象重构版)
 * @date 2025-07-07
 */
public class AnalysisService {
    
    // 配置选项
    private static final boolean DEBUG_MODE = true;
    
    // 核心组件
    private final String sourceCode;
    private final Gson gson;
    
    // 分析器组件
    private LexicalAnalyzer lexicalAnalyzer;    // 对antlr4 提供的词法分析服务的封装
    private SyntaxAnalyzer syntaxAnalyzer;      // 对antlr4 提供的语法分析服务的封装
    
    // 分析状态
    private boolean analyzed;               // 记录当前分析状态，如果已经走完全部流程创建出了分析结果，就置为 true         
    private AnalysisResult analysisResult;  // 分析服务需要返回的内容，包含分析成功与否，token流，分析树信息（LISP && ST && AST）,报错信息 
    
    /**
     * 构造函数
     * 
     * @param sourceCode 待分析的 Rust 源代码
     */
    public AnalysisService(String sourceCode) {
        this.sourceCode = sourceCode;
        this.gson = new GsonBuilder().setPrettyPrinting().create();
        this.analyzed = false;
        
        initializeAnalyzers();
    }
    
    /**
     * 静态工厂方法，保持向后兼容
     * 
     * @param rustCode 用户输入的 Rust 代码
     * @return 包含分析结果的 JSON 字符串
     */
    public static String analyse(String rustCode) {
        AnalysisService service = new AnalysisService(rustCode);
        return service.performAnalysis();
    }
    
    /**
     * 执行完整的分析流程
     * 
     * @return 分析结果的 JSON 字符串
     */
    public String performAnalysis() {
        try {
            // 1. 执行词法分析
            List<? extends Token> tokens = lexicalAnalyzer.analyze();
            
            // 2. 创建 Token 流并执行语法分析
            CommonTokenStream tokenStream = new CommonTokenStream(lexicalAnalyzer.getLexer());
            syntaxAnalyzer = new SyntaxAnalyzer(tokenStream);
            ParseTree parseTree = syntaxAnalyzer.analyze();
            
            // 3. 使用工厂创建分析结果
            analysisResult = AnalysisResultFactory.createAnalysisResult(
                tokens, 
                parseTree, 
                syntaxAnalyzer.getParser(), 
                syntaxAnalyzer.getErrors()
            );
            
            analyzed = true;
            
            // 4. 序列化为 JSON
            String jsonResult = gson.toJson(analysisResult);
            
            // 5. 保存调试信息
            if (DEBUG_MODE) {
                saveDebugResult();
            }
            
            return jsonResult;
            
        } catch (Exception e) {
            // 异常处理：创建错误结果
            analysisResult = AnalysisResultFactory.createErrorResult(e.getMessage());
            e.printStackTrace();
            
            String jsonResult = gson.toJson(analysisResult);
            
            if (DEBUG_MODE) {
                saveDebugResult();
            }
            
            return jsonResult;
        }
    }
    
    /**
     * 初始化分析器组件
     */
    private void initializeAnalyzers() {
        this.lexicalAnalyzer = new LexicalAnalyzer(sourceCode);
    }
    
    /**
     * 获取分析结果对象
     * 
     * @return 分析结果，如果尚未分析则返回 null
     */
    public AnalysisResult getAnalysisResult() {
        return analyzed ? analysisResult : null;
    }
    
    /**
     * 获取词法分析器
     * 
     * @return 词法分析器实例
     */
    public LexicalAnalyzer getLexicalAnalyzer() {
        return lexicalAnalyzer;
    }
    
    /**
     * 获取语法分析器
     * 
     * @return 语法分析器实例，如果尚未创建则返回 null
     */
    public SyntaxAnalyzer getSyntaxAnalyzer() {
        return syntaxAnalyzer;
    }
    
    /**
     * 检查是否已完成分析
     * 
     * @return 如果已分析返回 true
     */
    public boolean isAnalyzed() {
        return analyzed;
    }
    
    /**
     * 重置分析状态，允许重新分析
     */
    public void reset() {
        analyzed = false;
        analysisResult = null;
        lexicalAnalyzer.reset();
        if (syntaxAnalyzer != null) {
            syntaxAnalyzer.clearErrors();
        }
    }
    
    /**
     * 保存调试结果到文件
     */
    private void saveDebugResult() {
        try {
            // 创建调试输出目录
            Path debugDir = Paths.get("debug_output");
            if (!Files.exists(debugDir)) {
                Files.createDirectories(debugDir);
            }
            
            // 生成时间戳
            String timestamp = LocalDateTime.now()
                .format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss-SSS"));
            
            // 保存完整调试信息
            String debugFileName = "debug_" + timestamp + ".json";
            Path debugFilePath = debugDir.resolve(debugFileName);
            
            DebugInfo debugInfo = new DebugInfo();
            debugInfo.timestamp = timestamp;
            debugInfo.sourceCode = sourceCode;
            debugInfo.analysisResult = analysisResult;
            
            // 保存分析结果
            String resultFileName = "analysis_result_" + timestamp + ".json";
            Path resultFilePath = debugDir.resolve(resultFileName);
            
            // 写入文件
            try (FileWriter debugWriter = new FileWriter(debugFilePath.toFile());
                 FileWriter resultWriter = new FileWriter(resultFilePath.toFile())) {
                
                gson.toJson(debugInfo, debugWriter);
                gson.toJson(analysisResult, resultWriter);
            }
            
            System.out.println("Debug files saved:");
            System.out.println("  Full debug info: " + debugFilePath.toAbsolutePath());
            System.out.println("  Analysis result: " + resultFilePath.toAbsolutePath());
            
        } catch (IOException e) {
            System.err.println("Failed to save debug result: " + e.getMessage());
        }
    }
    
    /**
     * 调试信息数据结构
     */
    private static class DebugInfo {
        public String timestamp;
        public String sourceCode;
        public AnalysisResult analysisResult;
    }
}