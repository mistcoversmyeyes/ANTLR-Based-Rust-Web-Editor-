/**
 * API 通信模块
 * 处理与后端的通信，包括请求发送、响应处理、错误处理等
 */

class ApiClient {
    constructor() {
        this.baseUrl = 'http://localhost:7071';
        this.timeout = 30000; // 30秒超时
        this.retryCount = 3;
        this.retryDelay = 1000;
    }

    /**
     * 设置基础URL
     */
    setBaseUrl(url) {
        this.baseUrl = url.replace(/\/$/, ''); // 移除末尾斜杠
    }

    /**
     * 发送HTTP请求
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // 添加超时控制
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        config.signal = controller.signal;

        try {
            const response = await fetch(url, config);
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // 根据响应类型解析数据
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                return await response.text();
            }
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('请求超时，请检查网络连接或稍后重试');
            }
            
            throw error;
        }
    }

    /**
     * 带重试的请求
     */
    async requestWithRetry(endpoint, options = {}, retryCount = this.retryCount) {
        let lastError;
        
        for (let i = 0; i <= retryCount; i++) {
            try {
                return await this.request(endpoint, options);
            } catch (error) {
                lastError = error;
                
                // 如果是最后一次尝试，直接抛出错误
                if (i === retryCount) {
                    throw error;
                }
                
                // 如果是客户端错误（4xx），不进行重试
                if (error.message.includes('HTTP 4')) {
                    throw error;
                }
                
                console.warn(`请求失败，${this.retryDelay}ms后进行第${i + 1}次重试:`, error.message);
                await this.delay(this.retryDelay * (i + 1)); // 递增延迟
            }
        }
        
        throw lastError;
    }

    /**
     * 延迟函数
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 分析Rust代码
     */
    async analyzeCode(code) {
        if (!code || code.trim() === '') {
            throw new Error('代码不能为空');
        }

        try {
            const response = await this.requestWithRetry('/analyse', {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8'
                },
                body: code
            });

            // 验证响应格式
            if (!this.validateAnalysisResponse(response)) {
                throw new Error('服务器返回的数据格式不正确');
            }

            return response;
        } catch (error) {
            console.error('代码分析失败:', error);
            throw new Error(`代码分析失败: ${error.message}`);
        }
    }

    /**
     * 验证分析响应格式
     */
    validateAnalysisResponse(response) {
        if (!response || typeof response !== 'object') {
            return false;
        }

        // 检查必需字段
        if (typeof response.success !== 'boolean') {
            return false;
        }

        if (!Array.isArray(response.tokens)) {
            return false;
        }

        if (!response.parseTree || typeof response.parseTree !== 'object') {
            return false;
        }

        if (!Array.isArray(response.errors)) {
            return false;
        }

        // 验证tokens格式
        for (const token of response.tokens) {
            if (!token.type || !token.text || 
                typeof token.line !== 'number' || 
                typeof token.column !== 'number') {
                return false;
            }
        }

        // 验证parseTree格式
        if (typeof response.parseTree.lisp !== 'string' || 
            typeof response.parseTree.dot !== 'string') {
            return false;
        }

        // TODO: 验证 AST 格式

        // 验证errors格式
        for (const error of response.errors) {
            if (typeof error.line !== 'number' || 
                typeof error.column !== 'number' || 
                typeof error.message !== 'string') {
                return false;
            }
        }

        return true;
    }

    /**
     * 检查服务器状态
     */
    async checkServerStatus() {
        try {
            // 发送一个简单的健康检查请求
            await this.request('/health', { method: 'GET' });
            return { online: true, message: '服务器连接正常' };
        } catch (error) {
            return { online: false, message: error.message };
        }
    }

    /**
     * 获取服务器信息
     */
    async getServerInfo() {
        try {
            const info = await this.request('/info', { method: 'GET' });
            return info;
        } catch (error) {
            console.warn('无法获取服务器信息:', error.message);
            return null;
        }
    }
}

/**
 * 请求状态管理
 */
class RequestManager {
    constructor() {
        this.activeRequests = new Map();
        this.requestHistory = [];
        this.maxHistorySize = 50;
    }

