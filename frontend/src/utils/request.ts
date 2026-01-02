import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'
import { useStudentAuthStore } from '../stores/auth_student'
import router from '../router'

const service = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 60000
})

// Request interceptor
service.interceptors.request.use(
    (config) => {
        try {
            // 检查当前路径是否与学生相关
            const currentPath = window.location.pathname
            
            // 如果是学生相关路径，使用学生认证令牌
            if (currentPath.startsWith('/student/') || currentPath.startsWith('/auth/student/')) {
                const studentAuthStore = useStudentAuthStore()
                if (studentAuthStore.token) {
                    config.headers.Authorization = `Bearer ${studentAuthStore.token}`
                    return config
                }
            } 
            // 否则使用教师/管理员认证令牌
            else {
                const authStore = useAuthStore()
                if (authStore.token) {
                    config.headers.Authorization = `Bearer ${authStore.token}`
                }
            }
        } catch (error) {
            console.error('Error getting auth token:', error)
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
        const { response } = error
        
        if (response) {
            switch (response.status) {
                case 401:
                    // Token expired or invalid
                    try {
                        // 检查当前路径是否与学生相关
                        const currentPath = window.location.pathname
                        
                        if (currentPath.startsWith('/student/') || currentPath.startsWith('/auth/student/')) {
                            // 处理学生登录过期
                            const studentAuthStore = useStudentAuthStore()
                            if (studentAuthStore.token) {
                                studentAuthStore.logout()
                                ElMessage.error('登录已过期，请重新登录')
                                router.push('/auth/student/login')
                            }
                        } else {
                            // 处理教师/管理员登录过期
                            const authStore = useAuthStore()
                            if (authStore.token) {
                                authStore.logout()
                                ElMessage.error('登录已过期，请重新登录')
                                router.push('/')
                            }
                        }
                    } catch (err) {
                        console.error('Error during logout:', err)
                        // 如果出错，默认跳转到首页
                        router.push('/')
                    }
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