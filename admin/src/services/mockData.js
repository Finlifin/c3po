// Mock数据服务 - 用于开发测试

// 模拟仪表盘统计数据
export const mockDashboardStats = {
  totalMembers: 1253,
  newMembers: 48,
  totalCourses: 87,
  activeCourses: 62,
  totalActivities: 234,
  upcomingActivities: 12,
  completionRate: 78.5,
  satisfactionScore: 4.6
};

// 模拟最近活动数据
export const mockRecentActivities = [
  {
    id: 1,
    title: '春季编程训练营开营',
    type: 'activity',
    date: '2024-05-15',
    status: 'completed',
    participants: 128
  },
  {
    id: 2,
    title: 'Python进阶课程上线',
    type: 'course',
    date: '2024-05-12',
    status: 'active',
    participants: 95
  },
  {
    id: 3,
    title: '学生张三完成React实战项目',
    type: 'achievement',
    date: '2024-05-10',
    status: 'completed',
    participants: 1
  },
  {
    id: 4,
    title: '夏季黑客松活动预告',
    type: 'announcement',
    date: '2024-05-08',
    status: 'upcoming',
    participants: 0
  },
  {
    id: 5,
    title: 'JavaScript高级概念讲座',
    type: 'activity',
    date: '2024-05-05',
    status: 'completed',
    participants: 87
  }
];

// 模拟待处理任务数据
export const mockPendingTasks = [
  {
    id: 1,
    title: '审核新成员加入申请',
    type: 'member',
    priority: 'high',
    deadline: '2024-05-20',
    assignee: '李管理员'
  },
  {
    id: 2,
    title: '更新课程资料',
    type: 'course',
    priority: 'medium',
    deadline: '2024-05-25',
    assignee: '张教师'
  },
  {
    id: 3,
    title: '准备月底活动策划',
    type: 'activity',
    priority: 'high',
    deadline: '2024-05-30',
    assignee: '王策划'
  },
  {
    id: 4,
    title: '整理学员反馈',
    type: 'report',
    priority: 'low',
    deadline: '2024-06-05',
    assignee: '赵助理'
  }
];

// 模拟用户列表数据
export const mockUsers = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    role: 'admin',
    status: 'active',
    createdAt: '2023-01-15',
    lastLogin: '2024-05-15'
  },
  {
    id: 2,
    username: 'teacher1',
    email: 'teacher1@example.com',
    role: 'teacher',
    status: 'active',
    createdAt: '2023-02-20',
    lastLogin: '2024-05-14'
  },
  {
    id: 3,
    username: 'teacher2',
    email: 'teacher2@example.com',
    role: 'teacher',
    status: 'active',
    createdAt: '2023-03-10',
    lastLogin: '2024-05-13'
  },
  {
    id: 4,
    username: 'editor1',
    email: 'editor1@example.com',
    role: 'editor',
    status: 'active',
    createdAt: '2023-04-05',
    lastLogin: '2024-05-12'
  },
  {
    id: 5,
    username: 'assistant1',
    email: 'assistant1@example.com',
    role: 'assistant',
    status: 'inactive',
    createdAt: '2023-05-20',
    lastLogin: '2024-04-20'
  }
];

// 模拟课程列表数据
export const mockCourses = [
  {
    id: 1,
    title: 'Web前端开发基础',
    category: '编程',
    status: 'active',
    enrolledStudents: 234,
    completionRate: 85.2,
    instructor: '张老师',
    startDate: '2024-03-01',
    endDate: '2024-06-30'
  },
  {
    id: 2,
    title: 'Python数据分析实战',
    category: '数据科学',
    status: 'active',
    enrolledStudents: 189,
    completionRate: 76.5,
    instructor: '李老师',
    startDate: '2024-02-15',
    endDate: '2024-05-15'
  },
  {
    id: 3,
    title: 'Java后端开发进阶',
    category: '编程',
    status: 'scheduled',
    enrolledStudents: 145,
    completionRate: 0,
    instructor: '王老师',
    startDate: '2024-06-01',
    endDate: '2024-09-30'
  }
];

// 模拟成员列表数据
export const mockMembers = [
  {
    id: 1,
    name: '张三',
    studentId: '2022001',
    email: 'zhangsan@example.com',
    phone: '13800138001',
    status: 'active',
    joinDate: '2023-09-01',
    role: 'member'
  },
  {
    id: 2,
    name: '李四',
    studentId: '2022002',
    email: 'lisi@example.com',
    phone: '13800138002',
    status: 'active',
    joinDate: '2023-09-15',
    role: 'core-member'
  },
  {
    id: 3,
    name: '王五',
    studentId: '2022003',
    email: 'wangwu@example.com',
    phone: '13800138003',
    status: 'inactive',
    joinDate: '2023-10-01',
    role: 'member'
  }
];

// 模拟活动列表数据
export const mockActivities = [
  {
    id: 1,
    title: '春季编程训练营',
    type: 'training',
    status: 'completed',
    date: '2024-03-15',
    location: '线上',
    participants: 128,
    organizer: '技术部'
  },
  {
    id: 2,
    title: '开源项目贡献工作坊',
    type: 'workshop',
    status: 'upcoming',
    date: '2024-05-25',
    location: '线下会议室A',
    participants: 45,
    organizer: '技术部'
  },
  {
    id: 3,
    title: 'AI应用开发讲座',
    type: 'lecture',
    status: 'active',
    date: '2024-04-20',
    location: '线上',
    participants: 203,
    organizer: '研究部'
  }
];

// 模拟登录响应
export const mockLoginResponse = {
  token: 'mock-jwt-token-12345',
  user: {
    id: 1,
    username: 'admin',
    role: 'admin',
    permissions: ['read', 'write', 'delete']
  }
};

// 延迟函数，模拟网络请求延迟
export const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API服务
export const mockAPI = {
  // 认证
  login: async (credentials) => {
    await delay();
    // if (credentials.username === 'admin' && credentials.password === 'admin123') {
    //   return mockLoginResponse;
    // }
    throw new Error('用户名或密码错误');
  },

  // 仪表盘
  getDashboardStats: async () => {
    await delay();
    return mockDashboardStats;
  },

  getRecentActivities: async () => {
    await delay();
    return mockRecentActivities;
  },

  getPendingTasks: async () => {
    await delay();
    return mockPendingTasks;
  },

  // 用户管理
  getUsers: async (params = {}) => {
    await delay();
    let filteredUsers = [...mockUsers];

    // 模拟搜索功能
    if (params.search) {
      filteredUsers = filteredUsers.filter(user =>
        user.username.includes(params.search) ||
        user.email.includes(params.search)
      );
    }

    return filteredUsers;
  },

  // 其他API模拟...
  getUser: async (id) => {
    await delay();
    const user = mockUsers.find(u => u.id === parseInt(id));
    if (!user) throw new Error('用户不存在');
    return user;
  }
};

export default mockAPI;