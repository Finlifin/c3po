import request from '../utils/request'

export const authApi = {
    login(data: any) {
        return request({
            url: '/auth/login',
            method: 'post',
            data
        })
    },

    register(data: any) {
        return request({
            url: '/auth/register',
            method: 'post',
            data
        })
    },

    getUserInfo() {
        return request({
            url: '/auth/me',
            method: 'get'
        })
    }
}
