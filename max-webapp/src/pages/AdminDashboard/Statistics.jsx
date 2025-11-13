import { useQuery } from '@tanstack/react-query'
import { Layout, Button, BackButton } from '@components/common'
import { AttendanceChart, FilterPanel } from '@components/admin'
import { fetchAttendanceStats, exportAttendanceReport } from '@services/api/admin'
import styles from './Statistics.module.css'

const Statistics = () => {
  const { data: stats } = useQuery({ queryKey: ['attendanceStats'], queryFn: () => fetchAttendanceStats() })

  const handleExport = async () => {
    try {
      await exportAttendanceReport({}, 'xlsx')
    } catch (error) {
      console.error('Export error:', error)
    }
  }

  return (
    <Layout title="Статистика посещаемости">
      <BackButton to="/admin" />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Статистика посещаемости</h1>
          <Button onClick={handleExport}>📥 Экспорт отчета</Button>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>По группам</h2>
          <AttendanceChart
            data={stats?.byGroup?.map(g => ({ label: g.groupName, value: g.attendance })) || []}
            type="bar"
          />
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>По дисциплинам</h2>
          <AttendanceChart
            data={stats?.bySubject?.map(s => ({ label: s.subjectName, value: s.attendance })) || []}
            type="bar"
          />
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Тренд посещаемости</h2>
          <AttendanceChart
            data={stats?.trend?.map(t => ({ label: t.date, value: t.attendance })) || []}
            type="line"
          />
        </div>
      </div>
    </Layout>
  )
}

export default Statistics