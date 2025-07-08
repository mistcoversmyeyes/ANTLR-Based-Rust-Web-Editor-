package CompilerFronted.AnalysisService.utils;

import org.antlr.v4.runtime.tree.ParseTree;
import org.antlr.v4.runtime.tree.Trees;
import org.antlr.v4.runtime.tree.TerminalNode;

import CompilerFronted.Core.RustParser;

import java.util.concurrent.atomic.AtomicInteger;

/**
 * CST (具体语法树) 可视化生成器
 * 
 * 负责将 ANTLR 原生解析树 (ParseTree/CST) 转换为 Graphviz DOT 格式，
 * 用于在前端完整地可视化显示具体语法分析过程和结果。
 * 
 * 术语说明：
 * - CST (Concrete Syntax Tree)：具体语法树，保留完整语法信息
 * - AST (Abstract Syntax Tree)：抽象语法树，简化语义结构
 * 
 * 与 ASTGenerator 的区别：
 * - CSTGenerator：保留完整的语法分析信息，包括所有终结符和非终结符
 * - ASTGenerator：生成简化的抽象语法树，去除语法糖和冗余结构
 * 
 * CST 特点：
 * - 包含所有语法规则推导过程
 * - 保留括号、分号、关键字等语法元素
 * - 一一对应 .g4 文法中的规则结构
 * - 用于语法分析调试和教学展示
 * 
 * 核心功能：
 * - 递归遍历 ANTLR ParseTree 的完整结构
 * - 为每个节点生成唯一的可视化标识
 * - 区分终结符(Token)和非终结符(规则)的显示样式
 * - 生成 Graphviz 兼容的 DOT 格式字符串
 * 
 * 修复版本说明：
 * - 解决了节点ID重复分配的问题
 * - 改进了递归遍历算法，确保完整性
 * - 正确处理父子节点之间的连接关系
 * - 优化了特殊字符转义处理
 * 
 * @author Compiler Frontend Team
 * @version 2.0 (重构优化版)
 * @date 2025-07-07
 */
public class CSTGenerator {
    
    /**
     * 生成具体语法树的 DOT 格式字符串
     * 
     * 将 ANTLR 原生 ParseTree 完整转换为可视化表示，保留所有语法分析细节：
     * - 所有语法规则的推导过程
     * - 终结符（Token）的原始文本
     * - 语法规则的层次结构关系
     * - 括号、分号、关键字等完整语法元素
     * 
     * 生成的可视化效果：
     * - 椭圆形蓝色节点：表示语法规则（非终结符）
     * - 方形黄色节点：表示具体Token（终结符）
     * - 有向边：表示语法推导关系
     * 
     * @param tree ANTLR 解析生成的完整语法树根节点
     * @param parser Rust语法分析器实例，用于获取规则名称和语法信息
     * @return 完整的 DOT 格式字符串，适用于 Graphviz 渲染具体语法树
     */
    public static String generateDotString(ParseTree tree, RustParser parser) {
        StringBuilder dot = new StringBuilder();
        AtomicInteger nodeIdCounter = new AtomicInteger(0);
        
        // DOT 文件头部：定义有向图
        dot.append("digraph CST {\n");
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
     * 递归生成具体语法树的 DOT 节点和连接关系
     * 
     * 核心算法说明：
     * 1. 为当前节点分配唯一ID并生成节点定义
     * 2. 完整保留 ParseTree 的所有结构信息（与 AST 的简化不同）
     * 3. 递归处理所有子节点，维持语法分析的完整层次
     * 4. 为每个子节点创建从父节点到子节点的连接
     * 5. 使用 AtomicInteger 确保ID的唯一性和线程安全性
     * 
     * ParseTree 特有处理：
     * - 保留所有终结符节点（Token），包括括号、分号等
     * - 保留所有非终结符节点（语法规则）
     * - 维持与 .g4 语法文件定义的一一对应关系
     * - 不进行任何语法简化或抽象化处理
     * 
     * @param tree 当前处理的 ParseTree 节点（保持完整结构）
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
     * 获取 ParseTree 节点的显示文本
     * 
     * ParseTree 的完整信息显示策略（与 AST 的简化显示不同）：
     * - 终端节点：显示 Token 的实际文本内容，包括所有语法符号
     * - 非终端节点：显示对应的语法规则名称
     * - 保留所有语法细节，不进行任何简化或过滤
     * 
     * 特殊处理：
     * - EOF标记：友好显示为 "EOF"
     * - 空白字符：明确标识类型（SPACE、NEWLINE、TAB等）
     * - 语法符号：完整保留（括号、分号、逗号等）
     * 
     * @param tree ParseTree 节点（保持原始语法结构）
     * @param parser 语法分析器实例
     * @return 适合 ParseTree 完整显示的节点文本
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
     * 根据 ParseTree 节点类型获取相应的可视化样式
     * 
     * ParseTree 的样式区分策略：
     * - 终端节点（Token）：黄色方形 - 表示具体的词法单元
     * - 非终端节点（语法规则）：蓝色椭圆 - 表示语法推导规则
     * 
     * 样式设计意图：
     * - 方形：代表"实体"（实际的代码文本）
     * - 椭圆：代表"概念"（语法规则抽象）
     * - 颜色区分：便于快速识别语法分析的层次结构
     * 
     * @param tree ParseTree 节点
     * @return DOT格式的样式字符串
     */
    private static String getNodeStyle(ParseTree tree) {
        if (tree instanceof TerminalNode) {
            // 终端节点（终结符）：黄色方形
            return ", shape=box, style=filled, fillcolor=yellow";
        } else {
            // 非终端节点：蓝色椭圆（使用全局默认样式）
            return "";
        }
    }

    /**
     * 转义 DOT 格式中的特殊字符
     * 
     * 在 ParseTree 可视化中的重要性：
     * ParseTree 包含大量的原始 Token 文本，包括字符串字面量、注释、
     * 操作符等，这些内容可能包含 DOT 格式的特殊字符，必须正确转义
     * 以确保 Graphviz 能够正确解析和渲染。
     * 
     * 常见的 ParseTree 特殊情况：
     * - 字符串字面量：如 "Hello \"World\"" 
     * - 转义字符：如 '\n', '\t', '\\'
     * - 路径分隔符：如 Windows 路径中的反斜杠
     * - 格式化字符串：如 println!("Value: {}\n", x)
     * 
     * DOT 格式转义规则：
     * - 反斜杠 \ → \\（必须最先处理，避免二次转义）
     * - 双引号 " → \"（DOT格式要求）
     * - 换行符 \n → \\n（显示为文本）
     * - 制表符 \t → \\t（显示为文本）
     * - 回车符 \r → \\r（显示为文本）
     * 
     * @param text 需要转义的原始 ParseTree 节点文本
     * @return 转义后的安全文本，可在 DOT 格式中使用
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
