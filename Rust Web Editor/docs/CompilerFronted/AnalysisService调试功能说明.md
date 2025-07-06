# AnalysisService 调试功能说明

## 概述
`AnalysisService` 类新增了调试功能，可以将每次分析的结果保存到 JSON 文件中，便于开发调试和问题排查。

## 功能特性
1. **自动保存**：每次调用 `AnalysisService.analyse()` 方法时，会自动将分析结果保存到文件
2. **时间戳命名**：文件名包含时间戳，格式为 `analysis_result_YYYY-MM-DD_HH-mm-ss-SSS.json`
3. **完整信息**：保存的文件包含：
   - 时间戳
   - 原始源代码
   - 完整的分析结果（JSON 格式）
4. **可控开关**：支持通过系统属性控制是否启用调试功能

## 输出文件格式

现在会生成两个文件以提供不同层次的调试信息：

### 1. 纯分析结果文件 (`analysis_result_*.json`)
包含纯净的分析结果，便于直接查看和分析：
```json
{
  "success": true,
  "tokens": [
    {
      "type": "KW_FN",
      "text": "fn",
      "line": 1,
      "column": 0
    }
    // ... 更多 tokens
  ],
  "parseTree": {
    "lisp": "语法树的LISP表示",
    "dot": "语法树的DOT格式（用于Graphviz可视化）"
  },
  "errors": []
}
```

### 2. 完整调试信息文件 (`debug_*.json`)
包含时间戳、源代码和分析结果的完整信息：
```json
{
  "timestamp": "2025-07-06_14-31-31-980",
  "sourceCode": "fn main() {\n    println!(\"Hello, world!\");\n}",
  "analysisResult": {
    // 与 analysis_result_*.json 内容相同
  }
}
```

## 文件位置
调试文件保存在项目根目录下的 `debug_output/` 文件夹中。

每次分析会生成两个文件：
- `analysis_result_YYYY-MM-DD_HH-mm-ss-SSS.json` - 纯分析结果
- `debug_YYYY-MM-DD_HH-mm-ss-SSS.json` - 完整调试信息

## 控制调试功能

### 唯一方法
手动在 `AnalysisService.java` 中设置 `DEBUG_MODE` 为true/false

## 用途
1. **开发调试**：查看词法分析和语法分析的详细结果
2. **测试验证**：保存测试案例的分析结果供后续对比
3. **问题排查**：分析错误代码的处理过程
4. **性能分析**：通过时间戳分析处理耗时
5. **可视化支持**：`analysis_result_*.json` 文件可直接用于前端展示
6. **数据分析**：JSON格式便于程序化处理和统计分析

## 注意事项
1. 调试文件会持续累积，建议定期清理 `debug_output/` 目录
2. 生产环境建议禁用调试功能以提高性能
3. 调试文件已添加到 `.gitignore` 中，不会被提交到版本控制
