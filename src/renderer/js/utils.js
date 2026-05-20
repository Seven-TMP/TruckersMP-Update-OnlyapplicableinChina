/**
 * 工具函数模块
 */

/**
 * 格式化时间
 */
function formatTime(date, format = 'YYYY-MM-DD HH:mm:ss') {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i];
}

/**
 * 格式化字节数（带进度）
 */
function formatBytesWithProgress(downloaded, total) {
    const downloadedStr = formatFileSize(downloaded);
    const totalStr = formatFileSize(total);

    if (total === 0) return downloadedStr;

    const percent = ((downloaded / total) * 100).toFixed(1);
    return `${downloadedStr} / ${totalStr} (${percent}%)`;
}

/**
 * 安全解析 JSON
 */
function safeJSONParse(str, defaultValue = null) {
    try {
        return JSON.parse(str);
    } catch (error) {
        console.error('JSON 解析失败:', error);
        return defaultValue;
    }
}

/**
 * 防抖函数
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * 节流函数
 */
function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * 复制文本到剪贴板
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('复制失败:', error);
        return false;
    }
}

/**
 * 生成唯一 ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * 延迟函数
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 获取元素样式
 */
function getStyle(element, property) {
    return window.getComputedStyle(element).getPropertyValue(property);
}

/**
 * 添加动画类
 */
function addAnimation(element, animationClass) {
    element.classList.add(animationClass);
    element.addEventListener('animationend', () => {
        element.classList.remove(animationClass);
    }, { once: true });
}

/**
 * 滚动到元素
 */
function scrollToElement(element, behavior = 'smooth') {
    element.scrollIntoView({ behavior, block: 'center' });
}

/**
 * 检查是否是有效 URL
 */
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

/**
 * 截取字符串（带省略号）
 */
function truncate(str, maxLength = 50) {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
}

/**
 * 工具函数模块
 */

const Utils = {
    formatTime,
    formatFileSize,
    formatBytesWithProgress,
    safeJSONParse,
    debounce,
    throttle,
    copyToClipboard,
    generateId,
    delay,
    getStyle,
    addAnimation,
    scrollToElement,
    isValidUrl,
    truncate
};

// 导出
window.Utils = Utils;
