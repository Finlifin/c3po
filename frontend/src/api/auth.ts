import request from '../utils/request'

const API_BASE_URL =  'http://10.70.141.134:8080/api/v1'

export const authApi = {
    login(data: any) {
        return request({
            url: `${API_BASE_URL}/auth/login`,
            method: 'post',
            data
        })
    },

    register(data: any) {
        return request({
            url: `${API_BASE_URL}/auth/register`,
            method: 'post',
            data
        })
    },

    getUserInfo() {
        return request({
            url: `${API_BASE_URL}/auth/me`,
            method: 'get'
        })
    }
}
