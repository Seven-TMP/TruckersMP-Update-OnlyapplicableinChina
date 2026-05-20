/**
 * API 调用封装模块
 * 封装所有与主进程的 IPC 通信
 */

// ========== 窗口控制 ==========

/**
 * 最小化窗口
 */
async function minimizeWindow() {
    try {
        await window.windowControls.minimize();
    } catch (error) {
        console.error('最小化窗口失败:', error);
        throw error;
    }
}

/**
 * 最大化/还原窗口
 */
async function maximizeWindow() {
    try {
        await window.windowControls.maximize();
    } catch (error) {
        console.error('最大化窗口失败:', error);
        throw error;
    }
}

/**
 * 关闭窗口
 */
async function closeWindow() {
    try {
        await window.windowControls.close();
    } catch (error) {
        console.error('关闭窗口失败:', error);
        throw error;
    }
}

// ========== 文件操作 ==========

/**
 * 获取文件列表
 */
async function fetchFileList() {
    try {
        const result = await window.fileAPI.getFileList();
        return result;
    } catch (error) {
        console.error('获取文件列表失败:', error);
        return {
            success: false,
            error: error.message,
            message: '获取文件列表失败'
        };
    }
}

/**
 * 下载文件
 */
async function downloadFile(url, filePath, targetDir) {
    try {
        const result = await window.fileAPI.downloadFile(url, filePath, targetDir);
        return result;
    } catch (error) {
        console.error('下载文件失败:', error);
        return {
            success: false,
            error: error.message,
            message: '下载失败'
        };
    }
}

/**
 * 检查目录权限
 */
async function checkDirectoryPermission(dirPath) {
    try {
        const result = await window.fileAPI.checkPermission(dirPath);
        return result;
    } catch (error) {
        console.error('检查权限失败:', error);
        return {
            hasPermission: false,
            error: error.message,
            message: '权限检查失败'
        };
    }
}

/**
 * 选择目录
 */
async function selectDirectory() {
    try {
        const result = await window.fileAPI.selectDirectory();
        return result;
    } catch (error) {
        console.error('选择目录失败:', error);
        return null;
    }
}

/**
 * 验证目录
 */
async function validateDirectory(dirPath) {
    try {
        const result = await window.fileAPI.validateDirectory(dirPath);
        return result;
    } catch (error) {
        console.error('验证目录失败:', error);
        return {
            valid: false,
            message: '验证失败'
        };
    }
}

/**
 * 更新文件
 */
async function updateFiles(files, targetDir, filterType, versionType) {
    try {
        const result = await window.fileAPI.updateFiles(files, targetDir, filterType, versionType);
        return result;
    } catch (error) {
        console.error('更新文件失败:', error);
        return {
            success: false,
            error: error.message,
            message: '更新失败'
        };
    }
}

// ========== 进度监听 ==========

/**
 * 监听下载进度
 */
function onDownloadProgress(callback) {
    if (window.progressAPI && window.progressAPI.onDownloadProgress) {
        window.progressAPI.onDownloadProgress(callback);
    }
}

/**
 * 移除进度监听
 */
function removeProgressListener() {
    if (window.progressAPI && window.progressAPI.removeProgressListener) {
        window.progressAPI.removeProgressListener();
    }
}

// ========== 消息框 ==========

/**
 * 显示消息框
 */
async function showMessage(options) {
    try {
        const result = await window.dialogAPI.showMessage(options);
        return result;
    } catch (error) {
        console.error('显示消息框失败:', error);
        return null;
    }
}

/**
 * 显示错误框
 */
async function showError(title, message) {
    try {
        await window.dialogAPI.showError(title, message);
    } catch (error) {
        console.error('显示错误框失败:', error);
    }
}

/**
 * 显示确认框
 */
async function showConfirm(title, message) {
    const result = await showMessage({
        type: 'question',
        title: title,
        message: message,
        buttons: ['确认', '取消'],
        defaultId: 0,
        cancelId: 1
    });
    return result?.response === 0;
}

// ========== 应用信息 ==========

/**
 * 获取应用版本
 */
async function getAppVersion() {
    try {
        const version = await window.appInfo.getVersion();
        return version;
    } catch (error) {
        console.error('获取版本失败:', error);
        return '2.0.0';
    }
}

/**
 * 获取 TMP 目录路径
 */
async function getTmpPath() {
    try {
        const path = await window.appInfo.getTmpPath();
        return path;
    } catch (error) {
        console.error('获取 TMP 路径失败:', error);
        return null;
    }
}

/**
 * 打开开发者工具
 */
async function openDevTools() {
    try {
        await window.appInfo.openDevTools();
    } catch (error) {
        console.error('打开开发者工具失败:', error);
    }
}

// 导出
window.API = {
    // 窗口控制
    minimizeWindow,
    maximizeWindow,
    closeWindow,
    // 文件操作
    fetchFileList,
    downloadFile,
    checkDirectoryPermission,
    selectDirectory,
    validateDirectory,
    updateFiles,
    // 进度监听
    onDownloadProgress,
    removeProgressListener,
    // 消息框
    showMessage,
    showError,
    showConfirm,
    // 应用信息
    getAppVersion,
    getTmpPath,
    openDevTools
};
