/**
 * 结果可视化模块
 * 负责 TokenStream、ParseTree、AST 的可视化展示
 */

class ResultVisualizer {
    constructor() {
        this.currentData = null;
        this.graphRenderer = new GraphRenderer();
        this.tokenRenderer = new TokenRenderer();
        this.errorRenderer = new ErrorRenderer();
        this.isInitialized = false;
    }

    /**
     * 初始化可视化组件
     */
    async initialize() {
        if (this.isInitialized) return;

        console.log('开始初始化可视化组件...');

        this.setupTabSwitching();
        this.setupExportButtons();
        
        // 初始化各个渲染器
        try {
            this.tokenRenderer.initialize();
            this.errorRenderer.initialize();
            console.log('Token 和错误渲染器初始化成功');
        } catch (error) {
            console.error('渲染器初始化失败:', error);
        }
        
        // 异步初始化图形渲染器
        try {
            await this.graphRenderer.initialize();
            console.log('图形渲染器初始化成功');
        } catch (error) {
            console.error('图形渲染器初始化失败:', error);
            Utils.Notification.warning('图形渲染器初始化失败，解析树可视化可能无法正常工作');
        }
        
        this.isInitialized = true;
        console.log('结果可视化器初始化完成');
    }

    /**
     * 设置选项卡切换
     */
    setupTabSwitching() {
        const tabButtons = Utils.DOM.queryAll('.tab-button');
        const tabContents = Utils.DOM.queryAll('.tab-content');

        tabButtons.forEach(button => {
            Utils.DOM.on(button, 'click', () => {
                const targetTab = button.dataset.tab;
                
                // 更新按钮状态
                tabButtons.forEach(btn => Utils.DOM.removeClass(btn, 'active'));
                Utils.DOM.addClass(button, 'active');
                
                // 更新内容显示
                tabContents.forEach(content => {
                    Utils.DOM.removeClass(content, 'active');
                    if (content.id === `${targetTab}-tab`) {
                        Utils.DOM.addClass(content, 'active');
                    }
                });

                // 触发选项卡切换事件
                Utils.eventBus.emit('visualizer:tabChanged', targetTab);
            });
        });
    }

    /**
     * 设置导出按钮
     */
    setupExportButtons() {
        // Token 导出
        const exportTokensBtn = Utils.DOM.id('exportTokens');
        if (exportTokensBtn) {
            Utils.DOM.on(exportTokensBtn, 'click', () => {
                this.tokenRenderer.exportTokens();
            });
        }

        // 解析树导出
        const exportParseTreeBtn = Utils.DOM.id('exportParseTree');
        if (exportParseTreeBtn) {
            Utils.DOM.on(exportParseTreeBtn, 'click', () => {
                this.graphRenderer.exportSVG('parseTree');
            });
        }

        // AST 导出
        const exportASTBtn = Utils.DOM.id('exportAST');
        if (exportASTBtn) {
            Utils.DOM.on(exportASTBtn, 'click', () => {
                this.graphRenderer.exportSVG('ast');
            });
        }

        // 重置缩放按钮
        const resetZoomBtn = Utils.DOM.id('resetZoom');
        if (resetZoomBtn) {
            Utils.DOM.on(resetZoomBtn, 'click', () => {
                this.graphRenderer.resetZoom('parseTreeViz');
            });
        }

        const resetASTZoomBtn = Utils.DOM.id('resetASTZoom');
        if (resetASTZoomBtn) {
            Utils.DOM.on(resetASTZoomBtn, 'click', () => {
                this.graphRenderer.resetZoom('astViz');
            });
        }
    }

