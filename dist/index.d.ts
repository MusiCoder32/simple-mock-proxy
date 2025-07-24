import type { ProxyOptions } from 'vite';
/**
 * simpleProxy 封装 Vite server.proxy，支持代理响应写入 mock 目录及自动生成 mock api 文件。
 * @param opts
 *   - proxy：原始 Vite 代理配置对象
 *   - mockWrite：是否写入 mock 数据
 *   - mockPath：mock 根目录（默认 '/mock'）
 *   - ts：mock api 文件类型（true=ts，false=js，默认 true）
 */
export declare function simpleMockProxy(opts: {
    proxy: Record<string, ProxyOptions>;
    mockWrite?: boolean;
    mockPath?: string;
    ts?: boolean;
}): Record<string, ProxyOptions>;
export declare function jsonRead(filePath: any): {};
export declare function jsonWrite(filePath: any, data: any): Promise<void>;
export declare function simpleSend(req: any, res: any, data: any): void;
/**
 * 解析接口请求参数
 *
 * @export
 * @param {*} req
 * @returns {*}
 */
export declare function bodyParser(req: any): Promise<unknown>;
export declare function getRandomId(length?: number): string;
