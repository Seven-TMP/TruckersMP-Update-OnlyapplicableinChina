/**
 * 文件处理器模块
 * 处理文件相关操作
 */

const { dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { downloadFile, checkPermission } = require('./apiHandler');

/**
 * 选择目录
 */
async function selectDirectory(mainWindow) {
    try {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory', 'dontAddToRecent'],
            title: '选择 TMP 目录',
            buttonLabel: '选择此目录'
        });

        if (result.canceled || result.filePaths.length === 0) {
            return null;
        }

        return result.filePaths[0];
    } catch (error) {
        console.error('选择目录失败:', error);
        throw error;
    }
}

/**
 * 验证目录是否有效
 */
async function validateDirectory(dirPath) {
    if (!dirPath || typeof dirPath !== 'string') {
        return {
            valid: false,
            message: '目录路径无效'
        };
    }

    // 检查目录是否存在
    try {
        const stats = await fs.promises.stat(dirPath);
        if (!stats.isDirectory()) {
            return {
                valid: false,
                message: '路径不是目录'
            };
        }
        return {
            valid: true,
            message: '目录有效'
        };
    } catch (error) {
        if (error.code === 'ENOENT') {
            return {
                valid: false,
                message: '目录不存在，将自动创建'
            };
        }
        return {
            valid: false,
            message: `无法访问目录: ${error.message}`
        };
    }
}

/**
 * 更新文件
 * @param {Object} params - 更新参数
 * @param {Array} params.files - 文件列表
 * @param {string} params.targetDir - 目标目录
 * @param {string} params.filterType - 过滤类型 ('new' | 'old' | 'all')
 * @param {Object} event - IPC 事件
 */
async function updateFiles(params, event) {
    const { files, targetDir, filterType, versionType } = params;

    if (!files || !Array.isArray(files) || files.length === 0) {
        throw new Error('没有文件需要更新');
    }

    if (!targetDir) {
        throw new Error('目标目录未指定');
    }

    // 过滤文件 - 旧版和新版都更新所有文件
    let filesToUpdate = files;
    if (filterType === 'new') {
        // 新版目录不需要过滤，全部更新
        filesToUpdate = files;
    } else if (filterType === 'old') {
        // 旧版目录也需要更新所有文件
        filesToUpdate = files;
    }

    if (filesToUpdate.length === 0) {
        return {
            success: true,
            message: `${versionType}目录没有需要更新的文件`,
            updated: 0,
            failed: 0
        };
    }

    console.log(`开始更新 ${filesToUpdate.length} 个文件到 ${versionType}目录`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < filesToUpdate.length; i++) {
        const file = filesToUpdate[i];
        const progress = Math.round(((i + 1) / filesToUpdate.length) * 100);

        // 发送进度更新
        if (event && event.sender) {
            event.sender.send('download-progress', {
                filePath: file.filePath,
                progress,
                current: i + 1,
                total: filesToUpdate.length,
                status: 'downloading'
            });
        }

        try {
            // 清理路径
            let cleanFilePath = file.filePath
                .replace(/^[\/\\]/, '')
                .replace(/^tmp_file[\/\\]/, '')
                .replace(/\//g, '\\');

            const fullLocalPath = path.join(targetDir, cleanFilePath);
            const crypto = require('crypto');

            // 检查本地文件是否存在
            let needDownload = true;
            try {
                await fs.promises.access(fullLocalPath, fs.constants.F_OK);

                // 文件存在，检查 MD5
                if (file.md5) {
                    const localMD5 = await calculateFileMD5(fullLocalPath);
                    if (localMD5 && localMD5.toLowerCase() === file.md5.toLowerCase()) {
                        console.log(`文件无需更新 (MD5 一致): ${file.filePath}`);
                        needDownload = false;
                        // 发送跳过通知
                        if (event && event.sender) {
                            event.sender.send('download-progress', {
                                filePath: file.filePath,
                                progress,
                                current: i + 1,
                                total: filesToUpdate.length,
                                status: 'skipped',
                                message: '文件已是最新'
                            });
                        }
                    } else {
                        console.log(`MD5 不一致，需要更新: ${file.filePath}`);
                        console.log(`  本地: ${localMD5}`);
                        console.log(`  服务器: ${file.md5}`);
                    }
                }
            } catch (accessError) {
                // 文件不存在，需要下载
                console.log(`文件不存在，需要下载: ${file.filePath}`);
            }

            if (!needDownload) {
                skipCount++;
                continue;
            }

            const result = await downloadFile({
                url: file.downloadUrl,
                filePath: file.filePath,
                targetDir: targetDir
            }, event);

            if (result.success) {
                successCount++;
            } else {
                errorCount++;
                errors.push({
                    file: file.filePath,
                    error: result.message
                });
            }
        } catch (error) {
            errorCount++;
            errors.push({
                file: file.filePath,
                error: error.message
            });
        }
    }

    // 发送完成通知
    if (event && event.sender) {
        event.sender.send('download-progress', {
            progress: 100,
            status: 'completed',
            success: successCount,
            skipped: skipCount,
            failed: errorCount,
            errors: errors
        });
    }

    return {
        success: errorCount === 0,
        message: `${versionType}更新完成！成功: ${successCount}, 跳过: ${skipCount}, 失败: ${errorCount}`,
        updated: successCount,
        skipped: skipCount,
        failed: errorCount,
        errors: errors.length > 0 ? errors : undefined
    };
}

/**
 * 计算文件的 MD5
 */
async function calculateFileMD5(filePath) {
    const crypto = require('crypto');
    const fs = require('fs');

    try {
        const hash = crypto.createHash('md5');
        const stream = fs.createReadStream(filePath);

        return new Promise((resolve, reject) => {
            stream.on('data', (data) => hash.update(data));
            stream.on('end', () => resolve(hash.digest('hex')));
            stream.on('error', reject);
        });
    } catch (error) {
        return null;
    }
}
async function getDirectorySize(dirPath) {
    try {
        const files = await fs.promises.readdir(dirPath);
        let totalSize = 0;

        for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stats = await fs.promises.stat(filePath);

            if (stats.isDirectory()) {
                totalSize += await getDirectorySize(filePath);
            } else {
                totalSize += stats.size;
            }
        }

        return totalSize;
    } catch (error) {
        return 0;
    }
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i];
}

module.exports = {
    selectDirectory,
    validateDirectory,
    updateFiles,
    getDirectorySize,
    formatFileSize
};
