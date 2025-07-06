/**
 * 主应用模块
 * 应用程序的入口点，协调各个模块的工作
 */

class RustWebEditor {
    constructor() {
        this.editor = null;
        this.visualizer = null;
        this.isInitialized = false;
        this.serverCheckInterval = null;
        this.autoSaveInterval = null;
        
        // 应用配置
        this.config = {
            autoSave: true,
            autoSaveInterval: 30000, // 30秒
            serverCheckInterval: 60000, // 60秒
            maxHistorySize: 10,
            theme: 'vs-dark'
        };

        // 状态管理
        this.state = {
            isAnalyzing: false,
            lastAnalysisTime: null,
            analysisHistory: [],
            serverStatus: 'unknown'
        };
    }

    /**
     * 初始化应用
     */
    async initialize() {
        if (this.isInitialized) {
            console.warn('应用已经初始化');
            return;
        }

        try {
            console.log('开始初始化 Rust Web Editor...');
            
            // 显示初始化状态
            this.updateStatus('正在初始化...');
            
            // 加载配置
            this.loadConfig();
            
            // 初始化编辑器
            await this.initializeEditor();
            
            // 初始化可视化器
            this.initializeVisualizer();
            
            // 设置事件监听
            this.setupEventListeners();
            
            // 设置UI事件
            this.setupUIHandlers();
            
            // 检查服务器状态
            await this.checkServerStatus();
            
            // 启动定时任务
            this.startPeriodicTasks();
            
            this.isInitialized = true;
            this.updateStatus('就绪');
            
            console.log('Rust Web Editor 初始化完成');
            Utils.Notification.success('编辑器初始化成功！');
            
        } catch (error) {
            console.error('应用初始化失败:', error);
            this.updateStatus('初始化失败');
            Utils.Notification.error('应用初始化失败: ' + error.message);
            throw error;
        }
    }

    /**
     * 初始化编辑器
     */
    async initializeEditor() {
        this.editor = new RustEditor('monaco-editor');
        await this.editor.initialize();
        
        // 设置主题
        this.editor.setTheme(this.config.theme);
        
        console.log('编辑器初始化完成');
    }

    /**
     * 初始化可视化器
     */
    initializeVisualizer() {
        this.visualizer = window.Visualizer.resultVisualizer;
        this.visualizer.initialize();
        
        console.log('可视化器初始化完成');
    }

    /**
     * 设置事件监听
     */
    setupEventListeners() {
        // 编辑器事件
        Utils.eventBus.on('editor:contentChanged', (data) => {
            this.onEditorContentChanged(data);
        });

        Utils.eventBus.on('editor:cursorChanged', (data) => {
            this.onEditorCursorChanged(data);
        });

        // Token 点击事件
        Utils.eventBus.on('token:click', (data) => {
            this.onTokenClick(data);
        });

        // 错误点击事件
        Utils.eventBus.on('error:click', (data) => {
            this.onErrorClick(data);
        });

        // 请求事件
        Utils.eventBus.on('request:start', (request) => {
            this.onRequestStart(request);
        });

        Utils.eventBus.on('request:complete', (request) => {
            this.onRequestComplete(request);
        });

        // 页面事件
        Utils.DOM.on(window, 'beforeunload', (e) => {
            this.onBeforeUnload(e);
        });

        Utils.DOM.on(window, 'resize', Utils.Debounce.debounce(() => {
            this.onWindowResize();
        }, 250));
    }

