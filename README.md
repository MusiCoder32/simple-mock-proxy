# simple-mock-proxy
对外提供了一个核心方法simple-mock-proxy,用于拓展vite的proxy功能，在开启配置时，可以自动将代理接口的数据写入本地，并自动生成对应的mock接口
```js
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
            mockPath: '/mock', //指定写入路径
            ts: true //写入接口文件类型是否为ts
        })
    }
}
```


额外提供以下辅助函数
bodyParse(req) //解析请求头中的参数
jsonWrite(filePath,data) //基于绝对路径创建json文件，并写入内容data
jsonRead(filePath) //基于绝对路径filePath读取json文件内容
getRandomId(length) //生成length长度的随机数
