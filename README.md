# react-native-fetch-strong

封装fetch，支持服务器地址、请求超时、接口响应的数据校验配置。

## 版本

v1.0.3(目前最新版本)
v1.0.2
v1.0.1
v1.0.0

## 使用说明

```
文件结构
--- request.js
--- action.js
```

`
request.js
`

```javascript
'use strict'

import Request from 'react-native-fetch-strong'

const request = new Request({ server: '10.8.30.30:8080', overTime: 20*1000 }) // { } 对象可缺省, 默认 { server: 'localhost:5000', overTime: 20 * 1000 }

export default request

```

`
action.js
`

```javascript

import Request from './request'

Request.post(url, body, params, scheme, overTime).then(rs => {
    // 成功
}, (err) => {
    // 失败
    // 包含情况：状态码200之外的所有、数据校验不通过
})
```

## API说明

`
scheme: 需要满足的数据格式, 默认为null时 不校验数据格式
`

`
overTime: 接口超时时间, 默认不传时为20秒
`

```
get = (url, params, scheme = null, overTime = defaultOverTime)
```

```
post = (url, body, params, scheme = null, overTime = defaultOverTime)
```

```
put = (url, body, params, scheme = null, overTime = defaultOverTime)
```

```
del = (url, params, scheme = null, overTime = defaultOverTime)
```

## 后续规划

增加支持取消超时的请求
