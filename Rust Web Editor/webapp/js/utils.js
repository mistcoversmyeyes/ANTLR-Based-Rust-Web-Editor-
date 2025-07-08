/**
 * 工具函数集合
 */

// DOM 操作工具
const DOM = {
    /**
     * 通过 ID 获取元素
     */
    id(id) {
        return document.getElementById(id);
    },

    /**
     * 通过选择器获取单个元素
     */
    query(selector) {
        return document.querySelector(selector);
    },

    /**
     * 通过选择器获取所有元素
     */
    queryAll(selector) {
        return document.querySelectorAll(selector);
    },

    /**
     * 创建元素
     */
    create(tag, attributes = {}, text = '') {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'innerHTML') {
                element.innerHTML = value;
            } else {
                element.setAttribute(key, value);
            }
        });

        if (text) {
            element.textContent = text;
        }

        return element;
    },

    /**
     * 添加事件监听器
     */
    on(element, event, handler, options = {}) {
        element.addEventListener(event, handler, options);
    },

    /**
     * 移除事件监听器
     */
    off(element, event, handler) {
        element.removeEventListener(event, handler);
    },

    /**
     * 添加CSS类
     */
    addClass(element, className) {
        element.classList.add(className);
    },

    /**
     * 移除CSS类
     */
    removeClass(element, className) {
        element.classList.remove(className);
    },

    /**
     * 切换CSS类
     */
    toggleClass(element, className) {
        element.classList.toggle(className);
    },

    /**
     * 检查是否包含CSS类
     */
    hasClass(element, className) {
        return element.classList.contains(className);
    }
};

// 字符串工具
const StringUtils = {
    /**
     * 转义HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * 截断文本
     */
    truncate(text, maxLength, suffix = '...') {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - suffix.length) + suffix;
    },

    /**
     * 首字母大写
     */
    capitalize(text) {
        return text.charAt(0).toUpperCase() + text.slice(1);
    },

    /**
     * 驼峰命名转换
     */
    camelCase(text) {
        return text.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    },

    /**
     * 短横线命名转换
     */
    kebabCase(text) {
        return text.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    }
};

