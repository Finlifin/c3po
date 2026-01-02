import request from '../utils/request'

const API_BASE_URL =  'http://10.70.141.134:8080/api/v1'

export const notificationApi = {
    getNotifications(params: any) {
        return request({
            url: `${API_BASE_URL}/notifications`,
            method: 'get',
            params
        })
    },

    markAsRead(notificationId: string) {
        return request({
            url: `${API_BASE_URL}/notifications/${notificationId}/read`,
            method: 'put'
        })
    },

    markAllAsRead() {
        return request({
            url: `${API_BASE_URL}/notifications/read-all`,
            method: 'put'
        })
    }
}
