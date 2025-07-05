package CompilerFronted.AnalysisService.models;

public class ParseTreeInfo {
    public String lisp;
    public String dot;

    public ParseTreeInfo() {
        this.lisp = "";
        this.dot = "";
    }

    // Getters and Setters
    public String getLisp() { return lisp; }
    public void setLisp(String lisp) { this.lisp = lisp; }
    public String getDot() { return dot; }
    public void setDot(String dot) { this.dot = dot; }
}
