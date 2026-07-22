// utils/request.js
import axios from 'axios'
const request = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API,
  timeout: 10000
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 添加 token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)
// 响应拦截器
request.interceptors.response.use(res => {
  return res.data
},
error => {

  return Promise.reject(error)
}
)
export default request