
'use strict'

import Ajv from 'ajv'

const defaultOverTime = 20 * 1000
let rootUrl = null
let ajv = null

const validate = (scheme, data) => {
    if(!ajv) {
        ajv = new Ajv()
    }
    return ajv.validate(scheme, data)
}

const buildUrl = (url) => {
    const apiurl = `${rootUrl}/${url}`
    let connector = url.indexOf('?') === -1 ? '?' : '&'
    return `${apiurl}${connector}token=${global.constants.token}`
}

const setUrl = (url, params) => {
    if (params) {
        let paramsArray = []
        Object.keys(params).forEach((key) => paramsArray.push(key + '=' + params[key]))
        const connection = url.search(/\?/) === -1? '?':'&'
        url += connection + paramsArray.join('&')
    }
    return url
}

const setRequest = (method, body) => {
    const base = {
        method: method
    }
    const contentType = {
        'Content-Type': 'application/json'
    }
    if (method == 'POST') {
        return {
            ...base,
            headers: {
                Accept: 'application/json',
                ...contentType
            },
            body: JSON.stringify(body)
        }
    }
    if (method == 'PUT') {
        return {
            ...base,
            headers: {
                ...contentType
            },
            body: JSON.stringify(body)
        }
    }
    return {
        ...base
    }
}

const handleResult = async (scheme, response, resolve, reject) => {
    switch(response.status) {
        case 400:
            let bodyText = null
            try {
                bodyText = JSON.parse(response._bodyText)
            } catch (err) {
                bodyText = await response.json()
            }
            reject(bodyText)
            break
        case 204:
            resolve({message: '成功'})
            break
        case 401:
            reject({message: '您的账号已过期，请重新登录'})
            break
        default:
            scheme = null? resolve(response.json()):
            !(scheme instanceof Object)? resolve(response.json()):
                validate(scheme, response.json())? resolve(response.json())
                    :reject('接口数据格式有误')
            break
    }
}

const handleError = (err, reject) => {
    if (err.message && err.message == 'Network request failed') {
        reject({message: '网络连接失败'})
    } else {
        reject(err)
    }
}

const delay = (overTime) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            reject(new Error('网络请求超时'))
        }, overTime)
    })
}

const _fetch = (fetch, overTime) => {
    return Promise.race([fetch, delay(overTime)])
}

const initRootUrl = (url) => {
    rootUrl = url
}

const get = (url, params, scheme = null, overTime = defaultOverTime) =>
    _fetch(
        new Promise((resolve, reject) => {
            fetch(buildUrl(setUrl(url, params)), setRequest('GET'))
                .then(async (response) => handleResult(scheme, response, resolve, reject))
                .catch((err) => handleError(err, reject))
        }),
        overTime
    )

const post = (url, body, params, scheme = null, overTime = defaultOverTime) =>
    _fetch(
        new Promise((resolve, reject) => {
            fetch(buildUrl(setUrl(url, params)), setRequest('POST', body))
                .then(async (response) => handleResult(scheme, response, resolve, reject))
                .catch((err) => handleError(err, reject))
        }),
        overTime
    )

const put = (url, body, params, scheme = null, overTime = defaultOverTime) =>
    _fetch(
        new Promise((resolve, reject) => {
            fetch(buildUrl(setUrl(url, params)), setRequest('PUT', body))
                .then(async (response) => handleResult(scheme, response, resolve, reject))
                .catch((err) => handleError(err, reject))
        }),
        overTime
    )

const del = (url, params, scheme = null, overTime = defaultOverTime) =>
    _fetch(
        new Promise((resolve, reject) => {
            fetch(buildUrl(setUrl(url, params)), setRequest('DELETE'))
                .then(async (response) => handleResult(scheme, response, resolve, reject))
                .catch((err) => handleError(err, reject))
        }),
        overTime
    )

const postDrict = (url, body, overTime = defaultOverTime) =>
    _fetch(
        new Promise((resolve, reject) =>
            fetch(url, setRequest('POST', body))
                .then((response) => response.json())
                .then((result) => resolve(result))
                .catch((error) => reject(error))
        ),
        overTime
    )

export {
    initRootUrl,
    get,
    post,
    put,
    del,
    postDrict,
}
