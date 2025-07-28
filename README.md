# simple-mock-proxy

**简介**
基于vite的proxy插件，可将vite代理的所有接口数据获取，存入本地mock/database，并生成对应的mock/api接口

### 一、使用方式
**1. 安装**
```bash
npm i simple-mock-proxy -D
```
**2. 配置**
	在vite.config.js/ts，首先按vite中的默认proxy配置项进行配置，确保能访问到后端接口。配置正确后，将proxy配置以参数形式，传入simpleMockProxy方法，各属性作用见下方代码注释。
```js
import { simpleMockProxy } from 'simple-mock-proxy'
{
    server: {
        proxy: simpleMockProxy({
            proxy: {
                '/api1': {
                    target: 'url1'
                },
                '/api2': {
                    target: 'url2'

                }
            },
            mockWrite: true,//是否开启写入本地mock接口与数据
            mockPath: '/mock', //指定写入路径（注意/不能省略）
            ts: true //写入接口文件类型是否为ts
        })
    }
}
```
**3. 使用**
配置完成后，进入浏览器，通过前端页面访问接口，会自动生成对应的mock接口与mock数据，生成文件内容存放在配置中的*mockPath*文件夹下

### 二、生成文件说明
以代理接口：/xxxA/xxxB/xxxC，mockPath:'/mock'，ts:true为例

**1. 生成mock接口文件路径**
/mock/api/xxxA/xxxB/xxxC.ts（路径中不存在的文件夹会自动创建）,路径规则如下
```js
mockPath + '/api'+ 后端接口路径 +'.ts'
```
**2. 生成mock数据文件路径**
/mock/database/xxxA/xxxB/xxxC.json（路径中不存在的文件夹会自动创建）,路径规则如下
```js
mockPath + '/database'+ 后端接口路径 +'.json'
```

**3. 生成mock接口文件内容**
生成的mock接口适用于vite-plugin-mock
 - jsonRead  读取json内容
 - simpleSend  返回响应数据

```js
		import { jsonRead, simpleSend } from 'simple-mock-proxy'
		const url =' /xxxA/xxxB/xxxC'
		export default [
		{
			url: '/mock' + url,
			method: 'post',
			rawResponse: async (req, res) => {
				const jsonData = await jsonRead('/mock/database' +url + '.json')
				simpleSend(req, res, jsonData)
			}
		}
	]
```



 ### 三、额外提供以下辅助函数用于mock接口文件
1. bodyParse(req) //解析请求头中的参数,使用方式见下方rawResponse，方法内部已处理了post与get请求获取参数差异
```js
		import { jsonRead, simpleSend } from 'simple-mock-proxy'
		const url =' /xxxA/xxxB/xxxC'
		export default [
		{
			url: '/mock' + url,
			method: 'post',
			rawResponse: async (req, res) => {
				const body = await bodyParser(req)
				const jsonData = await jsonRead('/mock/database' +url + '.json')
				simpleSend(req, res, jsonData)
			}
		}
	]
```
3. jsonWrite(filePath,data) //基于绝对路径创建json文件，并写入内容data
4. jsonRead(filePath) //基于绝对路径filePath读取json文件内容
5. getRandomId(length) //生成length长度的随机数