    /**
     * 显示分析结果
     */
    showResults(data) {
        console.log('开始显示分析结果:', data);
        this.currentData = data;
        
        try {
            // 显示 Token 流
            if (data.tokens) {
                console.log(`显示 ${data.tokens.length} 个 Token`);
                this.tokenRenderer.renderTokens(data.tokens);
            }
            
            // 显示解析树
            if (data.parseTree && data.parseTree.dot) {
                console.log('开始渲染解析树，DOT 长度:', data.parseTree.dot.length);
                this.graphRenderer.renderGraph(data.parseTree.dot, 'parseTreeViz');
            } else {
                console.warn('没有解析树数据或 DOT 数据为空');
                const parseTreeContainer = Utils.DOM.id('parseTreeViz');
                if (parseTreeContainer) {
                    parseTreeContainer.innerHTML = `
                        <div class="empty-state">
                            <p>⚠️ 没有解析树数据</p>
                        </div>
                    `;
                }
            }
            
            // 显示错误信息
            this.errorRenderer.renderErrors(data.errors);
            
            // 更新错误计数
            this.updateErrorSummary(data.errors);
            
            Utils.eventBus.emit('visualizer:resultsShown', data);
            
        } catch (error) {
            console.error('结果显示失败:', error);
            Utils.Notification.error('结果显示失败: ' + error.message);
        }
    }

    /**
     * 清空所有结果
     */
    clearResults() {
        this.currentData = null;
        this.tokenRenderer.clear();
        this.graphRenderer.clear();
        this.errorRenderer.clear();
        this.updateErrorSummary([]);
    }

    /**
     * 更新错误摘要
     */
    updateErrorSummary(errors) {
        const errorSummary = Utils.DOM.id('errorSummary');
        const errorCount = Utils.DOM.query('.error-count');
        
        if (errorCount) {
            errorCount.textContent = `${errors.length} 个错误`;
        }
        
        if (errors.length === 0) {
            if (errorSummary) {
                errorSummary.innerHTML = '<span class="error-count success">✅ 无错误</span>';
            }
        }
    }
}

/**
 * Token 渲染器
 */
class TokenRenderer {
    constructor() {
        this.tableBody = null;
        this.currentTokens = null;
    }

    /**
     * 初始化 Token 渲染器
     */
    initialize() {
        this.tableBody = Utils.DOM.id('tokensTableBody');
        if (!this.tableBody) {
            console.warn('Token 表格容器未找到');
        }
    }

    /**
     * 渲染 Token 列表
     */
    renderTokens(tokens) {
        this.currentTokens = tokens;
        
        if (!this.tableBody) {
            console.error('Token 表格容器未找到');
            return;
        }

        // 清空现有内容
        this.tableBody.innerHTML = '';

        if (!tokens || tokens.length === 0) {
            this.showEmptyState();
            return;
        }

        tokens.forEach((token, index) => {
            const row = this.createTokenRow(token, index + 1);
            this.tableBody.appendChild(row);
        });

        console.log(`渲染了 ${tokens.length} 个 Token`);
    }

    /**
     * 创建 Token 行
     */
    createTokenRow(token, index) {
        const row = Utils.DOM.create('tr');
        
        row.innerHTML = `
            <td class="token-index">${index}</td>
            <td class="token-type">${Utils.StringUtils.escapeHtml(token.type)}</td>
            <td class="token-text">${Utils.StringUtils.escapeHtml(token.text)}</td>
            <td class="token-position">${token.line}</td>
            <td class="token-position">${token.column}</td>
        `;

        // 添加点击事件，跳转到对应位置
        Utils.DOM.on(row, 'click', () => {
            Utils.eventBus.emit('token:click', {
                token,
                line: token.line,
                column: token.column
            });
        });

        return row;
    }

    /**
     * 显示空状态
     */
    showEmptyState() {
        this.tableBody.innerHTML = `
            <tr class="empty-state">
                <td colspan="5">暂无数据，请先分析代码</td>
            </tr>
        `;
    }

    /**
     * 导出 Token 数据
     */
    exportTokens() {
        if (!this.currentTokens || this.currentTokens.length === 0) {
            Utils.Notification.warning('没有可导出的 Token 数据');
            return;
        }

        try {
            // 生成 CSV 格式
            const csvHeader = 'Index,Type,Text,Line,Column\n';
            const csvRows = this.currentTokens.map((token, index) => {
                const escapedText = `"${token.text.replace(/"/g, '""')}"`;
                return `${index + 1},${token.type},${escapedText},${token.line},${token.column}`;
            }).join('\n');

            const csvContent = csvHeader + csvRows;
            const filename = `tokens_${Utils.DateUtils.format(new Date(), 'YYYYMMDD_HHmmss')}.csv`;
            
            Utils.FileUtils.download(csvContent, filename, 'text/csv');
            Utils.Notification.success('Token 数据导出成功');
            
        } catch (error) {
            console.error('Token 导出失败:', error);
            Utils.Notification.error('Token 导出失败: ' + error.message);
        }
    }

