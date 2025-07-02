package RustAnalyser;

import org.antlr.v4.runtime.*;
import org.antlr.v4.runtime.tree.*;
import org.antlr.v4.gui.TreeViewer;
import java.io.IOException;
import java.util.Arrays;
import javax.swing.JFrame;
import javax.swing.JPanel;
import java.awt.BorderLayout;

// 确保这里的包名与你的 ANTLR 生成文件所在的包名一致
// 如果你没有使用包，请删除下一行
import RustComplierFronted.*;


public class Main {
    public static void main(String[] args) {
        String rustFilePath = "res/RustCode/hellow.rs"; // Rust 文件的相对路径

        try {
            // 1. 创建一个 CharStream，从文件中读取字符
            CharStream input = CharStreams.fromFileName(rustFilePath);

            // 2. 创建一个词法分析器 (Lexer)，处理输入的 CharStream
            RustLexer lexer = new RustLexer(input);

            // 3. 创建一个词法符号的缓冲区，存储词法分析器生成的词法符号
            CommonTokenStream tokens = new CommonTokenStream(lexer);

            // 4. 创建一个语法分析器 (Parser)，处理词法符号缓冲区
            RustParser parser = new RustParser(tokens);

            // 5. 调用语法的起始规则（对于 Rust 通常是 'crate'）来开始分析
            ParseTree tree = parser.crate();

            // 6. (可选) 打印生成的分析树 (LISP-style)
            System.out.println("Parse Tree:");
            System.out.println(tree.toStringTree(parser));

            // 7. 显示 GUI 树形视图
            showTreeViewer(tree, parser);

            System.out.println("\nAnalysis finished successfully.");
            System.out.println("GUI tree viewer is now open. Close the window to exit.");

        } catch (IOException e) {
            System.err.println("Error reading file: " + rustFilePath);
            e.printStackTrace();
        } catch (Exception e) {
            System.err.println("An error occurred during parsing.");
            e.printStackTrace();
        }
    }

    /**
     * 显示语法分析树的 GUI 视图
     * @param tree 解析树
     * @param parser 解析器实例
     */
    private static void showTreeViewer(ParseTree tree, RustParser parser) {
        // 创建树查看器
        TreeViewer viewer = new TreeViewer(Arrays.asList(parser.getRuleNames()), tree);
        viewer.setScale(1.5); // 设置缩放比例，使树更容易阅读
        
        // 创建 JFrame 窗口
        JFrame frame = new JFrame("Rust Parse Tree Viewer");
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        frame.setSize(800, 600);
        
        // 将树查看器添加到窗口
        JPanel panel = new JPanel(new BorderLayout());
        panel.add(viewer, BorderLayout.CENTER);
        frame.add(panel);
        
        // 居中显示窗口
        frame.setLocationRelativeTo(null);
        frame.setVisible(true);
    }
}