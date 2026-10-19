export const translations = {
  // 导航标签
  nav: {
    home: { zh: '首页', en: 'Home', ar: 'الرئيسية' },
    teachers: { zh: '老师', en: 'Teachers', ar: 'المدربون' },
    courses: { zh: '课程', en: 'Courses', ar: 'الدورات' },
    records: { zh: '记录', en: 'Records', ar: 'السجلات' },
    assistant: { zh: '助手', en: 'Assistant', ar: 'المساعد' },
    calendar: { zh: '日历', en: 'Calendar', ar: 'التقويم' },
  },

  // 通用按钮
  buttons: {
    add: { zh: '新增', en: 'Add', ar: 'إضافة' },
    edit: { zh: '编辑', en: 'Edit', ar: 'تعديل' },
    delete: { zh: '删除', en: 'Delete', ar: 'حذف' },
    save: { zh: '保存', en: 'Save', ar: 'حفظ' },
    cancel: { zh: '取消', en: 'Cancel', ar: 'إلغاء' },
    confirm: { zh: '确认', en: 'Confirm', ar: 'تأكيد' },
    close: { zh: '关闭', en: 'Close', ar: 'إغلاق' },
    switchLang: { zh: '切换语言', en: 'Switch Language', ar: 'تغيير اللغة' },
  },

  // 首页统计
  dashboard: {
    title: { zh: '课时统计', en: 'Lesson Statistics', ar: 'إحصائيات الدروس' },
    totalCourses: { zh: '总课程', en: 'Total Courses', ar: 'إجمالي الدورات' },
    totalLessons: { zh: '总课时', en: 'Total Lessons', ar: 'الإجمالي' },
    usedLessons: { zh: '已上课时', en: 'Used Lessons', ar: 'المستخدمة' },
    remainingLessons: { zh: '剩余课时', en: 'Remaining', ar: 'المتبقي' },
    coursePackage: { zh: '课程包', en: 'Package', ar: 'الباقة' },
    noData: { zh: '暂无数据', en: 'No Data', ar: 'لا توجد بيانات' },
    coursePackages: { zh: '课程包详情', en: 'Course Packages', ar: 'تفاصيل الباقة' },
  },

  // 老师管理
  teachers: {
    title: { zh: '老师管理', en: 'Teacher Management', ar: 'إدارة المدربين' },
    name: { zh: '姓名', en: 'Name', ar: 'الاسم' },
    phone: { zh: '电话', en: 'Phone', ar: 'الهاتف' },
    remark: { zh: '备注', en: 'Remark', ar: 'ملاحظة' },
    addTeacher: { zh: '新增老师', en: 'Add Teacher', ar: 'إضافة مدرب' },
    editTeacher: { zh: '编辑老师', en: 'Edit Teacher', ar: 'تعديل المدرب' },
    deleteConfirm: { zh: '确定删除该老师吗？', en: 'Are you sure to delete this teacher?', ar: 'هل تريد حذف هذا المدرب؟' },
    noTeachers: { zh: '暂无老师', en: 'No Teachers', ar: 'لا يوجد مدربون' },
    placeholder: {
      name: { zh: '请输入老师姓名', en: 'Enter teacher name', ar: 'أدخل اسم المدرب' },
      phone: { zh: '请输入联系电话', en: 'Enter phone number', ar: 'أدخل رقم الهاتف' },
      remark: { zh: '请输入备注信息', en: 'Enter remark', ar: 'أدخل ملاحظة' },
    },
  },

  // 课程管理
  courses: {
    title: { zh: '课程管理', en: 'Course Management', ar: 'إدارة الدورة' },
    name: { zh: '课程名称', en: 'Course Name', ar: 'اسم الدورة' },
    totalLessons: { zh: '总课时', en: 'Total Lessons', ar: 'إجمالي الدروس' },
    teacher: { zh: '授课老师', en: 'Teacher', ar: 'المدرب' },
    startDate: { zh: '开始日期', en: 'Start Date', ar: 'تاريخ البداية' },
    addCourse: { zh: '新增课程', en: 'Add Course', ar: 'إضافة دورة' },
    editCourse: { zh: '编辑课程', en: 'Edit Course', ar: 'تعديل الدورة' },
    deleteConfirm: { zh: '确定删除该课程吗？', en: 'Are you sure to delete this course?', ar: 'هل تريد حذف هذه الدورة؟' },
    noCourses: { zh: '暂无课程', en: 'No Courses', ar: 'لا توجد دورات' },
    selectTeacher: { zh: '选择老师', en: 'Select Teacher', ar: 'اختر المدرب' },
    noTeacher: { zh: '无', en: 'None', ar: 'بدون' },
    placeholder: {
      name: { zh: '请输入课程名称', en: 'Enter course name', ar: 'أدخل اسم الدورة' },
      totalLessons: { zh: '请输入总课时数', en: 'Enter total lessons', ar: 'أدخل عدد الدروس' },
    },
  },

  // 上课记录
  records: {
    title: { zh: '上课记录', en: 'Lesson Records', ar: 'سجلات الدروس' },
    course: { zh: '课程', en: 'Course', ar: 'الدورة' },
    teacher: { zh: '老师', en: 'Teacher', ar: 'المدرب' },
    date: { zh: '上课日期', en: 'Lesson Date', ar: 'تاريخ الدرس' },
    duration: { zh: '课时数', en: 'Duration', ar: 'عدد الدروس' },
    remark: { zh: '备注', en: 'Remark', ar: 'ملاحظة' },
    addRecord: { zh: '新增记录', en: 'Add Record', ar: 'إضافة سجل' },
    editRecord: { zh: '编辑记录', en: 'Edit Record', ar: 'تعديل السجل' },
    deleteConfirm: { zh: '确定删除该记录吗？', en: 'Are you sure to delete this record?', ar: 'هل تريد حذف هذا السجل؟' },
    noRecords: { zh: '暂无记录', en: 'No Records', ar: 'لا توجد سجلات' },
    selectCourse: { zh: '选择课程', en: 'Select Course', ar: 'اختر الدورة' },
    selectTeacher: { zh: '选择老师', en: 'Select Teacher', ar: 'اختر المدرب' },
    placeholder: {
      duration: { zh: '课时数', en: 'Duration', ar: 'عدد الدروس' },
      remark: { zh: '请输入备注', en: 'Enter remark', ar: 'أدخل ملاحظة' },
    },
    lessons: { zh: '课时', en: 'lessons', ar: 'دروس' },
  },

  // 巡场小助手
  assistant: {
    title: { zh: '巡场小助手', en: 'Court Assistant', ar: 'مساعد الملعب' },
    subtitle: { zh: 'RacketPro 小助手', en: 'RacketPro Assistant', ar: 'مساعد RacketPro' },
    searchPlaceholder: { zh: '搜索教练、课程、课时记录…', en: 'Search coaches, courses, records…', ar: 'ابحث عن المدربين والدورات والسجلات…' },
    search: { zh: '搜索', en: 'Search', ar: 'بحث' },
    noKeyword: { zh: '请输入搜索关键词', en: 'Please enter a keyword', ar: 'الرجاء إدخال كلمة' },
    noResults: { zh: '未找到相关结果', en: 'No results found', ar: 'لا توجد نتائج' },
    teachers: { zh: '教练', en: 'Coaches', ar: 'المدربون' },
    courses: { zh: '课程', en: 'Courses', ar: 'الدورات' },
    records: { zh: '课时记录', en: 'Lesson Records', ar: 'سجلات الدروس' },
    results: { zh: '搜索结果', en: 'Search Results', ar: 'نتائج البحث' },
    recommendTitle: { zh: '智能教练推荐', en: 'Smart Coach Recommendation', ar: 'توصية المدرب الذكية' },
    recommendDesc: { zh: '基于历史课时训练量自动推荐合适的教练', en: 'Auto-recommended based on lesson volume', ar: 'توصية تلقائية حسب حجم التدريب' },
    recommended: { zh: '推荐', en: 'Recommended', ar: 'موصى به' },
    trainingHours: { zh: '训练课时', en: 'Training Hours', ar: 'ساعات التدريب' },
    lessonCount: { zh: '上课次数', en: 'Sessions', ar: 'عدد الجلسات' },
    ratio: { zh: '占比', en: 'Share', ar: 'النسبة' },
    core: { zh: '核心教练', en: 'Core Coach', ar: 'مدرب أساسي' },
    regular: { zh: '常规教练', en: 'Regular Coach', ar: 'مدرب منتظم' },
    extra: { zh: '替补教练', en: 'Extra Coach', ar: 'مدرب إضافي' },
    noRecords: { zh: '暂无教练训练数据', en: 'No training data yet', ar: 'لا توجد بيانات تدريب' },
    endingSoon: { zh: '课时即将用尽，建议尽快安排', en: 'Lessons almost used up, schedule soon', ar: 'توشك الدروس على النفاد' },
  },

  // 表单验证
  validation: {
    required: { zh: '此项为必填项', en: 'This field is required', ar: 'هذا الحقل مطلوب' },
    invalidPhone: { zh: '请输入有效的电话号码', en: 'Please enter a valid phone number', ar: 'الرجاء إدخال رقم هاتف صحيح' },
  },

  // 成功/错误提示
  messages: {
    addSuccess: { zh: '添加成功', en: 'Added Successfully', ar: 'تمت الإضافة بنجاح' },
    updateSuccess: { zh: '更新成功', en: 'Updated Successfully', ar: 'تم التحديث بنجاح' },
    deleteSuccess: { zh: '删除成功', en: 'Deleted Successfully', ar: 'تم الحذف بنجاح' },
    error: { zh: '操作失败，请重试', en: 'Operation failed, please try again', ar: 'فشلت العملية، حاول مرة أخرى' },
    networkError: { zh: '网络错误', en: 'Network Error', ar: 'خطأ في الشبكة' },
  },

  // 乐姐日历
  calendar: {
    title: { zh: '乐姐日历', en: 'Jie Calendar', ar: 'تقويم جي' },
    today: { zh: '今天', en: 'Today', ar: 'اليوم' },
    week: { zh: '本周', en: 'Week', ar: 'الأسبوع' },
    month: { zh: '本月', en: 'Month', ar: 'الشهر' },
    newTask: { zh: '新建任务', en: 'New Task', ar: 'مهمة جديدة' },
    editTask: { zh: '编辑任务', en: 'Edit Task', ar: 'تعديل المهمة' },
    titleLabel: { zh: '任务标题', en: 'Task Title', ar: 'عنوان المهمة' },
    titlePlaceholder: { zh: '请输入任务标题', en: 'Enter task title', ar: 'أدخل عنوان المهمة' },
    descLabel: { zh: '描述', en: 'Description', ar: 'الوصف' },
    descPlaceholder: { zh: '请输入任务描述（可选）', en: 'Enter description (optional)', ar: 'أدخل الوصف (اختياري)' },
    colorLabel: { zh: '颜色', en: 'Color', ar: 'اللون' },
    onceType: { zh: '单次任务', en: 'One-time', ar: 'مرة واحدة' },
    repeatType: { zh: '周期任务', en: 'Recurring', ar: 'متكرر' },
    repeatKind: { zh: '重复方式', en: 'Repeat', ar: 'التكرار' },
    none: { zh: '不重复', en: 'No repeat', ar: 'لا تكرار' },
    daily: { zh: '每天', en: 'Daily', ar: 'يوميًا' },
    weekly: { zh: '每周', en: 'Weekly', ar: 'أسبوعيًا' },
    monthly: { zh: '每月', en: 'Monthly', ar: 'شهريًا' },
    startDate: { zh: '开始日期', en: 'Start Date', ar: 'تاريخ البدء' },
    endDate: { zh: '截止日期', en: 'End Date', ar: 'تاريخ الانتهاء' },
    endDatePlaceholder: { zh: '不填则长期有效', en: 'Leave empty for ongoing', ar: 'اتركه فارغًا إذا استمر' },
    singleDate: { zh: '日期', en: 'Date', ar: 'التاريخ' },
    taskType: { zh: '任务类型', en: 'Task Type', ar: 'نوع المهمة' },
    done: { zh: '完成', en: 'Done', ar: 'تم' },
    doneLabel: { zh: '已完成', en: 'Completed', ar: 'مكتملة' },
    noTasks: { zh: '暂无任务', en: 'No tasks', ar: 'لا توجد مهام' },
    repeatTask: { zh: '周期任务', en: 'Recurring', ar: 'متكرر' },
    deleteConfirm: { zh: '确定删除该任务吗？', en: 'Delete this task?', ar: 'حذف هذه المهمة؟' },
    saveSuccess: { zh: '保存成功', en: 'Saved', ar: 'تم الحفظ' },
  },
} as const;

export type Language = 'zh' | 'en' | 'ar';
export type TranslationKeys = typeof translations;
