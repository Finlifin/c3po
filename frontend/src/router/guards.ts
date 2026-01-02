import router from './index'
import { useAuthStore } from '../stores/auth'
import { useStudentAuthStore } from '../stores/auth_student'
import { ElMessage } from 'element-plus'

router.beforeEach(async (to, _from, next) => {
    // 根据路径选择使用哪个auth store
    const currentPath = to.path
    const isStudentPath = currentPath.startsWith('/student') || currentPath.startsWith('/auth/student')
    
    // 获取对应的auth store
    const authStore = isStudentPath ? useStudentAuthStore() : useAuthStore()
    
    const isAuthenticated = authStore.isAuthenticated
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
    const requiredRole = to.meta.role as string | undefined

    if (requiresAuth && !isAuthenticated) {
        // Redirect to login based on the path
        if (currentPath.startsWith('/student')) {
            next('/auth/student/login')
        } else if (currentPath.startsWith('/teacher')) {
            next('/auth/teacher/login')
        } else {
            next('/')
        }
        return
    }

    if (isAuthenticated) {
        // Ensure user info is loaded
        if (!authStore.user) {
            try {
                await authStore.fetchUserInfo()
            } catch (err) {
                console.error('Failed to fetch user info:', err)
                authStore.logout()
                // 根据路径重定向到相应的登录页
                if (isStudentPath) {
                    next('/auth/student/login')
                } else {
                    next('/')
                }
                return
            }
        }

        // If user is logged in and tries to access login pages, redirect to dashboard
        if (to.path.includes('/login')) {
            if (authStore.role === 'ROLE_STUDENT') {
                next('/student/dashboard')
            } else if (authStore.role === 'ROLE_TEACHER') {
                next('/teacher/dashboard')
            } else {
                next('/')
            }
            return
        }

        // Check role permission
        if (requiredRole && authStore.role !== requiredRole) {
            ElMessage.error('无权访问该页面')
            // Redirect to appropriate dashboard
            if (authStore.role === 'ROLE_STUDENT') {
                next('/student/dashboard')
            } else if (authStore.role === 'ROLE_TEACHER') {
                next('/teacher/dashboard')
            } else {
                next('/')
            }
            return
        }
    }

    next()
})