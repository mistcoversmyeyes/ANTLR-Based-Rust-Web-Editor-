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
    initialize() {
        if (this.isInitialized) return;

        this.setupTabSwitching();
        this.setupExportButtons();
        this.graphRenderer.initialize();
        
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
        this.currentData = data;
        
        try {
            // 显示 Token 流
            this.tokenRenderer.renderTokens(data.tokens);
            
            // 显示解析树
            if (data.parseTree && data.parseTree.dot) {
                this.graphRenderer.renderGraph(data.parseTree.dot, 'parseTreeViz');
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
        this.tableBody = Utils.DOM.id('tokensTableBody');
    }

    /**
     * 渲染 Token 列表
     */
    renderTokens(tokens) {
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
            // 等待 Graphviz 加载
            if (typeof Graphviz !== 'undefined') {
                this.graphviz = await Graphviz.load();
                console.log('Graphviz 初始化成功');
            } else {
                throw new Error('Graphviz 库未加载');
            }
        } catch (error) {
            console.error('Graphviz 初始化失败:', error);
            throw error;
        }
    }

    /**
     * 渲染图形
     */
    async renderGraph(dotString, containerId) {
        if (!this.graphviz) {
            console.error('Graphviz 未初始化');
            return;
        }

        const container = Utils.DOM.id(containerId);
        if (!container) {
            console.error(`容器 ${containerId} 未找到`);
            return;
        }

        try {
            // 显示加载状态
            const loadingOverlay = Utils.Loading.show(container, '正在生成图形...');

            // 生成 SVG
            const svg = await this.graphviz.dot(dotString, 'svg');
            
            // 清空容器并添加 SVG
            container.innerHTML = '';
            container.innerHTML = svg;

            // 设置SVG样式
            const svgElement = container.querySelector('svg');
            if (svgElement) {
                svgElement.style.maxWidth = '100%';
                svgElement.style.height = 'auto';
                svgElement.style.display = 'block';
                svgElement.style.margin = '0 auto';
                
                // 添加缩放和拖拽支持
                this.setupGraphInteraction(svgElement, containerId);
            }

            // 保存当前图形数据
            this.currentGraphs.set(containerId, {
                dotString,
                svg,
                timestamp: Date.now()
            });

            // 隐藏加载状态
            Utils.Loading.hide(loadingOverlay);

            console.log(`图形渲染完成: ${containerId}`);
            
        } catch (error) {
            console.error('图形渲染失败:', error);
            this.showGraphError(container, error.message);
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
}

/**
 * 错误渲染器
 */
class ErrorRenderer {
    constructor() {
        this.errorsList = Utils.DOM.id('errorsList');
    }

    /**
     * 渲染错误列表
     */
    renderErrors(errors) {
        if (!this.errorsList) {
            console.error('错误列表容器未找到');
            return;
        }

        // 清空现有内容
        this.errorsList.innerHTML = '';

        if (!errors || errors.length === 0) {
            this.showSuccessState();
            return;
        }

        errors.forEach((error, index) => {
            const errorElement = this.createErrorElement(error, index);
            this.errorsList.appendChild(errorElement);
        });

        console.log(`显示了 ${errors.length} 个错误`);
    }

    /**
     * 创建错误元素
     */
    createErrorElement(error, index) {
        const errorDiv = Utils.DOM.create('div', { className: 'error-item' });
        
        errorDiv.innerHTML = `
            <div class="error-header">
                <span class="error-type">Error ${index + 1}</span>
                <span class="error-location">Line ${error.line}, Column ${error.column}</span>
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
        this.errorsList.innerHTML = `
            <div class="empty-state success">
                <p>✅ 暂无错误</p>
            </div>
        `;
    }

    /**
     * 清空错误显示
     */
    clear() {
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