    /**
     * 开始请求
     */
    startRequest(id, description = '') {
        const request = {
            id,
            description,
            startTime: Date.now(),
            status: 'pending'
        };

        this.activeRequests.set(id, request);
        this.addToHistory(request);

        // 触发请求开始事件
        Utils.eventBus.emit('request:start', request);

        return request;
    }

    /**
     * 完成请求
     */
    completeRequest(id, result = null, error = null) {
        const request = this.activeRequests.get(id);
        if (!request) return;

        request.endTime = Date.now();
        request.duration = request.endTime - request.startTime;
        request.status = error ? 'error' : 'success';
        request.result = result;
        request.error = error;

        this.activeRequests.delete(id);

        // 触发请求完成事件
        Utils.eventBus.emit('request:complete', request);

        return request;
    }

    /**
     * 取消请求
     */
    cancelRequest(id) {
        const request = this.activeRequests.get(id);
        if (!request) return;

        request.endTime = Date.now();
        request.duration = request.endTime - request.startTime;
        request.status = 'cancelled';

        this.activeRequests.delete(id);

        // 触发请求取消事件
        Utils.eventBus.emit('request:cancel', request);

        return request;
    }

    /**
     * 添加到历史记录
     */
    addToHistory(request) {
        this.requestHistory.unshift({ ...request });
        
        // 保持历史记录大小
        if (this.requestHistory.length > this.maxHistorySize) {
            this.requestHistory = this.requestHistory.slice(0, this.maxHistorySize);
        }
    }

    /**
     * 获取活跃请求
     */
    getActiveRequests() {
        return Array.from(this.activeRequests.values());
    }

    /**
     * 获取请求历史
     */
    getRequestHistory() {
        return [...this.requestHistory];
    }

    /**
     * 清空历史记录
     */
    clearHistory() {
        this.requestHistory = [];
    }
}

/**
 * 分析服务包装器
 */
class AnalysisService {
    constructor() {
        this.client = new ApiClient();
        this.requestManager = new RequestManager();
        this.cache = new Map();
        this.cacheEnabled = true;
        this.maxCacheSize = 20;
    }

    /**
     * 分析代码
     */
    async analyze(code) {
        const cacheKey = this.getCacheKey(code);
        
        // 检查缓存
        if (this.cacheEnabled && this.cache.has(cacheKey)) {
            console.log('使用缓存结果');
            return this.cache.get(cacheKey);
        }

        const requestId = `analyze_${Date.now()}`;
        const request = this.requestManager.startRequest(requestId, '代码分析');

        try {
            const result = await this.client.analyzeCode(code);
            
            // 缓存结果
            if (this.cacheEnabled) {
                this.addToCache(cacheKey, result);
            }

            this.requestManager.completeRequest(requestId, result);
            return result;
        } catch (error) {
            this.requestManager.completeRequest(requestId, null, error);
            throw error;
        }
    }

    /**
     * 检查服务器状态
     */
    async checkStatus() {
        const requestId = `status_${Date.now()}`;
        const request = this.requestManager.startRequest(requestId, '服务器状态检查');

        try {
            const result = await this.client.checkServerStatus();
            this.requestManager.completeRequest(requestId, result);
            return result;
        } catch (error) {
            this.requestManager.completeRequest(requestId, null, error);
            throw error;
        }
    }

    /**
     * 生成缓存键
     */
    getCacheKey(code) {
        // 使用简单的哈希函数生成缓存键
        let hash = 0;
        for (let i = 0; i < code.length; i++) {
            const char = code.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转换为32位整数
        }
        return `code_${hash}`;
    }

    /**
     * 添加到缓存
     */
    addToCache(key, value) {
        // 如果缓存已满，删除最旧的条目
        if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            ...value,
            cachedAt: Date.now()
        });
    }

    /**
     * 清空缓存
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * 启用/禁用缓存
     */
    setCacheEnabled(enabled) {
        this.cacheEnabled = enabled;
        if (!enabled) {
            this.clearCache();
        }
    }

    /**
     * 设置服务器地址
     */
    setServerUrl(url) {
        this.client.setBaseUrl(url);
        this.clearCache(); // 更改服务器后清空缓存
    }
}

// 创建全局实例
const analysisService = new AnalysisService();

// 导出API模块
window.API = {
    ApiClient,
    RequestManager,
    AnalysisService,
    analysisService
};
