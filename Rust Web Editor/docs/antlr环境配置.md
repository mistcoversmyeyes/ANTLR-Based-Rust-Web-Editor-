# antlr环境配置及验证

## 使用pip进行安装
这种方法安装的 antlr4 提供的功能不完善，不支持根据文法自动生成目标语言编写的词法分析和语法分析器。

## 在类Unix系统中手动安装 (推荐)

0. 安装java 环境，并保证**jdk版本大于等于11**
1. 手动下载antlr的jar包,并将jar包放置在 `<你想放置的antlr路径>` 目录下
```bash
cd <你想放置的antlr路径>
curl -O https://www.antlr.org/download/antlr-4.13.2-complete.jar
```

2. 配置环境变量 `$CLASSPATH` 以备后续使用
```zsh
export CLASSPATH=".:<你想放置的antlr路径>/antlr-4.13.2-complete.jar:$CLASSPATH"

```
3. 为要使用的相关工具配置别名
```zsh
alias antlr4='java -Xmx500M -cp "$CLASSPATH" org.antlr.v4.Tool'
alias grun='java -Xmx500M -cp "$CLASSPATH" org.antlr.v4.gui.TestRig'
```

4. 再命令行中输入以下内容，验证配置 是否成功
```zsh
antlr4 
# 运行这个命令，应当输出：
# ANTLR Parser Generator  Version 4.13.2
#  -o ___              specify output directory where all output is generated
#  -lib ___            specify location of grammars, tokens files
#  ........................
```
```zsh
grun
# 运行这个命令应当输出：
# java org.antlr.v4.gui.TestRig GrammarName startRuleName
#   [-tokens] [-tree] [-gui] [-ps file.ps] [-encoding encodingname]
#   [-trace] [-diagnostics] [-SLL]
#   [input-filename(s)]
# Use startRuleName='tokens' if GrammarName is a lexer grammar.
# Omitting input-filename makes rig read from stdin.

```

5. 实现每次启动shell时自动进行以上配置

输入以下命令打开你所使用shell的配置文件
```zsh 
code -n $HOME/.bashrc
```

在配置文件的末尾添加以下内容：(记得将`<你想放置的antlr路径>`替换为实际放置jar包的路径)
```bash
# 配置antlr4 和 grun 启动时自动配置别名
export CLASSPATH=".:<你想放置的antlr路径>/antlr-4.13.2-complete.jar:$CLASSPATH"
alias antlr4='java -Xmx500M -cp "$CLASSPATH" org.antlr.v4.Tool'
alias grun='java -Xmx500M -cp "$CLASSPATH" org.antlr.v4.gui.TestRig'
```

或者也可以直接运行命令：(记得将`<你想放置的antlr路径>`替换为实际放置jar包的路径)
```bash
echo -e '\n# 配置antlr4 和 grun 启动时自动配置别名\nexport CLASSPATH=".:<你想放置的antlr路径>/antlr-4.13.2-complete.jar:$CLASSPATH"\nalias antlr4='"'"'java -Xmx500M -cp "$CLASSPATH" org.antlr.v4.Tool'"'"'\nalias grun='"'"'java -Xmx500M -cp "$CLASSPATH" org.antlr.v4.gui.TestRig'"'"'' >> ~/.bashrc
```

## windows下安装 antlr工具链
略

## 参考
[getting-start][1]


[1]: https://github.com/antlr/antlr4/blob/master/doc/getting-started.md  