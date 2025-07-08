# Rust Web Editor API 规范

## 分析端点 (Analysis Endpoint)

### 请求格式

- **URL**: `/analyse`
- **方法**: `POST`
- **Content-Type**: `text/plain`
- **请求体**: Rust 源代码文本

示例请求:
```bash
POST http://localhost:7070/analyse
Content-Type: text/plain

fn main() {
    println!("Hello, World!");
}
```

### 响应格式

- **Content-Type**: `application/json`
- **编码**: `UTF-8`

响应体将是一个 JSON 对象，包含以下字段：

```typescript
{
    // 分析是否成功完成
    "success": boolean,

    // Token流数组
    "tokens": [
        {
            "type": string,    // Token类型（如 IDENTIFIER, KEYWORD 等）
            "text": string,    // Token的实际文本内容
            "line": number,    // Token在源代码中的行号（1-based）
            "column": number   // Token在行中的列位置（0-based）
        }
    ],

    // ParseTree（具体语法树/CST）信息
    "parseTree": {
        "dot": string ,        // DOT格式的ParseTree（用于Graphviz可视化）
    },
    
    // AST（抽象语法树）信息
    "ast": {
        "dot": string         // DOT格式的AST（用于Graphviz可视化）
    },

    // 错误信息数组（如果有）
    "errors": [
        {
            "line": number,    // 错误发生的行号（1-based）
            "column": number,  // 错误发生的列号（0-based）
            "message": string  // 错误描述信息
        }
    ]
}
```

### 响应示例

#### 成功响应

```json
{
    "success": true,
    "tokens": [
        {
            "type": "KEYWORD",
            "text": "fn",
            "line": 1,
            "column": 0
        },
        {
            "type": "IDENTIFIER",
            "text": "main",
            "line": 1,
            "column": 3
        }
    ],
    "parseTree": {
        "lisp": "(crate (function_item fn main ( ) { (expression_statement (call_expression println! ( \"Hello, World!\" ) ) ) }))",
        "dot": "digraph G {\n  node0 [label=\"crate\"];\n  node1 [label=\"function_item\"];\n  node0 -> node1;\n  node2 [label=\"fn\"];\n  node1 -> node2;\n  ...\n}"
    },
    "ast": {
        "dot": "digraph G {\n  node0 [label=\"Program\"];\n  node1 [label=\"FnDecl\"];\n  node0 -> node1;\n  node2 [label=\"main\"];\n  node1 -> node2;\n  ...\n}"
    },
    "errors": []
}
```

#### 错误响应

```json
{
    "success": false,
    "tokens": [
        {
            "type": "KEYWORD",
            "text": "fn",
            "line": 1,
            "column": 0
        }
    ],
    "parseTree": {
        "lisp": "",
        "dot": ""
    },
    "ast": {
        "dot": ""
    },
    "errors": [
        {
            "line": 1,
            "column": 12,
            "message": "mismatched input '}' expecting {'(', '[', '{', '='}"
        }
    ]
}
```

### 使用说明

1. **Token 流**:
   - `type`: Token 的类型，与 ANTLR 生成的词法分析器中定义的类型对应
   - `text`: Token 的原始文本
   - `line`: 行号从 1 开始计数
   - `column`: 列号从 0 开始计数

2. **ParseTree（具体语法树/CST）**:
   - `parseTree.lisp`: 使用 LISP S-表达式格式表示的ParseTree，完整反映源代码的语法结构
   - `parseTree.dot`: 符合 Graphviz DOT 语言格式的ParseTree表示，可以用 viz.js 等工具在前端渲染为可视化图形

3. **AST（抽象语法树）**:
   - `ast.dot`: 符合 Graphviz DOT 语言格式的AST表示，经过语义归约，突出程序的语义结构和核心逻辑

4. **错误处理**:
   - 当 `success` 为 `false` 时，`errors` 数组至少包含一个错误
   - 语法分析可能在发生错误时继续执行，因此即使有错误，`tokens`、`parseTree` 和 `ast` 也可能包含部分结果
   - 每个错误都包含准确的位置信息，便于在编辑器中高亮显示
