package CompilerFronted.AnalysisService;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import CompilerFronted.AnalysisService.models.*;
import CompilerFronted.AnalysisService.utils.DotGenerator;
import CompilerFronted.Core.RustLexer;
import CompilerFronted.Core.RustParser;

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

public class AnalysisService {
    // 调试开关：设置为 true 时会保存分析结果到文件
    private static final boolean DEBUG_MODE = Boolean.parseBoolean(System.getProperty("analysis.debug", "true"));
    
    /**
     * 接收 Rust 代码字符串，执行词法和语法分析，并返回分析结果的JSON字符串。
     * 结果包含Token流、解析树（LISP和DOT格式）以及错误信息（如果有）。
     * 
     * @param rustCode 用户输入的 Rust 代码。
     * @return 包含分析结果的JSON字符串。
     */
    public static String analyse(String rustCode) {
        AnalysisResult result = new AnalysisResult();
        Gson gson = new GsonBuilder().setPrettyPrinting().create();

        try {
            // 1. 从字符串创建 CharStream
            CharStream input = CharStreams.fromString(rustCode);

            // 2. 创建词法分析器 (Lexer)
            RustLexer lexer = new RustLexer(input);
            
            // 3. 收集所有Token
            List<? extends Token> allTokens = lexer.getAllTokens();
            for (Token token : allTokens) {
                result.tokens.add(new TokenInfo(token));
            }
            
            // 重置lexer，为语法分析做准备
            lexer.reset();
            
            // 4. 创建词法符号缓冲区
            CommonTokenStream tokens = new CommonTokenStream(lexer);

            // 5. 创建语法分析器 (Parser)
            RustParser parser = new RustParser(tokens);

            // 6. 设置自定义的错误监听器
            parser.removeErrorListeners();
            parser.addErrorListener(new BaseErrorListener() {
                @Override
                public void syntaxError(Recognizer<?, ?> recognizer, Object offendingSymbol, 
                                      int line, int charPositionInLine, String msg, RecognitionException e) {
                    result.errors.add(new ErrorInfo(line, charPositionInLine, msg));
                }
            });

            // 7. 开始分析，获取解析树
            ParseTree tree = parser.crate();
            
            // 8. 生成树的表示
            result.parseTree.lisp = tree.toStringTree(parser);
            result.parseTree.dot = DotGenerator.generateDotString(tree, parser);
            
            // 9. 设置分析结果状态
            result.success = result.errors.isEmpty();
            
            // 10. 将结果转换为JSON
            String jsonResult = gson.toJson(result);
            
            // 11. 保存调试结果到文件（可选）
            if (DEBUG_MODE) {
                saveDebugResult(rustCode, jsonResult);
            }
            
            return jsonResult;

        } catch (Exception e) {
            // 如果发生意外错误，记录到errors中
            result.success = false;
            result.errors.add(new ErrorInfo(0, 0, "Unexpected error: " + e.getMessage()));
            e.printStackTrace();
            String jsonResult = gson.toJson(result);
            if (DEBUG_MODE) {
                saveDebugResult(rustCode, jsonResult);
            }
            return jsonResult;
        }
    }
    
    /**
     * 保存分析结果到 JSON 文件以便调试
     * 
     * @param rustCode 原始 Rust 代码
     * @param jsonResult 分析结果的 JSON 字符串
     */
    private static void saveDebugResult(String rustCode, String jsonResult) {
        try {
            // 创建调试输出目录
            Path debugDir = Paths.get("debug_output");
            if (!Files.exists(debugDir)) {
                Files.createDirectories(debugDir);
            }
            
            // 生成带时间戳的文件名
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss-SSS"));
            String fileName = "analysis_result_" + timestamp + ".json";
            Path filePath = debugDir.resolve(fileName);
            
            // 创建包含源代码和分析结果的完整调试信息
            DebugInfo debugInfo = new DebugInfo();
            debugInfo.timestamp = timestamp;
            debugInfo.sourceCode = rustCode;
            debugInfo.analysisResult = jsonResult;
            
            // 将调试信息写入文件
            Gson gson = new GsonBuilder().setPrettyPrinting().create();
            try (FileWriter writer = new FileWriter(filePath.toFile())) {
                gson.toJson(debugInfo, writer);
            }
            
            System.out.println("Debug result saved to: " + filePath.toAbsolutePath());
            
        } catch (IOException e) {
            System.err.println("Failed to save debug result: " + e.getMessage());
        }
    }
    
    /**
     * 调试信息的数据结构
     */
    private static class DebugInfo {
        public String timestamp;
        public String sourceCode;
        public String analysisResult;
    }
}