import request from '../utils/request'

export const studentApi = {
    getTodos() {
        return request({
            url: '/todos',
            method: 'get'
        })
    },

    getMyCourses(studentId: string) {
        return request({
            url: `/students/${studentId}/courses`,
            method: 'get'
        })
    },

    getCourseResources(courseId: string) {
        return request({
            url: `/student/courses/${courseId}/resources`,
            method: 'get'
        })
    },

    getAvailableCourses(params: any) {
        return request({
            url: '/courses',
            method: 'get',
            params
        })
    },

    enrollCourse(courseId: string) {
        return request({
            url: `/courses/${courseId}/enroll`,
            method: 'post'
        })
    },

    dropCourse(courseId: string) {
        return request({
            url: `/courses/${courseId}/enroll`,
            method: 'delete'
        })
    },

    getScores(studentId: string) {
        return request({
            url: `/students/${studentId}/scores`,
            method: 'get'
        })
    },
}