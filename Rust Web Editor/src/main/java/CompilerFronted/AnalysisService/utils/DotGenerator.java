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
        dot.append(String.format("  node%d [label=\"%s\"];\n", nodeId, nodeText));
        
        for (int i = 0; i < tree.getChildCount(); i++) {
            int childId = generateDot(tree.getChild(i), parser, dot, id + i + 1);
            dot.append(String.format("  node%d -> node%d;\n", nodeId, childId));
        }
        
        return nodeId;
    }
}
