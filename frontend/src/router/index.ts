import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import StudentLogin from '../views/student/StudentLogin.vue'
import TeacherLogin from '../views/TeacherLogin.vue'
import StudentDashboard from '../views/student/StudentDashboard.vue'
import TeacherDashboard from '../views/TeacherDashboard.vue'
import CourseSelection from '../views/student/CourseSelection.vue'
import CourseResources from '../views/CourseResources.vue'
import CourseManagement from '../views/CourseManagement.vue'
import PublishAssignment from '../views/PublishAssignment.vue'
import AssignmentManagement from '../views/AssignmentManagement.vue'
import EditAssignment from '../views/EditAssignment.vue'
import MyCourses from '../views/student/MyCourses.vue'
import StudentCourseResources from '../views/student/StudentCourseResources.vue'
import SubmitAssignment from '../views/student/SubmitAssignment.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: Home },
    { path: '/student', name: 'student-login', component: StudentLogin },
    { path: '/teacher', name: 'teacher-login', component: TeacherLogin },
    { path: '/student/dashboard', name: 'student-dashboard', component: StudentDashboard },
    { path: '/student/courses', name: 'my-courses', component: MyCourses },
    { path: '/student/course-selection', name: 'course-selection', component: CourseSelection },
    { path: '/student/courses/:courseId', name: 'course-resources', component: StudentCourseResources },
    { path: '/student/courses/:courseId/assignments', name: 'course-assignments', component: () => import('../views/student/StudentCourseAssignments.vue') },
    { path: '/student/assignments/:assignmentId/submit', name: 'submit-assignment', component: () => import('../views/student/SubmitAssignment.vue') },
    { path: '/student/assignments/:assignmentId/view', name: 'view-assignment', component: () => import('../views/student/ViewAssignment.vue') },
    { path: '/teacher/dashboard', name: 'teacher-dashboard', component: TeacherDashboard },
    { path: '/teacher/course-management', name: 'teacher-course-management', component: CourseManagement },
    { path: '/teacher/courses/:courseId', name: 'teacher-course-resources', component: CourseResources },
    { path: '/teacher/courses/:courseId/assignments/new', name: 'publish-assignment', component: PublishAssignment },
    { path: '/teacher/courses/:courseId/assignments', name: 'assignment-management', component: AssignmentManagement },
    { path: '/teacher/courses/:courseId/assignments/:assignmentId/edit', name: 'edit-assignment', component: EditAssignment },
    { path: '/teacher/submissions/:submissionId/grade', name: 'grade-submission', component: () => import('../views/teacher/GradeSubmission.vue') },
    { path: '/teacher/assignments/:assignmentId/submissions', name: 'assignment-submissions', component: () => import('../views/teacher/AssignmentSubmissions.vue') }
  ]
})

export default router