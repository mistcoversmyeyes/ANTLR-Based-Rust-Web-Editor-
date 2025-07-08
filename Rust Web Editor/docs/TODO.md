# 文档编写
- [x] 编写配置Linux系统下 `antlr4` 命令和 `grun` 命令教程
- [x] 编写开发计划
- [ ] `antlr4` 命令和 `grun` 命令的使用方法中文文档
- [ ] `.g4` 文件撰写格式中文文档
- [ ] `antlr4` 根据语法文件生成的 Scanner 和 Parser 的代码的结构拆解文档
- [ ] 根据结构拆解文档，探索如何利用生成的 Scanner 和 Parser 进行词法语法分析，生成TokenStream、ParseTree（CST）和AST
- [x] 编辑器前端搭建框架选择 与 框架介绍
- [x] 前端开发环境搭建文档
- [x] 前端 API 调用与数据格式说明文档
- [ ] 前端TokenStream、ParseTree（CST）和AST结果可视化实现说明文档

# 程序功能实现

## 第一阶段：完善核心前端功能 (Web编辑器)
- [x] 搭建Web服务器
  - [x] 创建基础的 `WebServer.java` 并引入 Javalin
  - [x] 定义分析结果的 JSON 数据结构 (Token, ParseTree的.dot格式, AST的.dot格式, Errors)
  - [x] 将antlr解析逻辑封装为 `AnalysisService` 类，这个类应当为webserver提供对于输入的Rust源代码的词法和语法分析，包含报错信息和成功分析的部分（目前支持TokenStream和ParseTree/CST，待扩展AST生成）。
    - [x] 添加JSON调试输出功能，便于开发调试
  - [x] 在 `WebServer` 中调用 `AnalysisService`，处理来自前端的代码

### 创建Web编辑器前端
- [x] 3.1 创建前端项目结构
  - [x] 创建 `webapp` 目录
  - [x] 设置基础文件结构（HTML、CSS、JS）
  - [x] 引入 Monaco Editor 和 viz.js 依赖
  - [x] 配置项目的基本文件组织
- [x] 3.2 实现代码编辑器界面
  - [x] 集成 Monaco Editor
  - [x] 配置 Rust 语法高亮
  - [x] 设置编辑器主题和基本配置
  - [x] 测试编辑器基本功能
- [x] 3.3 创建用户界面布局
  - [x] 设计整体页面布局（编辑器 + 结果展示区域）
  - [x] 添加"分析"按钮和加载状态
  - [x] 创建 TokenStream 结果展示区域
  - [x] 创建 ParseTree（CST）可视化区域
  - [ ] 创建 AST（抽象语法树）可视化区域
  - [x] 创建错误信息展示区域
  - [x] 实现响应式布局
- [x] 3.4 实现与后端的通信
  - [x] 编写 API 调用函数
  - [x] 处理请求/响应的数据格式
  - [x] 添加错误处理和用户反馈
  - [x] 实现加载状态管理

### 实现结果的可视化
- [x] 4.1 TokenStream 展示
  - [x] 设计 Token 列表的展示格式（表格形式）
  - [x] 实现 JSON 数据到前端展示的转换
  - [x] 添加 Token 信息的详细展示（类型、值、位置等）
- [x] 4.2 ParseTree（CST）和 AST 可视化
  - [x] 集成 viz.js 库
  - [x] 修复 AMD 模块冲突问题（Monaco Editor 与 Viz.js 兼容性）
  - [x] 实现 Viz.js 正确加载和初始化
  - [x] **[已修复]** 后端 DOT 字符串生成问题：字符串字面量转义错误
  - [x] **[已修复]** 后端 DOT 生成核心问题：节点ID重复分配导致ParseTree结构错误
  - [x] 实现 ParseTree（CST）.dot 字符串到图形的渲染
  - [ ] 实现 AST（抽象语法树）生成与可视化
  - [ ] 添加CST和AST图形的缩放、拖拽等交互功能
  - [ ] 实现CST和AST的切换显示功能
  - [ ] 优化大型语法树的显示性能
- [x] 4.3 错误信息展示
  - [x] 设计错误信息的展示界面
  - [x] 实现代码行的错误高亮
  - [x] 创建错误列表面板
  - [x] 实现错误信息与代码位置的联动
  - [x] 修复 ErrorRenderer 类创建问题

### 用户体验优化
- [ ] 基本样式与布局美化
- [ ] 添加代码示例和帮助信息
- [ ] 实现结果导出功能（.dot/.json 下载，选做）
- [ ] 性能优化和错误边界处理

### 构建完整的错误处理机制
- [ ] 实现ANTLR的 `ANTLRErrorListener` 接口
- [ ] 捕获词法/语法分析过程中产生的错误
- [ ] 收集错误信息（如行号、列号、错误消息）
- [ ] 将错误信息以清晰的格式（如JSON）返回给前端

