import request from '../utils/request'

const API_BASE_URL =  'http://10.70.141.134:8080/api/v1'

export const studentApi = {
    getTodos() {
        return request({
            url: `${API_BASE_URL}/todos`,
            method: 'get'
        })
    },

    getMyCourses(studentId: string) {
        return request({
            url: `${API_BASE_URL}/students/${studentId}/courses`,
            method: 'get'
        })
    },

    getCourseResources(courseId: string) {
        return request({
            url: `${API_BASE_URL}/student/courses/${courseId}/resources`,
            method: 'get'
        })
    },

    getAvailableCourses(params: any) {
        return request({
            url: `${API_BASE_URL}/courses/plaza`,
            method: 'get',
            params
        })
    },

    enrollCourse(courseId: string) {
        return request({
            url: `${API_BASE_URL}/courses/${courseId}/enroll`,
            method: 'post'
        })
    },

    dropCourse(courseId: string) {
        return request({
            url: `${API_BASE_URL}/courses/${courseId}/enroll`,
            method: 'delete'
        })
    },

    getScores(studentId: string) {
        return request({
            url: `${API_BASE_URL}/students/${studentId}/scores`,
            method: 'get'
        })
    },
}