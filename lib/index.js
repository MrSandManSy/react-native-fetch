
'use strict'

import Ajv from 'ajv'

const defaultOptions = {
    overTime: 20 * 1000,
    server: 'http://localhost:5000',
}

class Request {

    static instance = null

    constructor(option) {
        super()
        if(Request.instance){
            return Request.instance
        }
        this.option = option || defaultOptions
        this.ajv = new Ajv()
        return Request.instance = this
    }

    validate = async (scheme, data, resolve, reject) => {
        if (!this.ajv) {
            this.ajv = new Ajv()
        }
        this.ajv.compile(scheme)
        return await validate(data).then((data) => resolve(data)).catch((err) => reject(err.errors))
    }
    
    buildUrl = (url) => {
        const connector = url.indexOf('?') === -1 ? '?' : '&'
        return `${this.options.server}/${url}${connector}token=${global.constants.token}`
    }
    
    setUrl = (url, params) => {
        if (params) {
            let paramsArray = []
            Object.keys(params).forEach((key) => paramsArray.push(key + '=' + params[key]))
            const connection = url.search(/\?/) === -1 ? '?' : '&'
            url += connection + paramsArray.join('&')
        }
        return url
    }
    
    setRequest = (method, body) => {
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
    
    handleResult = async (scheme, response, resolve, reject) => {
        switch (response.status) {
            case 400:
                let bodyText = null
                try {
                    bodyText = JSON.parse(response._bodyText)
                } catch (err) {
                    bodyText = await response.json()
                }
                return reject(bodyText)
            case 204:
                return resolve({message: '成功'})
            case 401:
                return reject({message: '您的账号已过期，请重新登录'})
            default:
                if (scheme == null || !(scheme instanceof Object)) {
                    return resolve(response.json())
                } else {
                    const data = await response.json()
                    return validate(scheme, data, resolve, reject)
                }
        }
    }
    
    handleError = (err, reject) => err.message && err.message == 'Network request failed'? reject({message: '网络连接失败'}):reject(err)
    
    delay = (overTime) => {
        return new Promise((resolve, reject) => setTimeout(() => reject(new Error('网络请求超时')), overTime))
    }
    
    _fetch = (fetch, overTime) => Promise.race([fetch, delay(overTime)])
    
    get = (url, params, scheme = null, overTime = defaultOverTime) =>
        _fetch(
            new Promise((resolve, reject) =>fetch(buildUrl(setUrl(url, params)), setRequest('GET'))
                .then(async (response) => handleResult(scheme, response, resolve, reject))
                    .catch((err) => handleError(err, reject))
            ),
            overTime
        )
    
    post = (url, body, params, scheme = null, overTime = defaultOverTime) =>
        _fetch(
            new Promise((resolve, reject) => fetch(buildUrl(setUrl(url, params)), setRequest('POST', body))
                .then(async (response) => handleResult(scheme, response, resolve, reject))
                    .catch((err) => handleError(err, reject))
            ),
            overTime
        )
    
    put = (url, body, params, scheme = null, overTime = defaultOverTime) =>
        _fetch(
            new Promise((resolve, reject) => fetch(buildUrl(setUrl(url, params)), setRequest('PUT', body))
                .then(async (response) => handleResult(scheme, response, resolve, reject))
                    .catch((err) => handleError(err, reject))
            ),
            overTime
        )
    
    del = (url, params, scheme = null, overTime = defaultOverTime) =>
        _fetch(
            new Promise((resolve, reject) => fetch(buildUrl(setUrl(url, params)), setRequest('DELETE'))
                .then(async (response) => handleResult(scheme, response, resolve, reject))
                    .catch((err) => handleError(err, reject))
            ),
            overTime
        )
    
    postOther = (url, body, overTime = defaultOverTime) =>
        _fetch(
            new Promise((resolve, reject) => fetch(url, setRequest('POST', body))
                .then((response) => response.json())
                    .then((result) => resolve(result))
                        .catch((error) => reject(error))
            ),
            overTime
        )

}

export default Request