    /**
     * 清空显示
     */
    clear() {
        this.currentTokens = null;
        this.showEmptyState();
    }
}

/**
 * 图形渲染器
 */
class GraphRenderer {
    constructor() {
        this.graphviz = null;
        this.currentGraphs = new Map();
        this.zoomFactors = new Map();
    }

    /**
     * 初始化 Graphviz
     */
    async initialize() {
        try {
            console.log('开始初始化 Graphviz...');
            
            // 等待页面加载完成
            if (document.readyState !== 'complete') {
                await new Promise(resolve => {
                    window.addEventListener('load', resolve);
                });
            }
            
            // 多次检查 Viz.js 是否已加载（可能需要等待）
            let vizLoaded = false;
            for (let i = 0; i < 10; i++) {
                if (typeof window.Viz !== 'undefined') {
                    vizLoaded = true;
                    break;
                }
                console.log(`第 ${i + 1} 次检查 Viz.js 状态...`);
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            if (vizLoaded) {
                console.log('Viz.js 已加载，创建实例...');
                console.log('Viz 对象:', window.Viz);
                this.graphviz = {
                    dot: async (dotString) => {
                        const viz = new window.Viz();
                        return await viz.renderSVGElement(dotString);
                    }
                };
                console.log('Graphviz 初始化成功');
            } else {
                console.log('Viz.js 仍未加载，尝试动态加载...');
                await this.loadVizJS();
            }
        } catch (error) {
            console.error('Graphviz 初始化失败:', error);
            throw error;
        }
    }

    /**
     * 动态加载 viz.js
     */
    async loadVizJS() {
        return new Promise((resolve, reject) => {
            console.log('开始动态加载 Viz.js...');
            
            // 暂时禁用AMD以避免冲突
            const oldDefine = window.define;
            window.define = undefined;
            
            const script1 = document.createElement('script');
            script1.src = 'https://unpkg.com/viz.js@2.1.2/viz.js';
            script1.onload = () => {
                console.log('Viz.js 主文件加载完成');
                
                const script2 = document.createElement('script');
                script2.src = 'https://unpkg.com/viz.js@2.1.2/full.render.js';
                script2.onload = () => {
                    console.log('Viz.js 渲染器加载完成');
                    
                    // 恢复AMD
                    window.define = oldDefine;
                    
                    // 等待一下确保全局变量可用
                    setTimeout(() => {
                        if (typeof window.Viz !== 'undefined') {
                            console.log('动态加载的 Viz 对象:', window.Viz);
                            // 创建 Graphviz 实例
                            this.graphviz = {
                                dot: async (dotString) => {
                                    const viz = new window.Viz();
                                    return await viz.renderSVGElement(dotString);
                                }
                            };
                            console.log('Viz.js 动态加载成功');
                            resolve();
                        } else {
                            reject(new Error('Viz.js 动态加载后仍不可用'));
                        }
                    }, 200);
                };
                script2.onerror = (error) => {
                    // 恢复AMD
                    window.define = oldDefine;
                    console.error('Viz.js 渲染器加载失败:', error);
                    reject(error);
                };
                document.head.appendChild(script2);
            };
            script1.onerror = (error) => {
                // 恢复AMD
                window.define = oldDefine;
                console.error('Viz.js 主文件加载失败:', error);
                reject(error);
            };
            document.head.appendChild(script1);
        });
    }

    /**
     * 渲染图形
     */
    async renderGraph(dotString, containerId) {
        console.log(`开始渲染图形到容器: ${containerId}`);
        console.log('DOT 字符串长度:', dotString.length);
        console.log('DOT 字符串前100字符:', dotString.substring(0, 100));

        if (!this.graphviz) {
            console.error('Graphviz 未初始化，尝试重新初始化...');
            try {
                await this.initialize();
            } catch (error) {
                console.error('Graphviz 重新初始化失败:', error);
                this.showGraphError(Utils.DOM.id(containerId), 'Graphviz 未能正确加载');
                return;
            }
        }

        const container = Utils.DOM.id(containerId);
        if (!container) {
            console.error(`容器 ${containerId} 未找到`);
            return;
        }

        try {
            // 显示加载状态
            container.innerHTML = '<div class="loading-overlay"><div class="loading-spinner"></div><div class="loading-text">正在生成图形...</div></div>';

            // 处理 DOT 字符串中的转义字符
            let processedDotString = dotString;
            
            // 替换 HTML 转义字符
            processedDotString = processedDotString
                .replace(/\\u003d/g, '=')
                .replace(/\\u003e/g, '>')
                .replace(/\\u003c/g, '<')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'");

            // 修复常见的 DOT 语法问题
            processedDotString = this.fixDotSyntax(processedDotString);

            console.log('处理后的 DOT 字符串前100字符:', processedDotString.substring(0, 100));

            // 生成 SVG
            let svg;
            if (this.graphviz && this.graphviz.dot) {
                console.log('调用 Graphviz 生成 SVG...');
                svg = await this.graphviz.dot(processedDotString);
                console.log('SVG 生成成功，类型:', typeof svg, svg instanceof Element ? 'Element' : 'Other');
            } else {
                throw new Error('Graphviz dot 方法不可用');
            }

            // 检查 SVG 结果
            if (!svg) {
                throw new Error('生成的 SVG 为空');
            }
            
            // 清空容器并添加 SVG
            container.innerHTML = '';
            
            if (svg instanceof Element) {
                // SVG 是 DOM 元素
                container.appendChild(svg);
                console.log('SVG 元素已添加到容器');
            } else if (typeof svg === 'string') {
                // SVG 是字符串
                container.innerHTML = svg;
                console.log('SVG 字符串已添加到容器');
            } else {
                throw new Error('未知的 SVG 格式: ' + typeof svg);
            }

            // 设置SVG样式
            const svgElement = container.querySelector('svg');
            if (svgElement) {
                svgElement.style.maxWidth = '100%';
                svgElement.style.height = 'auto';
                svgElement.style.display = 'block';
                svgElement.style.margin = '0 auto';
                
                // 添加缩放和拖拽支持
                this.setupGraphInteraction(svgElement, containerId);
                
                console.log('SVG 元素配置完成');
            } else {
                console.warn('未找到 SVG 元素');
            }

            // 保存当前图形数据
            this.currentGraphs.set(containerId, {
                dotString: processedDotString,
                svg: typeof svg === 'string' ? svg : svg.outerHTML,
                timestamp: Date.now()
            });

            console.log(`图形渲染完成: ${containerId}`);
            
        } catch (error) {
            console.error('图形渲染失败:', error);
            console.error('错误详情:', error.message);
            this.showGraphError(container, `图形渲染失败: ${error.message}`);
        }
    }

    /**
     * 设置图形交互
     */
    setupGraphInteraction(svgElement, containerId) {
        let isDragging = false;
        let startX, startY, startTransform;
        
        // 获取当前缩放因子
        let zoomFactor = this.zoomFactors.get(containerId) || 1;
        
        // 鼠标滚轮缩放
        Utils.DOM.on(svgElement, 'wheel', (e) => {
            e.preventDefault();
            
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            zoomFactor *= delta;
            zoomFactor = Math.max(0.1, Math.min(5, zoomFactor)); // 限制缩放范围
            
            svgElement.style.transform = `scale(${zoomFactor})`;
            this.zoomFactors.set(containerId, zoomFactor);
        });

        // 鼠标拖拽
        Utils.DOM.on(svgElement, 'mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            
            const transform = svgElement.style.transform;
            startTransform = transform || '';
            
            svgElement.style.cursor = 'grabbing';
        });

        Utils.DOM.on(document, 'mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            svgElement.style.transform = `${startTransform} translate(${deltaX}px, ${deltaY}px)`;
        });

