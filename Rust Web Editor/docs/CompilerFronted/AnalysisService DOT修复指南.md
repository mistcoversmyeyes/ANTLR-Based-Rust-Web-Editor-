# AnalysisService DOT 生成修复指南

## 问题概述

AnalysisService 在生成解析树的 DOT 格式字符串时，存在字符串字面量转义不正确的问题，导致 Graphviz 无法解析，前端解析树可视化失败。

## 错误示例

### 当前错误的输出
```dot
node12 [label=""Hello, world!""];
```

### 应该的正确输出  
```dot
node12 [label="\"Hello, world!\""];
```

## 需要检查的文件

在 `src/main/java/CompilerFronted/AnalysisService/` 目录下，查找以下内容：

1. **解析树生成相关的类**
2. **DOT 字符串构建的方法**
3. **处理 Token 文本内容的代码**

## 修复建议

### 1. 添加 DOT 标签转义方法

```java
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
```

### 2. 在生成 DOT 节点时使用转义

```java
// 修复前的代码示例
String dotNode = String.format("node%d [label=\"%s\"];", nodeId, tokenText);

// 修复后的代码示例
String escapedLabel = escapeDotLabel(tokenText);
String dotNode = String.format("node%d [label=\"%s\"];", nodeId, escapedLabel);
```

### 3. 特别注意的场景

需要特别处理以下类型的节点：
- 字符串字面量：`"Hello, world!"`
- 字符字面量：`'a'`
- 包含转义字符的字符串：`"Hello\nWorld"`
- 包含双引号的字符串：`"He said \"Hello\""`

## 验证方法

### 1. 修改代码后重新编译运行

```bash
# 重新编译项目
mvn compile

# 运行测试
mvn test
```

### 2. 使用测试用例验证

创建包含各种特殊字符的 Rust 代码进行测试：

```rust
fn main() {
    println!("Hello, world!");
    println!("String with \"quotes\"");
    println!("String with\nnewline");
    let char_literal = 'a';
}
```

### 3. 检查生成的 DOT 文件

在调试输出中查看生成的 DOT 字符串，确保：
- 双引号正确转义为 `\"`
- 换行符转义为 `\\n`
- 反斜杠转义为 `\\\\`

### 4. 使用命令行工具验证

```bash
# 将生成的 DOT 内容保存到文件
echo "生成的DOT内容" > test.dot

# 使用 Graphviz 验证语法
dot -Tsvg test.dot -o test.svg

# 如果没有错误输出，说明格式正确
```

## 预期结果

修复后的 DOT 文件应该能够：
1. 通过 Graphviz 命令行工具的语法检查
2. 在前端正确渲染为解析树图形
3. 正确显示包含特殊字符的节点标签

## 相关调试信息

- 前端调试日志位置：`debug_output/` 目录
- 测试 DOT 文件：`test_parse_tree.dot`
- 前端调试命令：`debugViz.analyzeDot()`

## 测试清单

修复完成后，请验证以下测试用例：

- [ ] 简单字符串字面量：`"hello"`
- [ ] 包含双引号的字符串：`"say \"hi\""`  
- [ ] 包含换行符的字符串：`"line1\nline2"`
- [ ] 包含制表符的字符串：`"col1\tcol2"`
- [ ] 包含反斜杠的字符串：`"path\\to\\file"`
- [ ] 字符字面量：`'a'`, `'\n'`, `'\''`
- [ ] 复杂表达式中的字符串

所有测试用例都应该能在前端正确显示解析树，没有 Graphviz 语法错误。
