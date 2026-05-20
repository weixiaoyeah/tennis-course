export const translations = {
  // 导航标签
  nav: {
    home: { zh: '首页', en: 'Home' },
    teachers: { zh: '老师', en: 'Teachers' },
    courses: { zh: '课程', en: 'Courses' },
    records: { zh: '记录', en: 'Records' },
  },

  // 通用按钮
  buttons: {
    add: { zh: '新增', en: 'Add' },
    edit: { zh: '编辑', en: 'Edit' },
    delete: { zh: '删除', en: 'Delete' },
    save: { zh: '保存', en: 'Save' },
    cancel: { zh: '取消', en: 'Cancel' },
    confirm: { zh: '确认', en: 'Confirm' },
    close: { zh: '关闭', en: 'Close' },
    switchLang: { zh: '切换语言', en: 'Switch Language' },
  },

  // 首页统计
  dashboard: {
    title: { zh: '课时统计', en: 'Lesson Statistics' },
    totalCourses: { zh: '总课程', en: 'Total Courses' },
    totalLessons: { zh: '总课时', en: 'Total Lessons' },
    usedLessons: { zh: '已上课时', en: 'Used Lessons' },
    remainingLessons: { zh: '剩余课时', en: 'Remaining' },
    coursePackage: { zh: '课程包', en: 'Package' },
    noData: { zh: '暂无数据', en: 'No Data' },
    coursePackages: { zh: '课程包详情', en: 'Course Packages' },
  },

  // 老师管理
  teachers: {
    title: { zh: '老师管理', en: 'Teacher Management' },
    name: { zh: '姓名', en: 'Name' },
    phone: { zh: '电话', en: 'Phone' },
    remark: { zh: '备注', en: 'Remark' },
    addTeacher: { zh: '新增老师', en: 'Add Teacher' },
    editTeacher: { zh: '编辑老师', en: 'Edit Teacher' },
    deleteConfirm: { zh: '确定删除该老师吗？', en: 'Are you sure to delete this teacher?' },
    noTeachers: { zh: '暂无老师', en: 'No Teachers' },
    placeholder: {
      name: { zh: '请输入老师姓名', en: 'Enter teacher name' },
      phone: { zh: '请输入联系电话', en: 'Enter phone number' },
      remark: { zh: '请输入备注信息', en: 'Enter remark' },
    },
  },

  // 课程管理
  courses: {
    title: { zh: '课程管理', en: 'Course Management' },
    name: { zh: '课程名称', en: 'Course Name' },
    totalLessons: { zh: '总课时', en: 'Total Lessons' },
    teacher: { zh: '授课老师', en: 'Teacher' },
    startDate: { zh: '开始日期', en: 'Start Date' },
    addCourse: { zh: '新增课程', en: 'Add Course' },
    editCourse: { zh: '编辑课程', en: 'Edit Course' },
    deleteConfirm: { zh: '确定删除该课程吗？', en: 'Are you sure to delete this course?' },
    noCourses: { zh: '暂无课程', en: 'No Courses' },
    selectTeacher: { zh: '选择老师', en: 'Select Teacher' },
    noTeacher: { zh: '无', en: 'None' },
    placeholder: {
      name: { zh: '请输入课程名称', en: 'Enter course name' },
      totalLessons: { zh: '请输入总课时数', en: 'Enter total lessons' },
    },
  },

  // 上课记录
  records: {
    title: { zh: '上课记录', en: 'Lesson Records' },
    course: { zh: '课程', en: 'Course' },
    teacher: { zh: '老师', en: 'Teacher' },
    date: { zh: '上课日期', en: 'Lesson Date' },
    duration: { zh: '课时数', en: 'Duration' },
    remark: { zh: '备注', en: 'Remark' },
    addRecord: { zh: '新增记录', en: 'Add Record' },
    editRecord: { zh: '编辑记录', en: 'Edit Record' },
    deleteConfirm: { zh: '确定删除该记录吗？', en: 'Are you sure to delete this record?' },
    noRecords: { zh: '暂无记录', en: 'No Records' },
    selectCourse: { zh: '选择课程', en: 'Select Course' },
    selectTeacher: { zh: '选择老师', en: 'Select Teacher' },
    placeholder: {
      duration: { zh: '课时数', en: 'Duration' },
      remark: { zh: '请输入备注', en: 'Enter remark' },
    },
    lessons: { zh: '课时', en: 'lessons' },
  },

  // 表单验证
  validation: {
    required: { zh: '此项为必填项', en: 'This field is required' },
    invalidPhone: { zh: '请输入有效的电话号码', en: 'Please enter a valid phone number' },
  },

  // 成功/错误提示
  messages: {
    addSuccess: { zh: '添加成功', en: 'Added Successfully' },
    updateSuccess: { zh: '更新成功', en: 'Updated Successfully' },
    deleteSuccess: { zh: '删除成功', en: 'Deleted Successfully' },
    error: { zh: '操作失败，请重试', en: 'Operation failed, please try again' },
    networkError: { zh: '网络错误', en: 'Network Error' },
  },
} as const;

export type Language = 'zh' | 'en';
export type TranslationKeys = typeof translations;
