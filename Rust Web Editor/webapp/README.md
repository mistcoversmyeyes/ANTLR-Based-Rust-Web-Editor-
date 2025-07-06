# Rust Web Editor 前端

基于 ANTLR 的 Rust 网页编辑器前端，支持代码编辑、语法分析、可视化展示等功能。

## 功能特性

### 🔧 代码编辑
- **Monaco Editor**: 采用 VS Code 同款编辑器，提供优秀的编辑体验
- **Rust 语法高亮**: 完整的 Rust 语言语法支持
- **多主题支持**: 暗色、亮色、高对比度主题
- **智能提示**: 括号匹配、自动缩进、代码折叠
- **错误标记**: 实时显示语法和词法错误

### 📊 结果可视化
- **Token 流展示**: 表格形式展示词法分析结果
- **解析树可视化**: 使用 Graphviz 生成交互式语法树图形
- **AST 展示**: 抽象语法树的图形化显示
- **错误信息**: 详细的错误列表和位置标记

### 🚀 用户体验
- **响应式设计**: 适配各种屏幕尺寸
- **快捷键支持**: 
  - `Ctrl+Enter`: 分析代码
  - `Ctrl+Shift+L`: 清空编辑器
  - `F5`: 重新分析
- **自动保存**: 防止数据丢失
- **导出功能**: 支持导出 Token 数据和图形
- **实时状态**: 显示服务器连接状态和操作进度

## 技术架构

### 前端技术栈
- **原生 JavaScript (ES6+)**: 主要开发语言
- **Monaco Editor**: 代码编辑器
- **Graphviz (viz.js)**: 图形可视化
- **CSS3**: 样式和布局
- **Fetch API**: HTTP 通信

### 项目结构
```
webapp/
├── index.html              # 主页面
├── css/                    # 样式文件
│   ├── styles.css          # 主样式
│   ├── editor.css          # 编辑器样式
│   └── components.css      # 组件样式
├── js/                     # JavaScript 模块
│   ├── main.js             # 主应用逻辑
│   ├── editor.js           # 编辑器集成
│   ├── api.js              # API 通信
│   ├── visualizer.js       # 结果可视化
│   └── utils.js            # 工具函数
└── assets/                 # 静态资源
```

### 模块设计

#### 主应用模块 (main.js)
- 应用初始化和生命周期管理
- 事件协调和状态管理
- UI 交互处理
- 配置管理和持久化

#### 编辑器模块 (editor.js)
- Monaco Editor 集成
- Rust 语法支持
- 主题和配置管理
- 错误标记和高亮

#### API 通信模块 (api.js)
- 与后端服务通信
- 请求重试和错误处理
- 缓存管理
- 状态检查

#### 可视化模块 (visualizer.js)
- Token 表格渲染
- Graphviz 图形生成
- 错误列表展示
- 交互功能（缩放、拖拽）

#### 工具模块 (utils.js)
- DOM 操作助手
- 事件总线
- 文件处理
- 通知系统

## API 接口

### 分析端点
- **URL**: `POST /analyse`
- **Content-Type**: `text/plain`
- **请求体**: Rust 源代码

### 响应格式
```json
{
  "success": boolean,
  "tokens": [
    {
      "type": "KEYWORD",
      "text": "fn", 
      "line": 1,
      "column": 0
    }
  ],
  "parseTree": {
    "lisp": "(...)",
    "dot": "digraph G { ... }"
  },
  "errors": [
    {
      "line": 1,
      "column": 12,
      "message": "Syntax error message"
    }
  ]
}
```

## 使用说明

### 基本操作
1. **输入代码**: 在左侧编辑器中输入 Rust 代码
2. **分析代码**: 点击"分析代码"按钮或按 `Ctrl+Enter`
3. **查看结果**: 在右侧面板查看分析结果
4. **错误定位**: 点击错误项或 Token 可跳转到对应位置

### 高级功能
- **导出数据**: 使用各面板的导出按钮保存结果
- **图形交互**: 在解析树/AST 视图中可以缩放和拖拽
- **主题切换**: 使用右上角的主题选择器
- **自动保存**: 系统会自动保存编辑内容

### 键盘快捷键
| 快捷键 | 功能 |
|--------|------|
| `Ctrl+Enter` | 分析代码 |
| `Ctrl+Shift+L` | 清空编辑器 |
| `F5` | 重新分析 |
| `Ctrl+S` | 保存（浏览器默认） |
| `Ctrl+F` | 查找 |
| `Ctrl+H` | 替换 |

## 部署说明

### 本地开发
1. 确保后端服务运行在 `http://localhost:7070`
2. 使用 Web 服务器托管 `webapp` 目录
3. 访问 `index.html`

### 生产部署
1. 配置 HTTPS
2. 设置正确的后端 API 地址
3. 启用 gzip 压缩
4. 配置缓存策略

### 服务器要求
- 支持静态文件托管
- 支持 CORS（如果前后端分离）
- 现代浏览器支持（Chrome 80+, Firefox 75+, Safari 13+）

## 配置选项

### 编辑器配置
```javascript
{
  theme: 'vs-dark',          // 主题
  fontSize: 14,              // 字体大小
  autoSave: true,            // 自动保存
  autoSaveInterval: 30000,   // 自动保存间隔
  maxHistorySize: 10         // 历史记录大小
}
```

### API 配置
```javascript
{
  baseUrl: 'http://localhost:7070',  // 后端地址
  timeout: 30000,                    // 请求超时
  retryCount: 3,                     // 重试次数
  retryDelay: 1000                   // 重试延迟
}
```

## 故障排除

### 常见问题

**Q: 编辑器无法加载**
A: 检查网络连接，确保 Monaco Editor CDN 可访问

**Q: 无法连接到服务器**
A: 确认后端服务正在运行，检查 CORS 配置

**Q: 图形显示异常**
A: 确保 Graphviz 库已正确加载，检查 DOT 格式

**Q: 主题切换无效**
A: 刷新页面或清除浏览器缓存

### 调试信息
- 打开浏览器开发者工具查看控制台日志
- 检查网络请求状态
- 验证 API 响应格式

## 扩展开发

### 添加新主题
1. 在 `editor.js` 中定义新主题
2. 在 `defineCustomThemes()` 方法中注册
3. 更新主题选择器选项

### 添加新功能
1. 在相应模块中实现功能
2. 更新事件总线通信
3. 添加 UI 控制元素
4. 更新配置选项

### 自定义可视化
1. 扩展 `GraphRenderer` 类
2. 实现新的渲染方法
3. 添加交互功能
4. 更新导出选项

## 许可证

本项目遵循 MIT 许可证，详见 [LICENSE](../LICENSE) 文件。
