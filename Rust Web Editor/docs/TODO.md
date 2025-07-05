# 文档编写
- [x] 编写配置Linux系统下 `antlr4` 命令和 `grun` 命令教程
- [x] 编写开发计划
- [ ] `antlr4` 命令和 `grun` 命令的使用方法中文文档
- [ ] `.g4` 文件撰写格式中文文档
- [ ] `antlr4` 根据语法文件生成的 Scanner 和 Parser 的代码的结构拆解文档
- [ ] 根据结构拆解文档，探索如何利用生成的 Scanner 和 Parser 进行
- [ ] 编辑器前端搭建框架选择 与 框架介绍

# 程序功能实现

## 第一阶段：完善核心前端功能 (Web编辑器)
- [x] 搭建Web服务器
  - [x] 创建基础的 `WebServer.java` 并引入 Javalin
  - [ ] 定义分析结果的 JSON 数据结构 (Token, .dot格式的ParseTree, Errors)
  - [ ] 将原有的 ANTLR 解析逻辑封装成一个独立的 `AnalysisService` 类
  - [ ] 在 `WebServer` 中调用 `AnalysisService`，处理来自前端的代码
- [ ] 创建Web编辑器前端
- [ ] 实现结果的可视化
- [ ] 构建完整的错误处理机制

## 第二阶段：语义分析与LLVM IR生成 (选做加分项)
- [ ] 定义语义规则与构建符号表
- [ ] 遍历AST并生成LLVM IR

## 第三阶段：集成LLVM后端 (选做加分项)
- [ ] 调用LLVM后端