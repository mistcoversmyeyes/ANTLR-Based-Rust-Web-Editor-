package CompilerFronted.AnalysisService.utils;

import org.antlr.v4.runtime.tree.ParseTree;
import org.antlr.v4.runtime.tree.Trees;

import CompilerFronted.Core.RustParser;

public class DotGenerator {
    public static String generateDotString(ParseTree tree, RustParser parser) {
        StringBuilder dot = new StringBuilder();
        dot.append("digraph G {\n");
        generateDot(tree, parser, dot, 0);
        dot.append("}\n");
        return dot.toString();
    }

    private static int generateDot(ParseTree tree, RustParser parser, StringBuilder dot, int id) {
        int nodeId = id;
        String nodeText = Trees.getNodeText(tree, parser);
        String label = escapeDotLabel(nodeText);
        dot.append(String.format("  node%d [label=\"%s\"];\n", nodeId, label));

        int nextId = nodeId;
        for (int i = 0; i < tree.getChildCount(); i++) {
            nextId++;
            int childId = generateDot(tree.getChild(i), parser, dot, nextId);
            dot.append(String.format("  node%d -> node%d;\n", nodeId, childId));
            nextId = childId;
        }
        return nodeId;
    }

    /**
     * 转义 DOT 格式中的特殊字符
     * @param text 需要转义的文本
     * @return 转义后的文本
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
