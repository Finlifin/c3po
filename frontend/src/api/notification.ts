import request from '../utils/request'

export const notificationApi = {
    getNotifications(params: any) {
        return request({
            url: '/notifications',
            method: 'get',
            params
        })
    },

    markAsRead(notificationId: string) {
        return request({
            url: `/notifications/${notificationId}/read`,
            method: 'put'
        })
    },

    markAllAsRead() {
        return request({
            url: '/notifications/read-all',
            method: 'put'
        })
    }
}