    /**
     * 设置UI事件处理
     */
    setupUIHandlers() {
        // 分析按钮
        const analyzeBtn = Utils.DOM.id('analyzeBtn');
        if (analyzeBtn) {
            Utils.DOM.on(analyzeBtn, 'click', () => {
                this.analyzeCode();
            });
        }

        // 清空按钮
        const clearBtn = Utils.DOM.id('clearBtn');
        if (clearBtn) {
            Utils.DOM.on(clearBtn, 'click', () => {
                this.clearEditor();
            });
        }

        // 示例按钮
        const exampleBtn = Utils.DOM.id('exampleBtn');
        if (exampleBtn) {
            Utils.DOM.on(exampleBtn, 'click', () => {
                this.loadExample();
            });
        }

        // 主题选择
        const themeSelect = Utils.DOM.id('themeSelect');
        if (themeSelect) {
            Utils.DOM.on(themeSelect, 'change', (e) => {
                this.changeTheme(e.target.value);
            });
        }

        // 键盘快捷键
        Utils.DOM.on(document, 'keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }

    /**
     * 分析代码
     */
    async analyzeCode() {
        if (this.state.isAnalyzing) {
            Utils.Notification.warning('正在分析中，请稍候...');
            return;
        }

        const code = this.editor.getValue();
        if (!code.trim()) {
            Utils.Notification.warning('请输入代码后再进行分析');
            return;
        }

        this.state.isAnalyzing = true;
        this.updateAnalyzeButton(true);
        this.showLoadingBar();

        try {
            this.updateStatus('正在分析代码...');
            
            const result = await API.analysisService.analyze(code);
            
            // 显示结果
            this.visualizer.showResults(result);
            
            // 在编辑器中显示错误
            if (result.errors && result.errors.length > 0) {
                this.editor.showErrors(result.errors);
                this.highlightErrorLines(result.errors);
            } else {
                this.editor.clearErrors();
                this.editor.clearHighlights();
            }

            // 保存到历史记录
            this.addToHistory({
                code,
                result,
                timestamp: Date.now()
            });

            this.state.lastAnalysisTime = Date.now();
            
            if (result.success) {
                this.updateStatus('分析完成');
                Utils.Notification.success('代码分析完成！');
            } else {
                this.updateStatus(`分析完成，发现 ${result.errors.length} 个错误`);
                Utils.Notification.warning(`分析完成，发现 ${result.errors.length} 个错误`);
            }

        } catch (error) {
            console.error('代码分析失败:', error);
            this.updateStatus('分析失败');
            Utils.Notification.error('代码分析失败: ' + error.message);
            
            // 清空结果显示
            this.visualizer.clearResults();
            this.editor.clearErrors();
            this.editor.clearHighlights();
            
        } finally {
            this.state.isAnalyzing = false;
            this.updateAnalyzeButton(false);
            this.hideLoadingBar();
        }
    }

    /**
     * 清空编辑器
     */
    clearEditor() {
        if (!confirm('确定要清空编辑器内容吗？')) {
            return;
        }

        this.editor.setValue('');
        this.visualizer.clearResults();
        this.editor.clearErrors();
        this.editor.clearHighlights();
        this.updateStatus('编辑器已清空');
        Utils.Notification.info('编辑器内容已清空');
    }

    /**
     * 加载示例代码
     */
    loadExample() {
        const exampleCode = this.editor.getDefaultCode();
        this.editor.setValue(exampleCode);
        Utils.Notification.info('示例代码已加载');
    }

    /**
     * 更改主题
     */
    changeTheme(theme) {
        this.config.theme = theme;
        this.editor.setTheme(theme);
        this.saveConfig();
        Utils.Notification.info(`主题已切换到: ${theme}`);
    }

    /**
     * 处理键盘快捷键
     */
    handleKeyboardShortcuts(e) {
        // Ctrl+Enter 或 Cmd+Enter: 分析代码
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            this.analyzeCode();
        }
        
        // Ctrl+Shift+L 或 Cmd+Shift+L: 清空编辑器
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
            e.preventDefault();
            this.clearEditor();
        }
        
        // F5: 刷新/重新分析
        if (e.key === 'F5') {
            e.preventDefault();
            this.analyzeCode();
        }
    }

    /**
     * 编辑器内容变化处理
     */
    onEditorContentChanged(data) {
        // 清除之前的错误标记
        this.editor.clearErrors();
        this.editor.clearHighlights();
        
        // 清空结果显示（可选）
        // this.visualizer.clearResults();
    }

