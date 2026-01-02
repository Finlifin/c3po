import request from '../utils/request'

const API_BASE_URL =  'http://10.70.141.134:8080/api/v1'

export const profileApi = {
    getProfile() {
        return request({
            url: `${API_BASE_URL}/profile`,
            method: 'get'
        })
    },

    getProfileStats() {
        return request({
            url: `${API_BASE_URL}/profile/stats`,
            method: 'get'
        })
    },

    updateProfile(data: any) {
        return request({
            url: `${API_BASE_URL}/profile`,
            method: 'patch',
            data
        })
    },

    updateAvatar(avatarUrl: string) {
        return request({
            url: `${API_BASE_URL}/profile/avatar`,
            method: 'patch',
            data: { avatarUrl }
        })
    }
}
