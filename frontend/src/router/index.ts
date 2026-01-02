import { createRouter, createWebHistory } from 'vue-router'
import AuthLayout from '../layouts/AuthLayout.vue'
import MainLayout from '../layouts/MainLayout.vue'

// Views
import Home from '../views/Home.vue'
import StudentLogin from '../views/student/StudentLogin.vue'
import TeacherLogin from '../views/teacher/TeacherLogin.vue'
import StudentDashboard from '../views/student/StudentDashboard.vue'
import TeacherDashboard from '../views/teacher/TeacherDashboard.vue'
import CourseSelection from '../views/student/CourseSelection.vue'
import CourseResources from '../views/teacher/CourseResources.vue'
import CourseManagement from '../views/teacher/CourseManagement.vue'
import PublishAssignment from '../views/teacher/PublishAssignment.vue'
import AssignmentManagement from '../views/teacher/AssignmentManagement.vue'
import EditAssignment from '../views/teacher/EditAssignment.vue'
import MyCourses from '../views/student/MyCourses.vue'
import StudentCourseResources from '../views/student/StudentCourseResources.vue'
import GradeManagement from '../views/teacher/GradeManagement.vue'
import ViewScores from '../views/student/ViewScores.vue'
import NotificationCenter from '../views/teacher/NotificationCenter.vue'
import StudentNotifications from '../views/student/StudentNotifications.vue'
import StudentAiChat from '../views/student/StudentAiChat.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: Home },

    // Auth Routes
    {
      path: '/auth',
      component: AuthLayout,
      children: [
        { path: 'student/login', name: 'student-login', component: StudentLogin },
        { path: 'teacher/login', name: 'teacher-login', component: TeacherLogin },
      ]
    },

    // Student Routes
    {
      path: '/student',
      component: MainLayout,
      meta: { requiresAuth: true, role: 'ROLE_STUDENT' },
      children: [
        { path: '', redirect: '/student/dashboard' },
        { path: 'dashboard', name: 'student-dashboard', component: StudentDashboard },
        { path: 'courses', name: 'my-courses', component: MyCourses },
        { path: 'course-selection', name: 'course-selection', component: CourseSelection },
        { path: 'courses/:courseId', name: 'course-resources', component: StudentCourseResources },
        { path: 'courses/:courseId/assignments', name: 'course-assignments', component: () => import('../views/student/StudentCourseAssignments.vue') },
        { path: 'assignments/:assignmentId/submit', name: 'submit-assignment', component: () => import('../views/student/SubmitAssignment.vue') },
        { path: 'assignments/:assignmentId/view', name: 'view-assignment', component: () => import('../views/student/ViewAssignment.vue') },
        { path: 'scores', name: 'student-scores', component: ViewScores },
        { path: 'notifications', name: 'student-notifications', component: StudentNotifications },
        { path: 'profile', name: 'student-profile', component: () => import('../views/Profile.vue') },
        { path: 'ai-chat', name: 'student-ai-chat', component: StudentAiChat }
      ]
    },

    // Teacher Routes
    {
      path: '/teacher',
      component: MainLayout,
      meta: { requiresAuth: true, role: 'ROLE_TEACHER' },
      children: [
        { path: '', redirect: '/teacher/dashboard' },
        { path: 'dashboard', name: 'teacher-dashboard', component: TeacherDashboard },
        { path: 'course-management', name: 'teacher-course-management', component: CourseManagement },
        { path: 'grade-management', name: 'grade-management', component: GradeManagement },
        { path: 'courses/:courseId', name: 'teacher-course-resources', component: CourseResources },
        { path: 'courses/:courseId/assignments/new', name: 'publish-assignment', component: PublishAssignment },
        { path: 'courses/:courseId/assignments', name: 'assignment-management', component: AssignmentManagement },
        { path: 'courses/:courseId/assignments/:assignmentId/edit', name: 'edit-assignment', component: EditAssignment },
        { path: 'submissions/:submissionId/grade', name: 'grade-submission', component: () => import('../views/teacher/GradeSubmission.vue') },
        { path: 'assignments/:assignmentId/submissions', name: 'assignment-submissions', component: () => import('../views/teacher/AssignmentSubmissions.vue') },
        { path: 'assignments/:assignmentId/batch-grade', name: 'batch-grade-submissions', component: () => import('../views/teacher/BatchGradeSubmissions.vue') },
        { path: 'courses/:courseId/grades', name: 'view-grades', component: () => import('../views/teacher/ViewGrades.vue') },
        { path: 'courses/:courseId/grades/publish', name: 'publish-grades', component: () => import('../views/teacher/PublishGrades.vue') },
        { path: 'notifications', name: 'notifications', component: NotificationCenter },
        { path: 'profile', name: 'teacher-profile', component: () => import('../views/Profile.vue') }
      ]
    },

    // Legacy redirects (to keep old links working if any)
    { path: '/student', redirect: '/auth/student/login' }, // This conflicts with the group above if not careful, but since the group has children, exact match on /student might need handling. 
    // Actually, the group above matches /student prefix. 
    // Let's fix the login paths. The original was /student -> login.
    // We should probably keep /student as login if not authenticated, or redirect.
    // For now, let's map the old login paths to the new structure or keep them as aliases.
  ]
})

export default router