import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'
import router from '../router'

const service = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 10000
})

// Request interceptor
service.interceptors.request.use(
    (config) => {
        const authStore = useAuthStore()
        if (authStore.token) {
            config.headers.Authorization = `Bearer ${authStore.token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor
service.interceptors.response.use(
    (response) => {
        return response
    },
    (error) => {
        const authStore = useAuthStore()
        const { response } = error

        if (response) {
            switch (response.status) {
                case 401:
                    // Token expired or invalid
                    authStore.logout()
                    ElMessage.error('登录已过期，请重新登录')
                    router.push('/')
                    break
                case 403:
                    ElMessage.error('没有权限访问该资源')
                    break
                case 500:
                    ElMessage.error('服务器错误，请稍后重试')
                    break
                default:
                    ElMessage.error(response.data?.message || '发生错误')
            }
        } else {
            ElMessage.error('网络连接失败')
        }
        return Promise.reject(error)
    }
)

export default service
