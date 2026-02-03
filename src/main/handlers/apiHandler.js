/**
 * API 处理器模块
 * 处理所有 API 调用
 */

const axios = require('axios');

const API_BASE_URL = 'https://da.vtcm.link/other';
const TIMEOUT = 15000;

/**
 * 获取文件列表
 */
async function getFileList() {
    try {
        console.log('正在获取文件列表...');

        const response = await axios.get(`${API_BASE_URL}/tmpFileList`, {
            timeout: TIMEOUT,
            headers: {
                'User-Agent': 'TMP-Update-Tool/2.0.0',
                'Accept': 'application/json'
            }
        });

        if (response.data && response.data.code === 200) {
            const files = response.data.data || [];
            console.log(`成功获取 ${files.length} 个文件`);
            return {
                success: true,
                data: files,
                message: `成功获取 ${files.length} 个文件`
            };
        }

        throw new Error('API返回的数据格式不正确');
    } catch (error) {
        console.error('获取文件列表失败:', error.message);
        return {
            success: false,
            error: error.message,
            message: `获取文件列表失败: ${error.message}`
        };
    }
}

/**
 * 下载文件（带重试机制）
 * @param {Object} params - 下载参数
 * @param {string} params.url - 文件 URL
 * @param {string} params.filePath - 文件路径
 * @param {string} params.targetDir - 目标目录
 * @param {Object} event - IPC 事件对象
 * @param {number} retryCount - 重试次数
 */
async function downloadFile(params, event, retryCount = 3) {
    const { url, filePath, targetDir } = params;

    if (!url || !filePath || !targetDir) {
        throw new Error('参数不完整');
    }

    const path = require('path');
    const fs = require('fs');

    // 清理路径
    let cleanPath = filePath
        .replace(/^[\/\\]/, '')
        .replace(/^tmp_file[\/\\]/, '')
        .replace(/\//g, '\\');

    const fullPath = path.join(targetDir, cleanPath);

    // 创建目录
    const dir = path.dirname(fullPath);
    await fs.promises.mkdir(dir, { recursive: true });

    // axios 配置
    const axiosConfig = {
        method: 'GET',
        url: url,
        responseType: 'stream',
        timeout: 120000, // 2分钟超时
        headers: {
            'User-Agent': 'TMP-Update-Tool/2.0.0'
        },
        // 禁用 HTTPS 验证（临时解决 TLS 问题）
        httpsAgent: new (require('https').Agent)({
            rejectUnauthorized: false
        })
    };

    for (let attempt = 1; attempt <= retryCount; attempt++) {
        try {
            console.log(`开始下载 (${attempt}/${retryCount}): ${filePath}`);

            const response = await axios(axiosConfig);

            const writer = fs.createWriteStream(fullPath);
            let downloadedBytes = 0;
            const totalBytes = parseInt(response.headers['content-length'] || '0', 10);

            // 进度更新
            response.data.on('data', (chunk) => {
                downloadedBytes += chunk.length;
                if (totalBytes > 0) {
                    const progress = Math.round((downloadedBytes / totalBytes) * 100);
                    if (event && event.sender) {
                        event.sender.send('download-progress', {
                            filePath,
                            progress,
                            downloadedBytes,
                            totalBytes
                        });
                    }
                }
            });

            // 管道传输
            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', () => {
                    console.log(`下载完成: ${fullPath}`);
                    resolve({
                        success: true,
                        filePath: fullPath,
                        message: '下载成功'
                    });
                });

                writer.on('error', (error) => {
                    console.error('下载写入错误:', error);
                    reject(new Error(`文件写入失败: ${error.message}`));
                });
            });

            return {
                success: true,
                filePath: fullPath,
                message: '下载成功'
            };

        } catch (error) {
            console.error(`下载失败 (${attempt}/${retryCount}): ${error.message}`);

            if (attempt < retryCount) {
                // 等待后重试
                const waitTime = attempt * 2000;
                console.log(`等待 ${waitTime}ms 后重试...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            } else {
                // 最后一次尝试也失败
                return {
                    success: false,
                    error: error.message,
                    message: `下载失败: ${error.message}`
                };
            }
        }
    }
}

/**
 * 检查目录权限
 */
async function checkPermission(dirPath) {
    const fs = require('fs');
    const path = require('path');

    if (!dirPath) {
        return {
            hasPermission: false,
            error: '目录路径为空',
            message: '请先选择目录'
        };
    }

    try {
        const testFile = path.join(dirPath, '.tmp_update_check');
        await fs.promises.writeFile(testFile, 'permission_test_' + Date.now());
        await fs.promises.unlink(testFile);

        return {
            hasPermission: true,
            message: '有权限访问该目录'
        };
    } catch (error) {
        console.error('权限检查失败:', error.message);

        return {
            hasPermission: false,
            error: error.code || error.message,
            message: error.code === 'EPERM'
                ? '需要管理员权限'
                : `无法访问目录: ${error.message}`
        };
    }
}

module.exports = {
    getFileList,
    downloadFile,
    checkPermission
};
