import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import Layout from '@components/common/Layout'
import LoadingSpinner from '@components/common/LoadingSpinner'
import ErrorMessage from '@components/common/ErrorMessage'
import BackButton from '@components/common/BackButton'
import ScheduleGrid from '@components/teacher/ScheduleGrid'
import WeekSelector from '@components/teacher/WeekSelector'
import { useTeacherStore } from '@store/teacherStore'
import { useAuthStore } from '@store/authStore'
import { fetchSchedule, fetchScheduleByMonth, fetchCuratorGroups } from '@services/api/teacher'
import styles from './Schedule.module.css'

/**
 * Страница расписания
 */
const Schedule = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const groupId = searchParams.get('groupId')
  const { user, userRole } = useAuthStore()
  
  const {
    currentWeekType,
    weekOffset,
    currentMonth,
    currentYear,
    viewMode,
    setCurrentWeekType,
    setWeekOffset,
    setCurrentMonth,
    setCurrentYear,
    setViewMode,
    setSchedule,
    setSubjectFilter,
    getFilteredSchedule,
    getAllSubjects,
  } = useTeacherStore()

  const [selectedSubject, setSelectedSubject] = useState(null)

  // Загрузка групп куратора (для преподавателей)
  const { data: curatorGroups = [] } = useQuery({
    queryKey: ['curatorGroups', user?.id],
    queryFn: async () => {
      if (userRole !== 'teacher') return []
      try {
        return await fetchCuratorGroups(user.id)
      } catch (error) {
        console.error('Ошибка загрузки групп куратора:', error)
        return []
      }
    },
    enabled: !!user?.id && userRole === 'teacher',
  })

  // Загрузка расписания
  const {
    data: schedule,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['teacherSchedule', viewMode, currentWeekType, weekOffset, currentMonth, currentYear, groupId, user?.id, userRole, curatorGroups.length],
    queryFn: async () => {
      let allSchedule = []
      
      // Вычисляем week_type с учетом offset
      const getWeekTypeWithOffset = (offset) => {
        const now = new Date()
        const targetDate = new Date(now)
        targetDate.setDate(targetDate.getDate() + (offset * 7))
        
        const currentYear = targetDate.getFullYear()
        const currentMonth = targetDate.getMonth()
        
        const academicYearStart = new Date(
          currentMonth >= 8 ? currentYear : currentYear - 1,
          8, // сентябрь
          1
        )
        
        const diffTime = targetDate.getTime() - academicYearStart.getTime()
        const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7))
        
        return (diffWeeks % 2 === 0) ? 1 : 2
      }
      
      // Определяем week_type для запроса
      const weekTypeForRequest = currentWeekType !== null 
        ? currentWeekType 
        : getWeekTypeWithOffset(weekOffset)
      
      if (userRole === 'teacher') {
        // Для преподавателя загружаем:
        // 1. Его собственное расписание (где он ведет пары)
        // 2. Расписание групп, где он куратор
        
        const teacherId = user.id
        
        // 1. Собственное расписание
        const teacherSchedule = viewMode === 'month'
          ? await fetchScheduleByMonth(currentMonth, currentYear, groupId ? parseInt(groupId) : null, teacherId)
          : await fetchSchedule(weekTypeForRequest, groupId ? parseInt(groupId) : null, teacherId)
        
        allSchedule = [...teacherSchedule]
        
        // 2. Расписание групп куратора (если не выбрана конкретная группа)
        if (!groupId && curatorGroups.length > 0) {
          for (const group of curatorGroups) {
            const groupSchedule = viewMode === 'month'
              ? await fetchScheduleByMonth(currentMonth, currentYear, group.id, null)
              : await fetchSchedule(weekTypeForRequest, group.id, null)
            
            allSchedule = [...allSchedule, ...groupSchedule]
          }
        }
        
        // Убираем дубликаты по ID
        const uniqueSchedule = allSchedule.filter((lesson, index, self) =>
          index === self.findIndex((l) => l.id === lesson.id)
        )
        
        console.log('🔄 Загрузка расписания преподавателя:', {
          viewMode,
          currentWeekType,
          currentMonth,
          groupId,
          teacherId,
          curatorGroupsCount: curatorGroups.length,
          teacherScheduleCount: teacherSchedule.length,
          totalCount: uniqueSchedule.length
        })
        
        return uniqueSchedule
      } else {
        // Для админа - показываем все или по группе
        const teacherId = null
        
        console.log('🔄 Загрузка расписания админа:', {
          viewMode,
          currentWeekType,
          currentMonth,
          groupId
        })
        
        if (viewMode === 'month') {
          return fetchScheduleByMonth(
            currentMonth,
            currentYear,
            groupId ? parseInt(groupId) : null,
            teacherId
          )
        } else {
          return fetchSchedule(
            weekTypeForRequest,
            groupId ? parseInt(groupId) : null,
            teacherId
          )
        }
      }
    },
    enabled: !!user?.id,
  })

  useEffect(() => {
    if (schedule) {
      console.log('📅 Расписание загружено:', schedule.length, 'пар')
      console.log('Данные:', schedule)
      setSchedule(schedule)
    }
  }, [schedule, setSchedule])

  const handleWeekTypeChange = (weekType) => {
    setCurrentWeekType(weekType)
  }

  const handleMonthChange = (month) => {
    setCurrentMonth(month)
  }

  const handleViewModeChange = (mode) => {
    setViewMode(mode)
  }

  const handleLessonClick = (lesson) => {
    navigate(`/teacher/attendance/${lesson.id}`)
  }

  const handleSubjectFilterChange = (e) => {
    const subject = e.target.value || null
    setSelectedSubject(subject)
    setSubjectFilter(subject)
  }

  const filteredSchedule = getFilteredSchedule()
  const subjects = getAllSubjects()

  if (isLoading) {
    return (
      <Layout title={t('teacher.schedule')}>
        <LoadingSpinner text={t('common.loading')} />
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title={t('teacher.schedule')}>
        <ErrorMessage
          message={t('teacher.errorLoadingSchedule')}
          onRetry={refetch}
        />
      </Layout>
    )
  }

  const navigationItems = [
    { path: '/teacher', label: 'teacher.dashboard', icon: '🏠' },
    { path: '/teacher/groups', label: 'teacher.groups', icon: '👥' },
    { path: '/teacher/schedule', label: 'teacher.schedule', icon: '📅' },
  ]

  return (
    <Layout
      title={t('teacher.schedule')}
      showNavigation
      navigationItems={navigationItems}
    >
      <BackButton to="/teacher" />
      <div className={styles.container}>
        {/* Инструменты */}
        <div className={styles.toolbar}>
            <WeekSelector
              currentWeekType={currentWeekType}
              weekOffset={weekOffset}
              currentMonth={currentMonth}
              currentYear={currentYear}
              viewMode={viewMode}
              onWeekTypeChange={handleWeekTypeChange}
              onWeekOffsetChange={setWeekOffset}
              onMonthChange={handleMonthChange}
              onYearChange={setCurrentYear}
              onViewModeChange={handleViewModeChange}
            />
          
          {subjects.length > 0 && (
            <div className={styles.filterBox}>
              <label htmlFor="subject-filter" className={styles.filterLabel}>
                {t('teacher.filterBySubject')}:
              </label>
              <select
                id="subject-filter"
                value={selectedSubject || ''}
                onChange={handleSubjectFilterChange}
                className={styles.filterSelect}
              >
                <option value="">{t('teacher.allSubjects')}</option>
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Расписание */}
        {filteredSchedule.length > 0 ? (
          <ScheduleGrid
            schedule={filteredSchedule}
            onLessonClick={handleLessonClick}
            viewMode={viewMode}
          />
        ) : (
          <div className={styles.noSchedule}>
            <span className={styles.noScheduleIcon}>📅</span>
            <p>
              {viewMode === 'month' 
                ? t('teacher.noScheduleForMonth') 
                : t('teacher.noScheduleForWeek')
              }
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Schedule