# ANTLR 命令行工具使用介绍

## 前置要求
- 在命令行中输入 `antlr4` 命令后有正常反馈，同样的输入 `grun` 命令后有正常反馈。如果没有反馈的，请查看 [antlr环境配置教程][1]
- （可选）阅读 [getting-start with antlr][2]

##  antlr4 命令行工具使用介绍

### 如何打开命令行工具帮助页面
直接在命令行中输入命令 `antlr4` 然后就能够输出全部帮助文档了
```bash 
$ antlr4
ANTLR Parser Generator  Version 4.13.2
 -o ___              specify output directory where all output is generated
 -lib ___            specify location of grammars, tokens files
 -atn                generate rule augmented transition network diagrams
 -encoding ___       specify grammar file encoding; e.g., euc-jp
 -message-format ___ specify output style for messages in antlr, gnu, vs2005
 -long-messages      show exception details when available for errors and warnings
 -listener           generate parse tree listener (default)
 -no-listener        don't generate parse tree listener
 -visitor            generate parse tree visitor
 -no-visitor         don't generate parse tree visitor (default)
 -package ___        specify a package/namespace for the generated code
 -depend             generate file dependencies
 -D<option>=value    set/override a grammar-level option
 -Werror             treat warnings as errors
 -XdbgST             launch StringTemplate visualizer on generated code
 -XdbgSTWait         wait for STViz to close before continuing
 -Xforce-atn         use the ATN simulator for all predictions
 -Xlog               dump lots of logging info to antlr-timestamp.log
 -Xexact-output-dir  all output goes into -o dir regardless of paths/package
```
### 常用参数解析





## grun 命令介绍
同样的，直接输入 `grun` 也可以获得 这个命令的帮助文档
```bash
$ grun                                                                    base  16:27:04
java org.antlr.v4.gui.TestRig GrammarName startRuleName
  [-tokens] [-tree] [-gui] [-ps file.ps] [-encoding encodingname]
  [-trace] [-diagnostics] [-SLL]
  [input-filename(s)]
Use startRuleName='tokens' if GrammarName is a lexer grammar.
Omitting input-filename makes rig read from stdin.

```





[1]: /docs/antlr环境配置.md
[2]: https://github.com/antlr/antlr4/blob/master/doc/getting-started.md 