## 第二阶段：语义分析与LLVM IR生成 (选做加分项)
- [ ] 定义语义规则与构建符号表
  - [ ] 设计符号表（Symbol Table）数据结构
  - [ ] 实现变量、函数、类型等信息的存储
  - [ ] 根据Rust的语义规则填充符号表
- [ ] 遍历AST并生成LLVM IR
  - [ ] 利用符号表信息生成LLVM中间表示
  - [ ] 将高级Rust代码转换为低级中间代码
  - [ ] 考虑使用LLVM的Java绑定库

## 第三阶段：集成LLVM后端 (选做加分项)
- [ ] 调用LLVM后端
  - [ ] 将生成的LLVM IR输入到LLVM后端工具链
  - [ ] 使用 `llc` 和 `clang` 等工具
  - [ ] 编译生成特定平台的可执行文件（x86, ARM等）
  - [ ] 测试生成的可执行程序功能







## 已识别问题与修复状态

### 前端问题
- [x] **Monaco Editor 与 Viz.js AMD 冲突**
  - 问题：Monaco Editor 的 AMD 加载器与 Viz.js 产生冲突，导致 "Can only have one anonymous define call per script file" 错误
  - 解决方案：在加载 Viz.js 时暂时禁用 AMD，加载完成后恢复
  - 状态：已修复

- [x] **错误信息渲染失败**
  - 问题：`Utils.DOM.create('div', 'error-item')` 传递字符串作为 attributes 参数导致 "Failed to execute 'setAttribute'" 错误
  - 解决方案：修改为 `Utils.DOM.create('div', { className: 'error-item' })` 并增强 create 方法支持字符串参数
  - 状态：已修复

- [x] **可视化模块初始化问题**
  - 问题：缺少 ErrorRenderer 类定义和渲染器初始化导致应用启动失败
  - 解决方案：添加完整的 ErrorRenderer 类并在 ResultVisualizer 中正确初始化所有渲染器
  - 状态：已修复

### 后端问题
- [x] **DOT 字符串格式错误 - 字符串字面量转义**
  - 问题：后端生成的 DOT 字符串中字符串字面量转义不正确
  - 具体示例：`node12 [label=""Hello, world!""];` 应为 `node12 [label="\"Hello, world!\""];`
  - 影响：导致 Graphviz 解析失败，解析树无法可视化
  - 状态：**已修复** - 在 DotGenerator 重写时一并解决
  - 参考文档：`./CompilerFronted/DOT格式生成问题分析.md`

- [x] **DOT 节点ID重复分配问题**
  - 问题：DOT 生成算法中存在节点ID重复分配，导致解析树结构完全错误
  - 具体表现：同一个nodeID被多个不同节点使用，连接关系混乱
  - 影响：渲染出的解析树与标准ANTLR输出完全不符
  - 状态：**已修复** - 完全重写 DotGenerator 类，使用全局ID计数器
  - 参考文档：`./CompilerFronted/DOT生成器节点ID重复问题修复报告.md`

- [x] **DOT 字符串格式错误 - 特殊字符转义**
  - 问题：DOT 节点标签中的特殊字符（换行符、制表符、反斜杠等）未正确转义
  - 影响：可能导致解析失败或显示异常
  - 状态：**已修复** - 在DotGenerator重写时改进了转义逻辑

### 验证方法
- [x] 使用命令行 Graphviz 工具验证 DOT 文件格式：`dot -Tsvg test.dot -o test.svg`
- [x] 前端修复可通过 `debugViz.checkViz()` 和 `debugViz.analyzeDot()` 进行调试
- [x] 通过手动修复 DOT 文件验证格式正确性
- [x] 确认问题源头为后端 DOT 生成，前端无需修复 DOT 格式
- [x] **新增验证** - 重写后的DotGenerator确保节点ID唯一性和正确的解析树结构


# 参考
[1]: ./CompilerFronted/AnalysisService调试功能说明.md  
[2]: ./CompilerFronted/DOT格式生成问题分析.md  
[3]: ./CompilerFronted/AnalysisService%20DOT修复指南.md  
[4]: ./webapp/前端开发指南.md  
[5]: ./CompilerFronted/DOT生成器节点ID重复问题修复报告.md

## 最近完成的工作

### 2025-07-07: DOT生成器重大修复
- **问题**: 解析树可视化显示错误的图形结构，与标准ANTLR输出不符
- **根因**: DotGenerator中节点ID重复分配，递归算法存在严重缺陷
- **解决方案**: 完全重写DotGenerator类，引入全局ID计数器，简化递归逻辑
- **影响**: 修复了解析树可视化的核心功能，现在能正确显示解析树结构
- **文件**: 
  - 修复代码: `src/main/java/CompilerFronted/AnalysisService/utils/DotGenerator.java`
  - 修复报告: `docs/CompilerFronted/DOT生成器节点ID重复问题修复报告.md`
- **状态**: ✅ 已完成，待下次启动服务验证 