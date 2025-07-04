package main.java.compiler;

import com.google.gson.Gson;
import org.antlr.v4.runtime.*;
import org.antlr.v4.runtime.tree.ParseTree;

import java.util.List;

public class AnalysisService {

    /**
     * 接收 Rust 代码字符串，执行词法和语法分析，并返回结果。
     * @param rustCode 用户输入的 Rust 代码。
     * @return 一个包含分析结果（目前是LISP风格的解析树）的字符串。
     */
    public static String analyse(String rustCode) {
        try {
            // 1. 从字符串创建 CharStream
            CharStream input = CharStreams.fromString(rustCode);

            // 2. 创建词法分析器 (Lexer)
            RustLexer lexer = new RustLexer(input);

            // 3. 创建词法符号缓冲区
            CommonTokenStream tokens = new CommonTokenStream(lexer);

            // 4. 创建语法分析器 (Parser)
            RustParser parser = new RustParser(tokens);

            // 5. 开始分析，获取解析树
            ParseTree tree = parser.crate();

            // 6. 返回 LISP 风格的解析树字符串作为结果
            return tree.toStringTree(parser);

        } catch (Exception e) {
            // 如果在分析过程中发生任何错误，打印堆栈跟踪并返回错误信息
            e.printStackTrace();
            return "Error during analysis: " + e.getMessage();
        }
    }
}