    /**
     * 编辑器光标变化处理
     */
    onEditorCursorChanged(data) {
        const position = data.position;
        this.updateLineColumn(position.lineNumber, position.column);
    }

    /**
     * Token 点击处理
     */
    onTokenClick(data) {
        if (this.editor && data.line && data.column) {
            this.editor.goToLine(data.line);
            this.editor.setCursorPosition(data.line, data.column + 1);
            Utils.Notification.info(`跳转到第 ${data.line} 行，第 ${data.column + 1} 列`);
        }
    }

    /**
     * 错误点击处理
     */
    onErrorClick(data) {
        if (this.editor && data.line && data.column) {
            this.editor.goToLine(data.line);
            this.editor.setCursorPosition(data.line, data.column + 1);
            
            // 高亮错误行
            this.editor.highlightLines([data.line], 'editor-error-line');
            
            Utils.Notification.warning(`跳转到错误位置: 第 ${data.line} 行，第 ${data.column + 1} 列`);
        }
    }

    /**
     * 请求开始处理
     */
    onRequestStart(request) {
        if (request.id.startsWith('analyze_')) {
            this.showLoadingBar();
        }
    }

    /**
     * 请求完成处理
     */
    onRequestComplete(request) {
        if (request.id.startsWith('analyze_')) {
            this.hideLoadingBar();
        }
        
        if (request.id.startsWith('status_')) {
            this.updateServerStatus(request.error ? 'offline' : 'online');
        }
    }

    /**
     * 页面卸载前处理
     */
    onBeforeUnload(e) {
        // 保存当前状态
        this.saveCurrentState();
        
        // 如果有未保存的更改，提示用户
        const code = this.editor ? this.editor.getValue() : '';
        if (code.trim() && !this.state.lastAnalysisTime) {
            e.preventDefault();
            e.returnValue = '您有未分析的代码，确定要离开吗？';
        }
    }

    /**
     * 窗口大小变化处理
     */
    onWindowResize() {
        if (this.editor) {
            this.editor.resize();
        }
    }

    /**
     * 高亮错误行
     */
    highlightErrorLines(errors) {
        const errorLines = errors.map(error => error.line);
        this.editor.highlightLines(errorLines, 'editor-error-line');
    }

    /**
     * 更新分析按钮状态
     */
    updateAnalyzeButton(isAnalyzing) {
        const analyzeBtn = Utils.DOM.id('analyzeBtn');
        if (!analyzeBtn) return;

        if (isAnalyzing) {
            analyzeBtn.disabled = true;
            analyzeBtn.innerHTML = '<span class="loading-spinner"></span> 分析中...';
        } else {
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = '<span class="btn-icon">🔍</span> 分析代码';
        }
    }

    /**
     * 显示加载条
     */
    showLoadingBar() {
        const loadingBar = Utils.DOM.id('loadingBar');
        if (loadingBar) {
            Utils.DOM.addClass(loadingBar, 'active');
        }
    }

    /**
     * 隐藏加载条
     */
    hideLoadingBar() {
        const loadingBar = Utils.DOM.id('loadingBar');
        if (loadingBar) {
            Utils.DOM.removeClass(loadingBar, 'active');
        }
    }

    /**
     * 更新状态文本
     */
    updateStatus(text) {
        const statusText = Utils.DOM.id('statusText');
        if (statusText) {
            statusText.textContent = text;
        }
    }

    /**
     * 更新行列信息
     */
    updateLineColumn(line, column) {
        const lineCol = Utils.DOM.id('lineCol');
        if (lineCol) {
            lineCol.textContent = `行 ${line}, 列 ${column}`;
        }
    }

    /**
     * 更新服务器状态
     */
    updateServerStatus(status) {
        this.state.serverStatus = status;
        const serverStatus = Utils.DOM.id('serverStatus');
        if (serverStatus) {
            Utils.DOM.removeClass(serverStatus, 'online', 'offline');
            Utils.DOM.addClass(serverStatus, status);
            serverStatus.textContent = status === 'online' ? '服务器已连接' : '服务器未连接';
        }
    }

