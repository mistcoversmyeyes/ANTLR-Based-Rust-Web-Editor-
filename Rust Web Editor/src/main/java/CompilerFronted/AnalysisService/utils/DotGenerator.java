package CompilerFronted.AnalysisService.utils;

import org.antlr.v4.runtime.tree.ParseTree;
import org.antlr.v4.runtime.tree.Trees;
import org.antlr.v4.runtime.tree.TerminalNode;

import CompilerFronted.Core.RustParser;

import java.util.concurrent.atomic.AtomicInteger;

/**
 * DOT 格式生成器
 * 
 * 负责将 ANTLR 解析树转换为 Graphviz DOT 格式的字符串，
 * 用于在前端可视化显示解析树结构。
 * 
 * 修复版本说明：
 * - 解决了节点ID重复分配的问题
 * - 改进了递归遍历算法
 * - 确保每个节点都有唯一的ID
 * - 正确处理父子节点之间的连接关系
 * 
 * @author Compiler Frontend Team
 * @version 2.0 (修复版本)
 * @date 2025-07-07
 */
public class DotGenerator {
    
    /**
     * 生成解析树的 DOT 格式字符串
     * 
     * @param tree 待转换的解析树根节点
     * @param parser Rust语法分析器实例，用于获取规则名称
     * @return 完整的 DOT 格式字符串，可直接用于 Graphviz 渲染
     */
    public static String generateDotString(ParseTree tree, RustParser parser) {
        StringBuilder dot = new StringBuilder();
        AtomicInteger nodeIdCounter = new AtomicInteger(0);
        
        // DOT 文件头部：定义有向图
        dot.append("digraph ParseTree {\n");
        dot.append("  rankdir=TB;\n");  // 从上到下布局
        dot.append("  node [shape=ellipse, style=filled, fillcolor=lightblue];\n");  // 节点样式
        dot.append("  edge [color=black];\n");  // 边的样式
        dot.append("\n");
        
        // 递归生成所有节点和连接关系
        generateDotRecursive(tree, parser, dot, nodeIdCounter, -1);
        
        // DOT 文件尾部
        dot.append("}\n");
        
        return dot.toString();
    }

    /**
     * 递归生成 DOT 节点和连接关系
     * 
     * 核心算法说明：
     * 1. 为当前节点分配唯一ID并生成节点定义
     * 2. 递归处理所有子节点
     * 3. 为每个子节点创建从父节点到子节点的连接
     * 4. 使用 AtomicInteger 确保ID的唯一性和线程安全性
     * 
     * @param tree 当前处理的解析树节点
     * @param parser Rust语法分析器实例
     * @param dot DOT字符串构建器
     * @param nodeIdCounter 全局节点ID计数器，确保ID唯一性
     * @param parentId 父节点的ID，-1表示根节点
     * @return 当前节点的ID
     */
    private static int generateDotRecursive(ParseTree tree, RustParser parser, 
                                          StringBuilder dot, AtomicInteger nodeIdCounter, int parentId) {
        
        // 为当前节点分配唯一ID
        int currentNodeId = nodeIdCounter.getAndIncrement();
        
        // 获取节点的文本表示
        String nodeText = getNodeDisplayText(tree, parser);
        String escapedLabel = escapeDotLabel(nodeText);
        
        // 根据节点类型设置不同的样式
        String nodeStyle = getNodeStyle(tree);
        
        // 生成当前节点的DOT定义
        dot.append(String.format("  node%d [label=\"%s\"%s];\n", 
                                currentNodeId, escapedLabel, nodeStyle));
        
        // 如果有父节点，则创建从父节点到当前节点的连接
        if (parentId >= 0) {
            dot.append(String.format("  node%d -> node%d;\n", parentId, currentNodeId));
        }
        
        // 递归处理所有子节点
        int childCount = tree.getChildCount();
        for (int i = 0; i < childCount; i++) {
            ParseTree child = tree.getChild(i);
            // 递归调用，传递当前节点ID作为父节点ID
            generateDotRecursive(child, parser, dot, nodeIdCounter, currentNodeId);
        }
        
        return currentNodeId;
    }
    
    /**
     * 获取节点的显示文本
     * 
     * 根据节点类型返回合适的显示文本：
     * - 终端节点：返回实际的文本内容
     * - 非终端节点：返回语法规则名称
     * 
     * @param tree 解析树节点
     * @param parser 语法分析器实例
     * @return 适合显示的节点文本
     */
    private static String getNodeDisplayText(ParseTree tree, RustParser parser) {
        if (tree instanceof TerminalNode) {
            // 终端节点：显示实际的Token文本
            TerminalNode terminal = (TerminalNode) tree;
            String text = terminal.getText();
            
            // 对特殊Token进行友好显示
            if (text.equals("<EOF>")) {
                return "EOF";
            } else if (text.trim().isEmpty()) {
                // 处理空白字符
                if (text.equals(" ")) {
                    return "SPACE";
                } else if (text.equals("\n")) {
                    return "NEWLINE";
                } else if (text.equals("\t")) {
                    return "TAB";
                } else {
                    return "WHITESPACE";
                }
            }
            return text;
        } else {
            // 非终端节点：显示语法规则名称
            return Trees.getNodeText(tree, parser);
        }
    }
    
    /**
     * 根据节点类型获取相应的DOT样式
     * 
     * @param tree 解析树节点
     * @return DOT格式的样式字符串
     */
    private static String getNodeStyle(ParseTree tree) {
        if (tree instanceof TerminalNode) {
            // 终端节点使用矩形，浅绿色填充
            return ", shape=box, fillcolor=lightgreen";
        } else {
            // 非终端节点使用椭圆，浅蓝色填充（默认样式）
            return "";
        }
    }

    /**
     * 转义 DOT 格式中的特殊字符
     * 
     * DOT 格式要求对节点标签中的特殊字符进行转义，
     * 以避免语法错误和显示问题。
     * 
     * 转义规则：
     * - 反斜杠 \ → \\（必须最先处理，避免二次转义）
     * - 双引号 " → \"（DOT格式要求）
     * - 换行符 \n → \\n（显示为文本）
     * - 制表符 \t → \\t（显示为文本）
     * - 回车符 \r → \\r（显示为文本）
     * 
     * @param text 需要转义的原始文本
     * @return 转义后的安全文本
     */
    public static String escapeDotLabel(String text) {
        if (text == null) {
            return "";
        }
        
        return text
            .replace("\\", "\\\\")   // 反斜杠转义（必须最先处理）
            .replace("\"", "\\\"")   // 双引号转义
            .replace("\n", "\\n")    // 换行符转义
            .replace("\t", "\\t")    // 制表符转义
            .replace("\r", "\\r");   // 回车符转义
    }
}
