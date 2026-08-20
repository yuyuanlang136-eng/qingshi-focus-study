import axios from 'axios'
import { installMockApi } from './mock'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 5000,
})

if (import.meta.env.VITE_USE_MOCK !== 'false') installMockApi(request)

request.interceptors.response.use(
  (response) => {
    const body = response.data
    if (body?.code !== 200) return Promise.reject(new Error(body?.msg || '接口请求失败'))
    return body.data
  },
  (error) => Promise.reject(error),
)

export default request
