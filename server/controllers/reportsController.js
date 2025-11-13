const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Group = require('../models/Group');
const Subject = require('../models/Subject');
const { asyncHandler } = require('../middleware/errorHandler');
const { exportAttendanceReport, exportAttendanceStats } = require('../utils/export');

/**
 * Получить отчет о посещаемости
 * GET /api/reports/attendance
 */
exports.getAttendanceReport = asyncHandler(async (req, res) => {
  const { group_id, student_id, subject_id, date_from, date_to } = req.query;
  
  const report = await Attendance.getDetailedReport({
    group_id,
    student_id,
    subject_id,
    date_from,
    date_to
  });
  
  res.json(report);
});

/**
 * Экспортировать отчет о посещаемости
 * GET /api/reports/export
 */
exports.exportReport = asyncHandler(async (req, res) => {
  const { group_id, student_id, subject_id, date_from, date_to, format = 'xlsx' } = req.query;
  
  const data = await Attendance.getDetailedReport({
    group_id,
    student_id,
    subject_id,
    date_from,
    date_to
  });
  
  const fileBuffer = exportAttendanceReport(data, format);
  
  const filename = `attendance_report_${new Date().toISOString().split('T')[0]}.${format}`;
  
  res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  
  res.send(fileBuffer);
});

/**
 * Получить статистику по группам
 * GET /api/reports/stats/groups
 */
exports.getGroupsStats = asyncHandler(async (req, res) => {
  const { date_from, date_to } = req.query;
  
  const groups = await Group.findAll();
  const stats = [];
  
  for (const group of groups) {
    const groupStats = await Attendance.getGroupStats(group.id, { date_from, date_to });
    if (groupStats) {
      stats.push(groupStats);
    }
  }
  
  res.json(stats);
});

/**
 * Получить статистику по дисциплинам
 * GET /api/reports/stats/subjects
 */
exports.getSubjectsStats = asyncHandler(async (req, res) => {
  const { date_from, date_to } = req.query;
  
  const subjects = await Subject.findAll();
  const stats = [];
  
  for (const subject of subjects) {
    const subjectStats = await Attendance.getSubjectStats(subject.id, { date_from, date_to });
    if (subjectStats) {
      stats.push(subjectStats);
    }
  }
  
  res.json(stats);
});

/**
 * Получить общую статистику системы
 * GET /api/reports/stats/overall
 */
exports.getOverallStats = asyncHandler(async (req, res) => {
  const { date_from, date_to } = req.query;
  
  const attendanceStats = await Attendance.getOverallStats({ date_from, date_to });
  const userStats = await User.getStatistics();
  const groupStats = await Group.getStatistics();
  const subjectStats = await Subject.getStatistics();
  
  res.json({
    attendance: attendanceStats,
    users: userStats,
    groups: groupStats,
    subjects: subjectStats
  });
});

/**
 * Экспортировать статистику групп
 * GET /api/reports/export/groups
 */
exports.exportGroupsStats = asyncHandler(async (req, res) => {
  const { date_from, date_to, format = 'xlsx' } = req.query;
  
  const groups = await Group.findAll();
  const stats = [];
  
  for (const group of groups) {
    const groupStats = await Attendance.getGroupStats(group.id, { date_from, date_to });
    if (groupStats) {
      stats.push(groupStats);
    }
  }
  
  const fileBuffer = exportAttendanceStats(stats, format);
  
  const filename = `groups_stats_${new Date().toISOString().split('T')[0]}.${format}`;
  
  res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  
  res.send(fileBuffer);
});

/**
 * Получить статистику для dashboard
 * GET /api/reports/dashboard-stats
 */
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const { query } = require('../config/database');
  
  const [
    userStats,
    subjectStats,
    groupsResult,
    lessonsResult,
    attendanceResult,
  ] = await Promise.all([
    User.getStatistics(),
    Subject.getStatistics(),
    query(`SELECT COUNT(*) as total_groups FROM groups`),
    query(`SELECT COUNT(*) as total_lessons FROM schedule`),
    query(`
    SELECT
      COALESCE(
        ROUND(
          (COUNT(CASE WHEN status = 'present' THEN 1 END)::numeric /
          NULLIF(COUNT(*), 0)::numeric * 100)::numeric,
          2
        ),
        0
      ) as average_attendance
    FROM attendance
    WHERE date >= NOW() - INTERVAL '30 days'
    `),
  ])
  
  res.json({
    totalUsers: parseInt(userStats?.total) || 0,
    totalStudents: parseInt(userStats?.students) || 0,
    totalTeachers: parseInt(userStats?.teachers) || 0,
    totalAdmins: parseInt(userStats?.admins) || 0,
    totalSubjects: parseInt(subjectStats?.total_subjects) || 0,
    totalGroups: parseInt(groupsResult.rows[0]?.total_groups) || 0,
    totalLessons: parseInt(lessonsResult.rows[0]?.total_lessons) || 0,
    averageAttendance: parseFloat(attendanceResult.rows[0]?.average_attendance) || 0,
  });
});