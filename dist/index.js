import fs from 'fs-extra';
import path from 'path';
import zlib from 'zlib';
import formidable from 'formidable';
/**
 * simpleProxy 封装 Vite server.proxy，支持代理响应写入 mock 目录及自动生成 mock api 文件。
 * @param opts
 *   - proxy：原始 Vite 代理配置对象
 *   - mockWrite：是否写入 mock 数据
 *   - mockPath：mock 根目录（默认 '/mock'）
 *   - ts：mock api 文件类型（true=ts，false=js，默认 true）
 */
export function simpleMockProxy(opts) {
    const { proxy, mockWrite = true, mockPath = '/mock', ts = true } = opts;
    const wrapProxy = {};
    Object.entries(proxy).forEach(([context, value]) => {
        // 拷贝原 proxy 配置
        const cfg = {
            ...value,
            /**
             * configure 钩子用于扩展 http-proxy 行为
             */
            configure: (proxyServer, options) => {
                // 如果原配置有 configure，先执行
                if (typeof value.configure === 'function')
                    value.configure(proxyServer, options);
                if (mockWrite) {
                    // 监听代理响应事件
                    proxyServer.removeAllListeners('proxyRes');
                    proxyServer.on('proxyRes', async (proxyRes, req, res) => {
                        try {
                            if (req.url.indexOf('/mock') != 0) {
                                // 收集响应体
                                const chunks = [];
                                proxyRes.on('data', (chunk) => {
                                    chunks.push(chunk);
                                });
                                proxyRes.on('end', async () => {
                                    let responseContent;
                                    const jsonFilePath = await writeMockFile(req, mockPath, ts);
                                    if (proxyRes.headers['content-encoding'] === 'gzip') {
                                        zlib.gunzip(Buffer.concat(chunks), (err, decoded) => {
                                            responseContent = decoded.toString('utf8');
                                            fs.writeFile(jsonFilePath, responseContent);
                                        });
                                    }
                                    else {
                                        responseContent = Buffer.concat(chunks).toString('utf8');
                                        fs.writeFile(jsonFilePath, responseContent);
                                    }
                                });
                            }
                        }
                        catch (e) {
                            console.error('[simpleProxy][mockWrite]', e);
                        }
                    });
                }
            },
        };
        wrapProxy[context] = cfg;
    });
    return wrapProxy;
    async function writeMockFile(req, mockPath, ts) {
        // 获取无 query 的 url 路径
        const urlPath = req.url?.split('?')[0] || '';
        // 去除开头和结尾的 /，避免多余斜杠
        const normPath = urlPath.replace(/^\/+/, '').replace(/\/$/, '');
        // mock/database 目录及 json 文件完整路径
        const dbDir = path.join(process.cwd(), mockPath, 'database', path.dirname(normPath));
        const apiDir = path.join(process.cwd(), mockPath, 'api', path.dirname(normPath));
        await fs.ensureDir(dbDir); // 保证多级目录存在
        await fs.ensureDir(apiDir);
        const ext = ts ? 'ts' : 'js';
        const fileName = path.basename(normPath);
        const apiFilePath = path.join(apiDir, fileName + `.${ext}`);
        const jsonFilePath = path.join(dbDir, fileName + '.json');
        // 生成 mock api 文件内容
        const method = (req.method || 'GET').toLowerCase();
        const code = `import { jsonRead, simpleSend } from 'simple-mock-proxy'
    const url = '/${normPath}'
    export default [
        {

             url: '${mockPath}' + url,
            method: '${method}',
            rawResponse: async (req, res) => {
                const jsonData = await jsonRead('${mockPath}/database' + url + '.json')
                simpleSend(req, res, jsonData)
            },
        },
    ]
`.trim();
        // 写 mock api 文件
        fs.writeFile(apiFilePath, code);
        return jsonFilePath;
    }
}
export function jsonRead(filePath) {
    let result = {};
    try {
        const jsonFilePath = path.join(process.cwd(), filePath);
        result = fs.readJsonSync(jsonFilePath);
    }
    catch (e) {
        console.log(e);
    }
    return result;
}
export async function jsonWrite(filePath, data) {
    try {
        const jsonFilePath = path.join(process.cwd(), filePath);
        await fs.writeJsonSync(jsonFilePath, data, 'utf8');
    }
    catch (e) {
        console.log(e);
    }
}
export function simpleSend(req, res, data) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.statusCode = 200;
    res.end(JSON.stringify(data));
}
/**
 * 解析接口请求参数
 *
 * @export
 * @param {*} req
 * @returns {*}
 */
export function bodyParser(req) {
    const type = req.headers['content-type'];
    if (type.startsWith('multipart/form-data')) {
        return parseMultipart(req);
    }
    return new Promise((resolve) => {
        let jsonStr = {};
        let str = '';
        req.on('data', function (chunk) {
            str += chunk;
        });
        req.on('end', async () => {
            if (type.startsWith('application/json')) {
                jsonStr = JSON.parse(str);
            }
            if (type.startsWith('application/x-www-form-urlencoded')) {
                const params = new URLSearchParams(str);
                console.log(params, 444);
                const body = {};
                params.forEach((value, key) => {
                    body[key] = value;
                });
                jsonStr = body;
            }
            // if (type.startsWith('text/plain')) {
            // }
            resolve(jsonStr);
            return;
        });
    });
    async function parseMultipart(req) {
        const form = formidable({ multiples: false });
        return new Promise((resolve, reject) => {
            form.parse(req, (error, fields, files) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve({ ...fields, ...files });
            });
        });
    }
}
export function getRandomId(length = 18) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomId = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        randomId += characters.charAt(randomIndex);
    }
    return randomId;
}