        Utils.DOM.on(document, 'mouseup', () => {
            if (isDragging) {
                isDragging = false;
                svgElement.style.cursor = 'grab';
            }
        });

        // 设置初始光标
        svgElement.style.cursor = 'grab';
    }

    /**
     * 重置缩放
     */
    resetZoom(containerId) {
        const container = Utils.DOM.id(containerId);
        if (!container) return;

        const svgElement = container.querySelector('svg');
        if (svgElement) {
            svgElement.style.transform = '';
            this.zoomFactors.set(containerId, 1);
        }
    }

    /**
     * 导出 SVG
     */
    exportSVG(graphType) {
        const containerId = graphType === 'parseTree' ? 'parseTreeViz' : 'astViz';
        const graphData = this.currentGraphs.get(containerId);
        
        if (!graphData) {
            Utils.Notification.warning('没有可导出的图形数据');
            return;
        }

        try {
            const filename = `${graphType}_${Utils.DateUtils.format(new Date(), 'YYYYMMDD_HHmmss')}.svg`;
            Utils.FileUtils.download(graphData.svg, filename, 'image/svg+xml');
            Utils.Notification.success('图形导出成功');
            
        } catch (error) {
            console.error('图形导出失败:', error);
            Utils.Notification.error('图形导出失败: ' + error.message);
        }
    }

    /**
     * 显示图形错误
     */
    showGraphError(container, message) {
        container.innerHTML = `
            <div class="empty-state">
                <p>❌ 图形生成失败</p>
                <p style="color: #dc3545; font-size: 0.9em;">${Utils.StringUtils.escapeHtml(message)}</p>
            </div>
        `;
    }

    /**
     * 清空所有图形
     */
    clear() {
        this.currentGraphs.clear();
        this.zoomFactors.clear();
        
        // 清空解析树容器
        const parseTreeContainer = Utils.DOM.id('parseTreeViz');
        if (parseTreeContainer) {
            parseTreeContainer.innerHTML = `
                <div class="empty-state">
                    <p>暂无解析树，请先分析代码</p>
                </div>
            `;
        }

        // 清空 AST 容器
        const astContainer = Utils.DOM.id('astViz');
        if (astContainer) {
            astContainer.innerHTML = `
                <div class="empty-state">
                    <p>暂无AST，请先分析代码</p>
                </div>
            `;
        }
    }

    /**
     * 修复常见的 DOT 语法问题
     */
    fixDotSyntax(dotString) {
        try {
            console.log('开始修复 DOT 语法...');
            
            // 分行处理
            let lines = dotString.split('\n');
            let fixedLines = [];
            
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i].trim();
                
                // 跳过空行和注释
                if (!line || line.startsWith('//') || line.startsWith('/*')) {
                    fixedLines.push(lines[i]);
                    continue;
                }
                
                // 修复节点标签中的特殊字符
                if (line.includes('[label=')) {
                    line = this.fixNodeLabel(line);
                }
                
                // 修复连接线语法
                if (line.includes('->') || line.includes('--')) {
                    line = this.fixEdgeSyntax(line);
                }
                
                // 确保行末有分号（除了大括号行）
                if (!line.endsWith(';') && !line.endsWith('{') && !line.endsWith('}') && line.trim() !== '') {
                    line = line + ';';
                }
                
                fixedLines.push(line);
            }
            
            const fixedDot = fixedLines.join('\n');
            console.log('DOT 语法修复完成');
            
            // 验证基本语法
            this.validateDotSyntax(fixedDot);
            
            return fixedDot;
            
        } catch (error) {
            console.warn('DOT 语法修复失败，使用原始字符串:', error);
            return dotString;
        }
    }

    /**
     * 修复节点标签
     */
    fixNodeLabel(line) {
        // 匹配 [label="..."] 格式
        const labelMatch = line.match(/\[label="([^"]*)"\]/);
        if (labelMatch) {
            let labelText = labelMatch[1];
            // 转义特殊字符
            labelText = labelText
                .replace(/"/g, '\\"')  // 转义双引号
                .replace(/\n/g, '\\n') // 转义换行
                .replace(/\t/g, '\\t') // 转义制表符
                .replace(/\\/g, '\\\\'); // 转义反斜杠（最后处理）
            
            return line.replace(labelMatch[0], `[label="${labelText}"]`);
        }
        return line;
    }

    /**
     * 修复边的语法
     */
    fixEdgeSyntax(line) {
        // 移除行末多余的逗号或分号
        line = line.replace(/[,;]+$/, '');
        
        // 确保箭头前后有空格
        line = line.replace(/(\w)->(\w)/g, '$1 -> $2');
        line = line.replace(/(\w)--(\w)/g, '$1 -- $2');
        
        return line;
    }

    /**
     * 基本的 DOT 语法验证
     */
    validateDotSyntax(dotString) {
        const lines = dotString.split('\n').map(l => l.trim()).filter(l => l);
        
        // 检查是否以 digraph 或 graph 开头
        if (!lines[0].startsWith('digraph') && !lines[0].startsWith('graph')) {
            throw new Error('DOT 文件必须以 digraph 或 graph 开头');
        }
        
        // 检查大括号匹配
        let braceCount = 0;
        for (const line of lines) {
            braceCount += (line.match(/{/g) || []).length;
            braceCount -= (line.match(/}/g) || []).length;
        }
        
        if (braceCount !== 0) {
            console.warn('大括号不匹配，但继续处理...');
        }
        
        console.log('DOT 语法验证通过');
    }
}

