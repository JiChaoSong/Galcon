import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { message } from 'ant-design-vue'

const request: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:23040/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 可在此处添加 token
    // const token = localStorage.getItem('token')
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }
    return config
  },
  (error) => Promise.reject(error),
)

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => {
    const { data } = response
    // 根据后端约定调整
    // if (data.code !== 0) {
    //   message.error(data.message || '请求失败')
    //   return Promise.reject(new Error(data.message))
    // }
    return data
  },
  (error) => {
    if (error.response) {
      const { status } = error.response
      switch (status) {
        case 401:
          message.error('登录已过期，请重新登录')
          // 跳转登录
          break
        case 403:
          message.error('没有权限')
          break
        case 404:
          message.error('请求资源不存在')
          break
        case 500:
          message.error('服务器错误')
          break
        default:
          message.error(`请求失败 (${status})`)
      }
    } else if (error.message?.includes('timeout')) {
      message.error('请求超时，请稍后重试')
    } else {
      message.error('网络异常，请检查网络连接')
    }
    return Promise.reject(error)
  },
)

export default request
