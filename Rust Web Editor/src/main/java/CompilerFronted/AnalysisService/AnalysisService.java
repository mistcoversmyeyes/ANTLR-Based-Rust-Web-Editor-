package main.java.CompilerFronted.AnalysisService;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import main.java.CompilerFronted.AnalysisService.models.*;
import main.java.CompilerFronted.AnalysisService.utils.DotGenerator;
import main.java.CompilerFronted.Core.RustLexer;
import main.java.CompilerFronted.Core.RustParser;

import org.antlr.v4.runtime.*;
import org.antlr.v4.runtime.tree.*;

import java.util.List;

public class AnalysisService {
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
            return gson.toJson(result);

        } catch (Exception e) {
            // 如果发生意外错误，记录到errors中
            result.success = false;
            result.errors.add(new ErrorInfo(0, 0, "Unexpected error: " + e.getMessage()));
            e.printStackTrace();
            return gson.toJson(result);
        }
    }
}