/**
 * 错误渲染器
 */
class ErrorRenderer {
    constructor() {
        this.container = null;
        this.currentErrors = null;
    }

    /**
     * 初始化错误渲染器
     */
    initialize() {
        this.container = Utils.DOM.id('errorsList');
        if (!this.container) {
            console.warn('错误显示容器未找到');
        }
    }

    /**
     * 渲染错误信息
     */
    renderErrors(errors) {
        console.log('开始渲染错误信息:', errors);
        this.currentErrors = errors;

        if (!this.container) {
            console.error('错误显示容器未找到');
            return;
        }

        // 清空现有内容
        this.container.innerHTML = '';

        if (!errors || errors.length === 0) {
            this.showSuccessState();
            return;
        }

        errors.forEach((error, index) => {
            const errorElement = this.createErrorElement(error, index);
            this.container.appendChild(errorElement);
        });

        console.log(`渲染了 ${errors.length} 个错误`);
    }

    /**
     * 创建错误元素
     */
    createErrorElement(error, index) {
        const errorDiv = Utils.DOM.create('div', 'error-item');
        
        errorDiv.innerHTML = `
            <div class="error-header">
                <span class="error-number">${index + 1}</span>
                <span class="error-location">行 ${error.line}, 列 ${error.column}</span>
            </div>
            <div class="error-message">${Utils.StringUtils.escapeHtml(error.message)}</div>
        `;

        // 添加点击事件，跳转到错误位置
        Utils.DOM.on(errorDiv, 'click', () => {
            Utils.eventBus.emit('error:click', {
                error,
                line: error.line,
                column: error.column
            });
        });

        return errorDiv;
    }

