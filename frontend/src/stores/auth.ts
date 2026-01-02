import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '../api/auth'

export const useAuthStore = defineStore('auth', () => {
    const token = ref(localStorage.getItem('accessToken') || '')
    const user = ref<any>(null)
    const role = ref<string>('')

    const isAuthenticated = computed(() => !!token.value)

    function setToken(newToken: string) {
        token.value = newToken
        localStorage.setItem('accessToken', newToken)
    }

    function setUser(newUser: any) {
        user.value = newUser
        // Backend returns STUDENT, TEACHER, ADMIN - convert to ROLE_ format for consistency
        role.value = newUser?.role ? `ROLE_${newUser.role}` : ''
    }

    function logout() {
        token.value = ''
        user.value = null
        role.value = ''
        localStorage.removeItem('accessToken')
    }

    async function login(data: any) {
        const res = await authApi.login(data)
        setToken(res.data.accessToken)
        await fetchUserInfo()
        return res
    }

    async function fetchUserInfo() {
        const res = await authApi.getUserInfo()
        setUser(res.data)
        return res
    }

    return {
        token,
        user,
        role,
        isAuthenticated,
        setToken,
        setUser,
        logout,
        login,
        fetchUserInfo
    }
})
