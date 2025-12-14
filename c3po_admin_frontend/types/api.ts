// API 响应结构
export interface ApiResponse<T> {
  traceId: string;
  success: boolean;
  data: T;
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    sort?: string;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// 认证相关类型
export interface LoginCredentials {
  identifier: string; // 用户名或邮箱
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string; // 固定为 "Bearer"
  expiresIn: number; // 毫秒数
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
  status: "ACTIVE" | "LOCKED" | "DISABLED";
  statusReason?: string;
  createdAt: string;
  updatedAt: string;
  studentProfile?: StudentProfile;
  teacherProfile?: TeacherProfile;
}

export interface StudentProfile {
  studentNo: string;
  grade: string;
  major: string;
  className: string;
}

export interface TeacherProfile {
  teacherNo: string;
  department: string;
  title: string;
  subjects: string[];
}

export interface ProfileResponse {
  id: string;
  username: string;
  email: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
}

// 仪表板相关类型
export interface DashboardOverview {
  totalMembers: number;
  activeMembers: number;
  totalActivities: number;
  pendingApplications: number;
}

export interface UsageTrend {
  dates: string[];
  activeUsers: number[];
  courseVisits: number[];
  assignmentSubmissions: number[];
}

export interface PendingTasks {
  pendingApplications: number;
  activityCount: number;
  activeMembers: number;
  totalMembers: number;
}

// 作业相关类型
export type AssignmentType = "ASSIGNMENT" | "QUIZ" | "PROJECT";

export interface RubricItem {
  criterion: string;
  weight: number;
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  type: AssignmentType;
  deadline: string;
  allowResubmit: boolean;
  maxResubmit: number;
  gradingRubric: RubricItem[];
  visibilityTags: string[];
  releaseAt: string | null;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // 指标（可能由后端计算或前端计算）
  submissionRate?: number; // 提交率 (0-100)
  overdueRate?: number; // 逾期率 (0-100)
}

export type SubmissionStatus =
  | "SUBMITTED"
  | "RESUBMITTED"
  | "GRADED"
  | "APPEALED"
  | "IN_PROGRESS";

export interface RubricScore {
  criterion: string;
  score: number;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  status: SubmissionStatus;
  score: number | null;
  feedback: string | null;
  attachments: string[];
  rubricScores: RubricScore[];
  resubmitCount: number;
  gradingTeacherId: string | null;
  appealReason: string | null;
  appealedAt: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuizAttempt {
  id: string;
  assignmentId: string;
  studentId: string;
  startedAt: string;
  submittedAt: string | null;
  durationSeconds: number | null;
  score: number | null;
  feedback: string | null;
  answers: Array<{
    questionId: string;
    answer: string;
    score?: number;
  }>;
  status: "IN_PROGRESS" | "SUBMITTED" | "GRADED";
  createdAt: string;
  updatedAt: string;
}

// 课程相关类型
export type CourseStatus = "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "ARCHIVED";

export interface Course {
  id: string;
  name: string;
  semester?: string;
  credit?: number;
  status: CourseStatus;
  enrollLimit?: number;
  teacherId: string;
  createdAt: string;
  updatedAt: string;
  metrics?: CourseMetrics;
}

export interface CourseMetrics {
  enrolledCount: number;
  assignments: number;
  modules: number;
}

export interface CourseStudent {
  studentId: string;
  username: string;
  email: string;
  status: "ENROLLED" | "DROPPED" | "PENDING";
  enrolledAt: string;
}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  displayOrder: number;
  releaseAt: string;
  resources: CourseResource[];
}

export interface CourseResource {
  id: string;
  type: string;
  name: string;
  fileSize?: number;
  downloadUrl?: string;
}

export interface CreateCourseRequest {
  name: string;
  semester?: string;
  credit?: number;
  enrollLimit?: number;
  teacherId?: string;
}

export interface UpdateCourseRequest {
  name?: string;
  semester?: string;
  credit?: number;
  enrollLimit?: number;
}

export interface CourseListFilters {
  keyword?: string;
  teacherId?: string;
  status?: CourseStatus;
  page?: number;
  pageSize?: number;
  sort?: string;
}

// 成绩相关类型
export interface Score {
  id: string;
  studentId: string;
  courseId: string;
  component: string;
  value: number | null;
  releasedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CourseLearningProgress {
  totalAssignments: number;
  completedAssignments: number;
  gradedAssignments: number;
  overdueAssignments: number;
}

export interface CourseProgressOverview {
  totalCourses: number;
  totalAssignments: number;
  completedAssignments: number;
  gradedAssignments: number;
  overdueAssignments: number;
}

export interface CourseScoreSummary {
  courseId: string;
  courseName: string | null;
  average: number | null;
  highest: number | null;
  lowest: number | null;
  scoreCount: number;
  componentAverages: Record<string, number>;
  progress: CourseLearningProgress;
}

export interface StudentScoreSummary {
  overallAverage: number | null;
  median: number | null;
  gpa: number | null;
  progress: CourseProgressOverview;
  courses: CourseScoreSummary[];
  insights: string[];
}

export interface ScoreTrendPoint {
  courseName: string | null;
  component: string;
  value: number;
  timestamp: string;
}

export interface ScoreExportInfo {
  available: boolean;
  suggestedJobType: string;
  suggestedParams: Record<string, unknown>;
  instructions: string;
}

export interface StudentScoresResponse {
  studentId: string;
  items: Score[];
  summary: StudentScoreSummary;
  trend: ScoreTrendPoint[];
  exportInfo: ScoreExportInfo;
}

export interface CourseScoreOverview {
  average: number | null;
  median: number | null;
  highest: number | null;
  lowest: number | null;
  scoreCount: number;
  studentCount: number;
  completionRate: number | null;
}

export interface ScoreDistributionBucket {
  label: string;
  from: number;
  to: number;
  count: number;
}

export interface CourseScoresResponse {
  courseId: string;
  items: Score[];
  overview: CourseScoreOverview;
  distribution: ScoreDistributionBucket[];
  componentAverages: Record<string, number>;
  topPerformers: string[]; // student IDs
  needsAttention: string[]; // student IDs
}

export interface CourseAnalyticsResponse {
  completionRate: number;
  averageScore: number | null;
  medianScore: number | null;
  enrolledStudents: number;
  totalAssignments: number;
  gradedSubmissions: number;
  pendingSubmissions: number;
  overdueStudents: string[]; // student IDs
  difficultAssignments: string[];
  atRiskStudents: string[]; // student IDs
  insights: string[];
}

