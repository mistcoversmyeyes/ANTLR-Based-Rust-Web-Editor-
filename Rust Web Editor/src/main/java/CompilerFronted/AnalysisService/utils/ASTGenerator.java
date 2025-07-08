package CompilerFronted.AnalysisService.utils;

import org.antlr.v4.runtime.tree.ParseTree;
import org.antlr.v4.runtime.tree.TerminalNode;
import CompilerFronted.Core.RustParser;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * AST (抽象语法树) 生成器
 * 
 * 负责将 ANTLR 解析树转换为简化的抽象语法树，
 * 去除语法糖和冗余信息，保留核心语义结构。
 * 
 * 职责：
 * - 从 ParseTree 生成简化的 AST
 * - 生成 AST 的 DOT 格式表示
 * - 提供 AST 的文本表示
 * 
 * @author Compiler Frontend Team
 * @version 1.0
 * @date 2025-07-07
 */
public class ASTGenerator {
    
    /**
     * AST 节点表示
     */
    public static class ASTNode {
        private String label;   // 节点名称
        private String type;    // V_T 或者 V_N
        private List<ASTNode> children;     // 兄弟列表
        private boolean isTerminal;         // 当前节点是否是 V_T
        
        public ASTNode(String label, String type, boolean isTerminal) {
            this.label = label;
            this.type = type;
            this.isTerminal = isTerminal;
            this.children = new ArrayList<>();
        }
        
        public void addChild(ASTNode child) {
            this.children.add(child);
        }
        
        public String getLabel() { return label; }
        public String getType() { return type; }
        public List<ASTNode> getChildren() { return children; }
        public boolean isTerminal() { return isTerminal; }
        
        public boolean hasChildren() {
            return !children.isEmpty();
        }
    }
    
    /**
     * 从 ParseTree 生成 AST
     * 
     * @param parseTree ANTLR 解析树
     * @param parser Rust 语法分析器
     * @return AST 根节点
     */
    public static ASTNode generateAST(ParseTree parseTree, RustParser parser) {
        return buildASTRecursive(parseTree, parser);
    }
    
    /**
     * 生成 AST 的 DOT 格式字符串
     * 
     * @param astRoot AST 根节点
     * @return DOT 格式字符串
     */
    public static String generateASTDotString(ASTNode astRoot) {
        StringBuilder dot = new StringBuilder();
        AtomicInteger nodeIdCounter = new AtomicInteger(0);
        
        // DOT 文件头部
        dot.append("digraph AST {\n");
        dot.append("  rankdir=TB;\n");
        dot.append("  node [shape=ellipse, style=filled];\n");
        dot.append("  edge [color=darkgreen];\n");
        dot.append("\n");
        
        // 递归生成节点和连接
        generateASTDotRecursive(astRoot, dot, nodeIdCounter, -1);
        
        dot.append("}\n");
        return dot.toString();
    }
    
    /**
     * 递归构建 AST
     */
    private static ASTNode buildASTRecursive(ParseTree tree, RustParser parser) {
        if (tree instanceof TerminalNode) {
            // 终端节点：根据重要性决定是否保留
            TerminalNode terminal = (TerminalNode) tree;
            String text = terminal.getText();
            
            // 过滤掉语法糖（括号、分号等）
            if (shouldKeepTerminal(text)) {
                return new ASTNode(text, "TERMINAL", true);
            }
            return null; // 不保留的终端节点
        } else {
            // 非终端节点：根据语义重要性决定处理方式
            String ruleName = tree.getClass().getSimpleName();
            
            // 创建当前节点
            ASTNode currentNode = new ASTNode(getSimplifiedRuleName(ruleName), "RULE", false);
            
            // 递归处理子节点
            for (int i = 0; i < tree.getChildCount(); i++) {
                ParseTree child = tree.getChild(i);
                ASTNode astChild = buildASTRecursive(child, parser);
                
                if (astChild != null) {
                    currentNode.addChild(astChild);
                }
            }
            
            // 如果是包装节点且只有一个子节点，可以考虑扁平化
            if (isWrapperRule(ruleName) && currentNode.getChildren().size() == 1) {
                return currentNode.getChildren().get(0);
            }
            
            // 如果节点没有子节点且不是重要的语法结构，则不保留
            if (!currentNode.hasChildren() && !isImportantRule(ruleName)) {
                return null;
            }
            
            return currentNode;
        }
    }
    
    /**
     * 递归生成 AST 的 DOT 表示
     */
    private static void generateASTDotRecursive(ASTNode node, StringBuilder dot, 
                                              AtomicInteger nodeIdCounter, int parentId) {
        int currentNodeId = nodeIdCounter.getAndIncrement();
        
        // 根据节点类型设置不同颜色和形状
        String fillColor, shape, fontColor;
        if (node.isTerminal()) {
            // 叶子节点（终端节点）：蓝色填充，白色字体
            fillColor = "black";
            shape = "ellipse";
            fontColor = "white";
        } else {
            // 非终端节点：粉红色填充，黑色字体
            fillColor = "lightcoral";
            shape = "ellipse";
            fontColor = "black";
        }
        String escapedLabel = CSTGenerator.escapeDotLabel(node.getLabel());
        
        dot.append(String.format("  node%d [label=\"%s\", fillcolor=%s, shape=%s, fontcolor=%s];\n", 
                                currentNodeId, escapedLabel, fillColor, shape, fontColor));
        
        if (parentId >= 0) {
            dot.append(String.format("  node%d -> node%d;\n", parentId, currentNodeId));
        }
        
        // 递归处理子节点
        for (ASTNode child : node.getChildren()) {
            generateASTDotRecursive(child, dot, nodeIdCounter, currentNodeId);
        }
    }
    
    /**
     * 判断终端节点是否应该保留
     */
    private static boolean shouldKeepTerminal(String text) {
        // 过滤掉语法糖
        if (text.equals("(") || text.equals(")") || 
            text.equals("{") || text.equals("}") || 
            text.equals("[") || text.equals("]") || 
            text.equals(";") || text.equals(",")) {
            return false;
        }
        
        // 保留关键字、标识符、字面量、操作符
        return true;
    }
    
    /**
     * 简化规则名称
     */
    private static String getSimplifiedRuleName(String ruleName) {
        // 移除 "Context" 后缀
        if (ruleName.endsWith("Context")) {
            return ruleName.substring(0, ruleName.length() - 7);
        }
        return ruleName;
    }
    
    /**
     * 判断是否为包装规则（可以扁平化的规则）
     */
    private static boolean isWrapperRule(String ruleName) {
        // 这些规则通常只是语法包装，可以扁平化
        return ruleName.contains("expression") && 
               !ruleName.contains("binary") && 
               !ruleName.contains("unary");
    }
    
    /**
     * 判断是否为重要的语法规则
     */
    private static boolean isImportantRule(String ruleName) {
        // 重要的语法结构应该保留
        return ruleName.contains("function") || 
               ruleName.contains("struct") || 
               ruleName.contains("impl") || 
               ruleName.contains("trait") || 
               ruleName.contains("statement") ||
               ruleName.contains("declaration");
    }
}
