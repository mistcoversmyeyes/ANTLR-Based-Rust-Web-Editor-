package CompilerFronted.AnalysisService.models;

/**
 * AST（抽象语法树）信息类
 * 
 * 存储抽象语法树的DOT格式表示：
 * - DOT 格式：用于 Graphviz 可视化
 * 
 * @author Compiler Frontend Team
 * @version 1.0
 * @date 2025-07-08
 */
public class ASTInfo {
    public String dot;

    public ASTInfo() {
        this.dot = "";
    }

    public ASTInfo(String dot) {
        this.dot = dot;
    }

    // Getters and Setters
    public String getDot() { 
        return dot; 
    }
    
    public void setDot(String dot) { 
        this.dot = dot; 
    }
}
