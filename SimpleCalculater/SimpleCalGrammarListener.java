// Generated from SimpleCalGrammar.g4 by ANTLR 4.13.2
import org.antlr.v4.runtime.tree.ParseTreeListener;

/**
 * This interface defines a complete listener for a parse tree produced by
 * {@link SimpleCalGrammarParser}.
 */
public interface SimpleCalGrammarListener extends ParseTreeListener {
	/**
	 * Enter a parse tree produced by {@link SimpleCalGrammarParser#prog}.
	 * @param ctx the parse tree
	 */
	void enterProg(SimpleCalGrammarParser.ProgContext ctx);
	/**
	 * Exit a parse tree produced by {@link SimpleCalGrammarParser#prog}.
	 * @param ctx the parse tree
	 */
	void exitProg(SimpleCalGrammarParser.ProgContext ctx);
	/**
	 * Enter a parse tree produced by {@link SimpleCalGrammarParser#expr}.
	 * @param ctx the parse tree
	 */
	void enterExpr(SimpleCalGrammarParser.ExprContext ctx);
	/**
	 * Exit a parse tree produced by {@link SimpleCalGrammarParser#expr}.
	 * @param ctx the parse tree
	 */
	void exitExpr(SimpleCalGrammarParser.ExprContext ctx);
}