    /**
     * 检查服务器状态
     */
    async checkServerStatus() {
        try {
            await API.analysisService.checkStatus();
            this.updateServerStatus('online');
        } catch (error) {
            this.updateServerStatus('offline');
        }
    }

    /**
     * 启动定时任务
     */
    startPeriodicTasks() {
        // 定期检查服务器状态
        this.serverCheckInterval = setInterval(() => {
            this.checkServerStatus();
        }, this.config.serverCheckInterval);

        // 自动保存
        if (this.config.autoSave) {
            this.autoSaveInterval = setInterval(() => {
                this.autoSave();
            }, this.config.autoSaveInterval);
        }
    }

    /**
     * 自动保存
     */
    autoSave() {
        const code = this.editor ? this.editor.getValue() : '';
        if (code.trim()) {
            Utils.Storage.set('rust_editor_autosave', {
                code,
                timestamp: Date.now()
            });
        }
    }

    /**
     * 恢复自动保存的内容
     */
    restoreAutoSave() {
        const autoSave = Utils.Storage.get('rust_editor_autosave');
        if (autoSave && autoSave.code) {
            const shouldRestore = confirm(
                `发现自动保存的内容（${Utils.DateUtils.relative(autoSave.timestamp)}），是否恢复？`
            );
            
            if (shouldRestore) {
                this.editor.setValue(autoSave.code);
                Utils.Notification.success('已恢复自动保存的内容');
            }
        }
    }

    /**
     * 添加到历史记录
     */
    addToHistory(entry) {
        this.state.analysisHistory.unshift(entry);
        
        // 保持历史记录大小
        if (this.state.analysisHistory.length > this.config.maxHistorySize) {
            this.state.analysisHistory = this.state.analysisHistory.slice(0, this.config.maxHistorySize);
        }
        
        // 保存到本地存储
        Utils.Storage.set('rust_editor_history', this.state.analysisHistory);
    }

    /**
     * 加载配置
     */
    loadConfig() {
        const savedConfig = Utils.Storage.get('rust_editor_config');
        if (savedConfig) {
            this.config = { ...this.config, ...savedConfig };
        }
    }

    /**
     * 保存配置
     */
    saveConfig() {
        Utils.Storage.set('rust_editor_config', this.config);
    }

    /**
     * 保存当前状态
     */
    saveCurrentState() {
        const currentState = {
            code: this.editor ? this.editor.getValue() : '',
            theme: this.config.theme,
            timestamp: Date.now()
        };
        
        Utils.Storage.set('rust_editor_state', currentState);
    }

    /**
     * 恢复状态
     */
    restoreState() {
        const savedState = Utils.Storage.get('rust_editor_state');
        if (savedState) {
            if (savedState.code && this.editor) {
                this.editor.setValue(savedState.code);
            }
            
            if (savedState.theme) {
                this.config.theme = savedState.theme;
            }
        }
    }

    /**
     * 销毁应用
     */
    dispose() {
        // 清除定时器
        if (this.serverCheckInterval) {
            clearInterval(this.serverCheckInterval);
        }
        
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }

        // 保存当前状态
        this.saveCurrentState();

        // 销毁编辑器
        if (this.editor) {
            this.editor.dispose();
        }

        this.isInitialized = false;
        console.log('应用已销毁');
    }
}

// 创建全局应用实例
const rustWebEditor = new RustWebEditor();

// 页面加载完成后初始化应用
Utils.DOM.on(document, 'DOMContentLoaded', async () => {
    try {
        await rustWebEditor.initialize();
        
        // 恢复自动保存的内容
        setTimeout(() => {
            rustWebEditor.restoreAutoSave();
        }, 1000);
        
    } catch (error) {
        console.error('应用启动失败:', error);
    }
});

// 导出到全局
window.RustWebEditor = RustWebEditor;
window.rustWebEditor = rustWebEditor;
