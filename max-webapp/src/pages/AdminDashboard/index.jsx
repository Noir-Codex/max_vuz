import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Layout, LoadingSpinner, ErrorMessage, BackButton } from '@components/common'
import { StatisticsCard } from '@components/admin'
import { fetchAdminStats } from '@services/api/admin'
import { useAdminStore } from '@store/adminStore'
import styles from './index.module.css'

const AdminDashboard = () => {
  const { stats, setStats, setStatsLoading, setStatsError } = useAdminStore()

  const { data, isLoading, error } = useQuery({
    queryKey: ['adminStats'],
    queryFn: fetchAdminStats,
  })

  useEffect(() => {
    if (data) setStats(data)
    setStatsLoading(isLoading)
    if (error) setStatsError(error.message)
  }, [data, isLoading, error, setStats, setStatsLoading, setStatsError])

  if (isLoading) return <Layout><LoadingSpinner /></Layout>
  if (error) return <Layout><ErrorMessage message={error.message} /></Layout>

  return (
    <Layout title="Панель администратора">
      <BackButton to="/" />
      <div className={styles.container}>
        <div className={styles.statsGrid}>
          <StatisticsCard
            title="Всего пользователей"
            value={stats?.totalUsers || 0}
            icon="👥"
            color="default"
          />
          <StatisticsCard
            title="Студентов"
            value={stats?.totalStudents || 0}
            icon="🎓"
            color="success"
          />
          <StatisticsCard
            title="Преподавателей"
            value={stats?.totalTeachers || 0}
            icon="👨‍🏫"
            color="default"
          />
          <StatisticsCard
            title="Групп"
            value={stats?.totalGroups || 0}
            icon="📚"
            color="warning"
          />
          <StatisticsCard
            title="Дисциплин"
            value={stats?.totalSubjects || 0}
            icon="📖"
            color="default"
          />
          <StatisticsCard
            title="Посещаемость"
            value={`${stats?.averageAttendance || 0}%`}
            icon="📊"
            color="success"
          />
        </div>

        <div className={styles.quickActions}>
          <h2 className={styles.sectionTitle}>Быстрые действия</h2>
          <div className={styles.actionsGrid}>
            <Link to="/admin/users" className={styles.actionCard}>
              <span className={styles.actionIcon}>👥</span>
              <span className={styles.actionLabel}>Пользователи</span>
            </Link>
            <Link to="/admin/groups" className={styles.actionCard}>
              <span className={styles.actionIcon}>📚</span>
              <span className={styles.actionLabel}>Группы</span>
            </Link>
            <Link to="/admin/schedule" className={styles.actionCard}>
              <span className={styles.actionIcon}>📅</span>
              <span className={styles.actionLabel}>Расписание</span>
            </Link>
            <Link to="/admin/subjects" className={styles.actionCard}>
              <span className={styles.actionIcon}>📖</span>
              <span className={styles.actionLabel}>Дисциплины</span>
            </Link>
            <Link to="/admin/import" className={styles.actionCard}>
              <span className={styles.actionIcon}>📥</span>
              <span className={styles.actionLabel}>Импорт</span>
            </Link>
            <Link to="/admin/statistics" className={styles.actionCard}>
              <span className={styles.actionIcon}>📊</span>
              <span className={styles.actionLabel}>Статистика</span>
            </Link>
          </div>
        </div>

        {stats?.recentActions && (
          <div className={styles.recentSection}>
            <h2 className={styles.sectionTitle}>Последние действия</h2>
            <div className={styles.recentList}>
              {stats.recentActions.map(action => (
                <div key={action.id} className={styles.recentItem}>
                  <span className={styles.recentAction}>{action.action}</span>
                  <span className={styles.recentUser}>{action.user}</span>
                  <span className={styles.recentTime}>{action.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default AdminDashboard