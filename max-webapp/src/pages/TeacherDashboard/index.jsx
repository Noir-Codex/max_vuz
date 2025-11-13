import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import Layout from '@components/common/Layout'
import LoadingSpinner from '@components/common/LoadingSpinner'
import ErrorMessage from '@components/common/ErrorMessage'
import BackButton from '@components/common/BackButton'
import ScheduleItem from '@components/teacher/ScheduleItem'
import { useTeacherStore } from '@store/teacherStore'
import { useAuthStore } from '@store/authStore'
import { fetchTeacherStats, fetchTodayLessons } from '@services/api/teacher'
import styles from './index.module.css'

/**
 * Главная страница дашборда преподавателя
 */
const TeacherDashboard = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setStats, setTodayLessons } = useTeacherStore()
  const { user, userRole } = useAuthStore()

  // Для преподавателя фильтруем по его ID, для админа - показываем все
  const teacherId = userRole === 'teacher' ? user?.id : null

  // Загрузка статистики
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['teacherStats'],
    queryFn: fetchTeacherStats,
  })

  // Загрузка сегодняшних пар
  const {
    data: todayLessons,
    isLoading: lessonsLoading,
    error: lessonsError,
    refetch: refetchLessons,
  } = useQuery({
    queryKey: ['todayLessons', teacherId],
    queryFn: () => fetchTodayLessons(teacherId),
    enabled: !!user?.id,
  })

  useEffect(() => {
    if (stats) {
      setStats(stats)
    }
  }, [stats, setStats])

  useEffect(() => {
    if (todayLessons) {
      setTodayLessons(todayLessons)
    }
  }, [todayLessons, setTodayLessons])

  const handleLessonClick = (lesson) => {
    navigate(`/teacher/attendance/${lesson.id}`)
  }

  if (statsLoading || lessonsLoading) {
    return (
      <Layout title={t('teacher.dashboard')}>
        <LoadingSpinner text={t('common.loading')} />
      </Layout>
    )
  }

  if (statsError || lessonsError) {
    return (
      <Layout title={t('teacher.dashboard')}>
        <ErrorMessage
          message={t('teacher.errorLoadingData')}
          onRetry={() => {
            refetchStats()
            refetchLessons()
          }}
        />
      </Layout>
    )
  }

  const navigationItems = [
    { path: '/teacher', label: 'teacher.dashboard', icon: '🏠' },
    { path: '/teacher/groups', label: 'teacher.groups', icon: '👥' },
    { path: '/teacher/schedule', label: 'teacher.schedule', icon: '📅' },
  ]

  const todayLessonsCount = Array.isArray(todayLessons)
    ? todayLessons.length
    : (stats?.todayLessons || 0)

  return (
    <Layout
      title={t('teacher.dashboard')}
      showNavigation
      navigationItems={navigationItems}
    >
      <BackButton to="/" />
      <div className={styles.dashboard}>
        {/* Статистика */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>👥</div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>{t('teacher.totalGroups')}</span>
              <span className={styles.statValue}>{stats?.totalGroups || 0}</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>👨‍🎓</div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>{t('teacher.totalStudents')}</span>
              <span className={styles.statValue}>{stats?.totalStudents || 0}</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📚</div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>{t('teacher.todayLessonsCount')}</span>
              <span className={styles.statValue}>{todayLessonsCount}</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📊</div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>{t('teacher.avgAttendance')}</span>
              <span className={styles.statValue}>{stats?.averageAttendance || 0}%</span>
            </div>
          </div>
        </div>

        {/* Сегодняшние пары */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('teacher.todayLessons')}</h2>
          {todayLessons && todayLessons.length > 0 ? (
            <div className={styles.lessonsGrid}>
              {todayLessons.map((lesson) => (
                <ScheduleItem
                  key={lesson.id}
                  lesson={lesson}
                  onClick={handleLessonClick}
                  isToday
                />
              ))}
            </div>
          ) : (
            <div className={styles.noLessons}>
              <span className={styles.noLessonsIcon}>🎉</span>
              <p>{t('teacher.noLessonsToday')}</p>
            </div>
          )}
        </div>

        {/* Быстрые действия */}
        <div className={styles.quickActions}>
          <button
            className={styles.actionButton}
            onClick={() => navigate('/teacher/groups')}
          >
            <span className={styles.actionIcon}>👥</span>
            <span className={styles.actionLabel}>{t('teacher.viewGroups')}</span>
          </button>
          <button
            className={styles.actionButton}
            onClick={() => navigate('/teacher/schedule')}
          >
            <span className={styles.actionIcon}>📅</span>
            <span className={styles.actionLabel}>{t('teacher.viewSchedule')}</span>
          </button>
        </div>
      </div>
    </Layout>
  )
}

export default TeacherDashboard