// 数组工具
const ArrayUtils = {
    /**
     * 数组去重
     */
    unique(array) {
        return [...new Set(array)];
    },

    /**
     * 数组分组
     */
    groupBy(array, key) {
        return array.reduce((groups, item) => {
            const group = typeof key === 'function' ? key(item) : item[key];
            groups[group] = groups[group] || [];
            groups[group].push(item);
            return groups;
        }, {});
    },

    /**
     * 数组排序
     */
    sortBy(array, key, order = 'asc') {
        return array.sort((a, b) => {
            const aVal = typeof key === 'function' ? key(a) : a[key];
            const bVal = typeof key === 'function' ? key(b) : b[key];
            
            if (order === 'desc') {
                return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
            }
            return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        });
    },

    /**
     * 数组分块
     */
    chunk(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
};

// 日期工具
const DateUtils = {
    /**
     * 格式化日期
     */
    format(date, format = 'YYYY-MM-DD HH:mm:ss') {
        const d = new Date(date);
        const map = {
            'YYYY': d.getFullYear(),
            'MM': String(d.getMonth() + 1).padStart(2, '0'),
            'DD': String(d.getDate()).padStart(2, '0'),
            'HH': String(d.getHours()).padStart(2, '0'),
            'mm': String(d.getMinutes()).padStart(2, '0'),
            'ss': String(d.getSeconds()).padStart(2, '0')
        };

        return format.replace(/YYYY|MM|DD|HH|mm|ss/g, matched => map[matched]);
    },

    /**
     * 相对时间
     */
    relative(date) {
        const now = new Date();
        const diff = now - new Date(date);
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} 天前`;
        if (hours > 0) return `${hours} 小时前`;
        if (minutes > 0) return `${minutes} 分钟前`;
        return '刚刚';
    }
};

// 文件工具
const FileUtils = {
    /**
     * 读取文件内容
     */
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    },

    /**
     * 下载文件
     */
    download(content, filename, type = 'text/plain') {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const link = DOM.create('a', {
            href: url,
            download: filename,
            style: 'display: none'
        });
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    /**
     * 获取文件扩展名
     */
    getExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    },

    /**
     * 格式化文件大小
     */
    formatSize(bytes) {
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
};

// 验证工具
const Validator = {
    /**
     * 验证邮箱
     */
    email(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },

    /**
     * 验证URL
     */
    url(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },

    /**
     * 验证JSON
     */
    json(text) {
        try {
            JSON.parse(text);
            return true;
        } catch {
            return false;
        }
    },

    /**
     * 验证非空
     */
    required(value) {
        return value !== null && value !== undefined && value.toString().trim() !== '';
    }
};

// 存储工具
const Storage = {
    /**
     * 设置本地存储
     */
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage set error:', e);
            return false;
        }
    },

    /**
     * 获取本地存储
     */
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Storage get error:', e);
            return defaultValue;
        }
    },

    /**
     * 删除本地存储
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Storage remove error:', e);
            return false;
        }
    },

    /**
     * 清空本地存储
     */
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (e) {
            console.error('Storage clear error:', e);
            return false;
        }
    }
};

// 防抖和节流
const Debounce = {
    /**
     * 防抖函数
     */
    debounce(func, delay) {
        let timer;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => func.apply(this, args), delay);
        };
    },

    /**
     * 节流函数
     */
    throttle(func, delay) {
        let last = 0;
        return function (...args) {
            const now = Date.now();
            if (now - last >= delay) {
                last = now;
                func.apply(this, args);
            }
        };
    }
};

// 事件总线
class EventBus {
    constructor() {
        this.events = {};
    }

    /**
     * 监听事件
     */
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    /**
     * 移除事件监听
     */
    off(event, callback) {
        if (!this.events[event]) return;
        
        if (callback) {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        } else {
            delete this.events[event];
        }
    }

    /**
     * 触发事件
     */
    emit(event, ...args) {
        if (!this.events[event]) return;
        
        this.events[event].forEach(callback => {
            try {
                callback(...args);
            } catch (error) {
                console.error(`Event '${event}' callback error:`, error);
            }
        });
    }

    /**
     * 只监听一次
     */
    once(event, callback) {
        const wrapper = (...args) => {
            callback(...args);
            this.off(event, wrapper);
        };
        this.on(event, wrapper);
    }
}

// 全局事件总线实例
const eventBus = new EventBus();

// 通知系统
const Notification = {
    /**
     * 显示通知
     */
    show(message, type = 'info', duration = 3000) {
        const notification = DOM.create('div', {
            className: `notification notification-${type}`,
            innerHTML: `
                <div class="notification-content">
                    <span class="notification-message">${StringUtils.escapeHtml(message)}</span>
                    <button class="notification-close">&times;</button>
                </div>
            `
        });

        let container = DOM.query('.notifications-container');
        if (!container) {
            container = DOM.create('div', { className: 'notifications-container' });
            document.body.appendChild(container);
        }

        container.appendChild(notification);

        // 动画显示
        setTimeout(() => DOM.addClass(notification, 'show'), 10);

        // 关闭按钮
        const closeBtn = notification.querySelector('.notification-close');
        const close = () => {
            DOM.removeClass(notification, 'show');
            setTimeout(() => {
                if (notification.parentNode) {
                    container.removeChild(notification);
                }
            }, 300);
        };

        DOM.on(closeBtn, 'click', close);

        // 自动关闭
        if (duration > 0) {
            setTimeout(close, duration);
        }

        return close;
    },

    success(message, duration) {
        return this.show(message, 'success', duration);
    },

    error(message, duration) {
        return this.show(message, 'error', duration);
    },

    warning(message, duration) {
        return this.show(message, 'warning', duration);
    },

    info(message, duration) {
        return this.show(message, 'info', duration);
    }
};

// 加载状态管理
const Loading = {
    show(element, text = '加载中...') {
        const loader = DOM.create('div', {
            className: 'loading-overlay',
            innerHTML: `
                <div class="loading-spinner"></div>
                <div class="loading-text">${StringUtils.escapeHtml(text)}</div>
            `
        });

        element.style.position = 'relative';
        element.appendChild(loader);
        return loader;
    },

    hide(loader) {
        if (loader && loader.parentNode) {
            loader.parentNode.removeChild(loader);
        }
    }
};

// 导出所有工具
window.Utils = {
    DOM,
    StringUtils,
    ArrayUtils,
    DateUtils,
    FileUtils,
    Validator,
    Storage,
    Debounce,
    EventBus,
    eventBus,
    Notification,
    Loading
};
