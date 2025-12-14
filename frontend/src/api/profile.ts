import request from '../utils/request'

export const profileApi = {
    getProfile() {
        return request({
            url: '/profile',
            method: 'get'
        })
    },

    getProfileStats() {
        return request({
            url: '/profile/stats',
            method: 'get'
        })
    },

    updateProfile(data: any) {
        return request({
            url: '/profile',
            method: 'patch',
            data
        })
    },

    updateAvatar(avatarUrl: string) {
        return request({
            url: '/profile/avatar',
            method: 'patch',
            data: { avatarUrl }
        })
    }
}