    /**
     * 显示成功状态
     */
    showSuccessState() {
        this.container.innerHTML = `
            <div class="empty-state success">
                <p>✅ 暂无错误</p>
            </div>
        `;
    }

    /**
     * 清空错误显示
     */
    clear() {
        this.currentErrors = null;
        this.showSuccessState();
    }
}

// 创建全局实例
const resultVisualizer = new ResultVisualizer();

// 导出可视化模块
window.Visualizer = {
    ResultVisualizer,
    GraphRenderer,
    TokenRenderer,
    ErrorRenderer,
    resultVisualizer
};

// 调试辅助函数
window.debugViz = {
    // 检查 Viz.js 状态
    checkViz: () => {
        const vizExists = typeof window.Viz !== 'undefined';
        console.log('Viz.js 状态:', vizExists ? '已加载' : '未加载');
        if (vizExists) {
            console.log('window.Viz:', window.Viz);
            console.log('window.Viz.prototype:', window.Viz.prototype);
            try {
                const testViz = new window.Viz();
                console.log('Viz 实例创建成功:', testViz);
            } catch (error) {
                console.error('Viz 实例创建失败:', error);
            }
        }
        return vizExists;
    },
    
    // 检查渲染器状态
    checkRenderer: () => {
        console.log('GraphRenderer 实例:', resultVisualizer.graphRenderer);
        console.log('graphviz 对象:', resultVisualizer.graphRenderer.graphviz);
        if (resultVisualizer.graphRenderer.graphviz) {
            console.log('dot 方法:', typeof resultVisualizer.graphRenderer.graphviz.dot);
        }
    },
    
    // 强制重新初始化
    forceReinit: async () => {
        console.log('强制重新初始化 GraphRenderer...');
        resultVisualizer.graphRenderer.graphviz = null;
        try {
            await resultVisualizer.graphRenderer.initialize();
            console.log('重新初始化成功');
        } catch (error) {
            console.error('重新初始化失败:', error);
        }
    },
    
    // 测试简单图形
    testSimple: async () => {
        const dot = 'digraph G { A -> B; B -> C; }';
        console.log('测试简单图形:', dot);
        try {
            await resultVisualizer.graphRenderer.renderGraph(dot, 'parseTreeViz');
            console.log('简单图形测试成功');
        } catch (error) {
            console.error('简单图形测试失败:', error);
        }
    },
    
    // 测试当前的解析树数据
    testCurrent: () => {
        if (resultVisualizer.currentData && resultVisualizer.currentData.parseTree) {
            const dot = resultVisualizer.currentData.parseTree.dot;
            console.log('测试当前解析树数据，DOT长度:', dot.length);
            console.log('DOT前200字符:', dot.substring(0, 200));
            resultVisualizer.graphRenderer.renderGraph(dot, 'parseTreeViz');
        } else {
            console.log('没有当前解析树数据');
        }
    },
    
    // 检查Viz.js状态
    checkViz: () => {
        console.log('Viz.js 状态:', typeof Viz !== 'undefined' ? '已加载' : '未加载');
        if (typeof Viz !== 'undefined') {
            try {
                const viz = new Viz();
                console.log('Viz实例创建成功');
            } catch (error) {
                console.error('Viz实例创建失败:', error);
            }
        }
    },
    
    // 检查渲染器状态
    checkRenderer: () => {
        const renderer = resultVisualizer.graphRenderer;
        console.log('GraphRenderer状态:');
        console.log('- graphviz实例:', !!renderer.graphviz);
        console.log('- dot方法:', renderer.graphviz ? !!renderer.graphviz.dot : 'N/A');
        console.log('- 当前图形数量:', renderer.currentGraphs.size);
    },
    
    // 分析当前的 DOT 字符串
    analyzeDot: () => {
        if (resultVisualizer.currentData && resultVisualizer.currentData.parseTree) {
            const dot = resultVisualizer.currentData.parseTree.dot;
            console.log('=== DOT 字符串分析 ===');
            console.log('长度:', dot.length);
            console.log('前200字符:', dot.substring(0, 200));
            
            // 分行分析
            const lines = dot.split('\n');
            console.log('总行数:', lines.length);
            
            // 查找第42行附近的内容
            console.log('=== 第40-45行内容 ===');
            for (let i = 39; i < Math.min(45, lines.length); i++) {
                console.log(`第${i+1}行: "${lines[i]}"`);
            }
            
            // 检查语法问题
            console.log('=== 语法检查 ===');
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line && !line.startsWith('//')) {
                    // 检查是否有未闭合的引号
                    const quotes = (line.match(/"/g) || []).length;
                    if (quotes % 2 !== 0) {
                        console.warn(`第${i+1}行可能有未闭合的引号: "${line}"`);
                    }
                    
                    // 检查是否有多余的逗号
                    if (line.includes(',,') || line.endsWith(',;') || line.endsWith(',}')) {
                        console.warn(`第${i+1}行可能有多余的逗号: "${line}"`);
                    }
                }
            }
            
            return dot;
        } else {
            console.log('没有当前解析树数据');
            return null;
        }
    },
    
    // 测试修复后的 DOT
    testFixedDot: () => {
        const dot = debugViz.analyzeDot();
        if (dot) {
            console.log('=== 测试修复后的 DOT ===');
            const renderer = resultVisualizer.graphRenderer;
            const fixedDot = renderer.fixDotSyntax(dot);
            console.log('修复后长度:', fixedDot.length);
            console.log('修复后前200字符:', fixedDot.substring(0, 200));
            return fixedDot;
        }
        return null;
    }
};
