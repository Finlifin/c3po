import request from '../utils/request'
import axios from 'axios'

const API_BASE_URL =  'http://10.70.141.134:8080/api/v1'

export const teacherApi = {
    getCourses(teacherId?: string) {
        return request({
            url: `${API_BASE_URL}/courses`,
            method: 'get',
            params: teacherId ? { teacherId } : {}
        })
    },

    createCourse(data: any) {
        return request({
            url: `${API_BASE_URL}/courses`,
            method: 'post',
            data
        })
    },

    updateCourse(courseId: string, data: any) {
        return request({
            url: `${API_BASE_URL}/courses/${courseId}`,
            method: 'put',
            data
        })
    },

    deleteCourse(courseId: string) {
        return request({
            url: `${API_BASE_URL}/courses/${courseId}`,
            method: 'delete'
        })
    },

    getCourse(courseId: string) {
        return request({
            url: `${API_BASE_URL}/courses/${courseId}`,
            method: 'get'
        })
    },

    // Assignment related
    getAssignments(courseId: string) {
        return request({
            url: `${API_BASE_URL}/courses/${courseId}/assignments`,
            method: 'get'
        })
    },

    createAssignment(courseId: string, data: any) {
        return request({
            url: `${API_BASE_URL}/courses/${courseId}/assignments`,
            method: 'post',
            data
        })
    },

    publishAssignment(assignmentId: string) {
        return request({
            url: `${API_BASE_URL}/assignments/${assignmentId}/publish`,
            method: 'post'
        })
    },

    getAssignment(assignmentId: string) {
        return request({
            url: `${API_BASE_URL}/assignments/${assignmentId}`,
            method: 'get'
        })
    },

    updateAssignment(assignmentId: string, data: any) {
        return request({
            url: `${API_BASE_URL}/assignments/${assignmentId}`,
            method: 'patch',
            data
        })
    },

    getAssignmentSubmissions(assignmentId: string) {
        return request({
            url: `${API_BASE_URL}/assignments/${assignmentId}/submissions`,
            method: 'get'
        })
    },

    // Grade related
    getGrades(courseId: string) {
        return request({
            url: `${API_BASE_URL}/courses/${courseId}/grades`,
            method: 'get'
        })
    },

    getCourseScores(courseId: string) {
        return request({
            url: `${API_BASE_URL}/courses/${courseId}/scores`,
            method: 'get'
        })
    },

    // Module and Resource related
    getCourseModules(courseId: string) {
        return request({
            url: `${API_BASE_URL}/courses/${courseId}/modules`,
            method: 'get'
        })
    },

     createModule(courseId: string, data: any) {
        return request({
            url: `${API_BASE_URL}/courses/${courseId}/modules`,
            method: 'post',
            data
        })
    },

    createResource(moduleId: string, data: any) {
        return request({
            url: `${API_BASE_URL}/modules/${moduleId}/resources`,
            method: 'post',
            data
        })
    },

    uploadFile(formData: FormData) {
        // Direct axios call for different service URL
        // Assuming the token is needed, we might need to get it from store or let the interceptor handle it if we used the service instance
        // But since it's a different domain/port, we might need to be careful.
        // The original code used axios directly.
        return axios.post('http://10.70.141.134:5000/api/v1/images/upload', formData)
    },

    getCourseStudents(courseId: string) {
        return request({
            url: `${API_BASE_URL}/courses/${courseId}/students`,
            method: 'get'
        })
    },

    publishCourseScores(courseId: string, data: any) {
        return request({
            url: `${API_BASE_URL}/courses/${courseId}/scores/publish`,
            method: 'post',
            data
        })
    },

    getSubmission(submissionId: string) {
        return request({
            url: `${API_BASE_URL}/submissions/${submissionId}`,
            method: 'get'
        })
    },

    gradeSubmission(submissionId: string, data: any) {
        return request({
            url: `${API_BASE_URL}/submissions/${submissionId}/grade`,
            method: 'post',
            data
        })
    },

    // Batch grade submissions
    batchGradeSubmissions(assignmentId: string, data: any) {
        return request({
            url: `${API_BASE_URL}/assignments/${assignmentId}/submissions/batch-grade`,
            method: 'post',
            data
        })
    },
}

