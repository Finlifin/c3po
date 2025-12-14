export enum UserRole {
    STUDENT = 'ROLE_STUDENT',
    TEACHER = 'ROLE_TEACHER',
    ADMIN = 'ROLE_ADMIN'
}

export enum UserStatus {
    ACTIVE = 'ACTIVE',
    DISABLED = 'DISABLED',
    LOCKED = 'LOCKED'
}

export interface StudentProfileInfo {
    studentNo: string
    grade?: string
    major?: string
    className?: string
}

export interface TeacherProfileInfo {
    teacherNo: string
    department?: string
    title?: string
    subjects?: string
}

export interface Profile {
    id: string
    username: string
    email: string
    role: UserRole
    status: UserStatus
    avatarUrl?: string
    createdAt: string
    updatedAt: string
    studentProfile?: StudentProfileInfo
    teacherProfile?: TeacherProfileInfo
}

export interface ProfileStats {
    // Student stats
    enrolledCoursesCount?: number
    completedAssignmentsCount?: number
    pendingAssignmentsCount?: number
    averageScore?: number
    gpa?: number

    // Teacher stats
    teachingCoursesCount?: number
    pendingGradingCount?: number
    totalStudentsCount?: number
}

export interface UpdateProfileRequest {
    username?: string
    email?: string
    // Student profile fields
    grade?: string
    major?: string
    className?: string
    // Teacher profile fields
    department?: string
    title?: string
    subjects?: string
    avatarUrl?: string
}

export interface UpdateAvatarRequest {
    avatarUrl: string
}
