import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const translations = {
  en: {
    // Header
    motto: 'Get organized, Get it Done!',

    // Menu
    menu: 'Menu',
    language: 'Language',
    backup: 'Backup',
    exportJson: 'Export as JSON',
    importJson: 'Import JSON Backup',
    removeExamples: 'Remove Example Tasks',

    // Home
    inExecution: 'In Execution',
    noActiveTasks: 'No active tasks',
    urgent: 'URGENT',
    regular: 'REGULAR',
    startDelayed: 'Start Delayed',
    startInOneDay: 'Start In One Day',
    startAfterADay: 'Start After A Day',
    noTasks: 'No tasks',

    // Task context menu
    edit: 'Edit',
    start: 'Start',
    finish: 'Finish',
    abandon: 'Abandon',
    delete: 'Delete',

    // Task form
    editTask: 'Edit Task',
    newTask: 'New Task',
    description: 'Description',
    descPlaceholder: 'Enter task description...',
    startLabel: 'Start',
    expectedEnd: 'Expected End',
    statusLabel: 'Status',
    created: 'Created',
    completed: 'Completed',
    abandoned: 'Abandoned',
    saveChanges: 'Save Changes',
    createTask: 'Create Task',

    // Calendar
    calendarView: 'Calendar View',
    filterByStatus: 'Filter by Status:',
    noTasksFound: 'No tasks found in this view',

    // Day names
    sun: 'Sun', mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat',

    // Month names
    january: 'January', february: 'February', march: 'March', april: 'April',
    may: 'May', june: 'June', july: 'July', august: 'August',
    september: 'September', october: 'October', november: 'November', december: 'December',

    // Bottom nav
    home: 'Home',
    refresh: 'Refresh',
    schedule: 'Schedule',

    // Alert
    invalidBackup: 'Invalid backup file. Please select a valid JSON backup.',
  },

  zh: {
    // Header
    motto: '有条不紊，高效完成！',

    // Menu
    menu: '菜单',
    language: '语言',
    backup: '备份',
    exportJson: '导出 JSON',
    importJson: '导入 JSON 备份',
    removeExamples: '删除示例任务',

    // Home
    inExecution: '执行中',
    noActiveTasks: '暂无进行中的任务',
    urgent: '紧急',
    regular: '常规',
    startDelayed: '延迟开始',
    startInOneDay: '一天内开始',
    startAfterADay: '一天后开始',
    noTasks: '暂无任务',

    // Task context menu
    edit: '编辑',
    start: '开始',
    finish: '完成',
    abandon: '放弃',
    delete: '删除',

    // Task form
    editTask: '编辑任务',
    newTask: '新建任务',
    description: '描述',
    descPlaceholder: '请输入任务描述...',
    startLabel: '开始时间',
    expectedEnd: '预计结束',
    statusLabel: '状态',
    created: '已创建',
    completed: '已完成',
    abandoned: '已放弃',
    saveChanges: '保存更改',
    createTask: '创建任务',

    // Calendar
    calendarView: '日历视图',
    filterByStatus: '按状态筛选：',
    noTasksFound: '此视图中没有任务',

    // Day names
    sun: '日', mon: '一', tue: '二', wed: '三', thu: '四', fri: '五', sat: '六',

    // Month names
    january: '一月', february: '二月', march: '三月', april: '四月',
    may: '五月', june: '六月', july: '七月', august: '八月',
    september: '九月', october: '十月', november: '十一月', december: '十二月',

    // Bottom nav
    home: '首页',
    refresh: '刷新',
    schedule: '日程',

    // Alert
    invalidBackup: '备份文件无效，请选择有效的 JSON 备份文件。',
  },
};

const STORAGE_KEY = 'no-stress-todo-locale';

function detectLocale() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && translations[stored]) return stored;
  const browserLang = navigator.language || '';
  return browserLang.startsWith('zh') ? 'zh' : 'en';
}

const I18nContext = createContext();

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(detectLocale);

  const setLocale = useCallback((l) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const t = useCallback((key, params) => {
    let str = translations[locale]?.[key] || translations.en[key] || key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        str = str.replace(`{${k}}`, v);
      }
    }
    return str;
  }, [locale]);

  const dateLocale = locale === 'zh' ? 'zh-CN' : 'en-US';

  const value = useMemo(() => ({ t, locale, setLocale, dateLocale }), [t, locale, setLocale, dateLocale]);

  return React.createElement(I18nContext.Provider, { value }, children);
}

export function useI18n() {
  return useContext(I18nContext);
}
