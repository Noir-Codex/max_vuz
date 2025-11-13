import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation } from '@tanstack/react-query'
import Layout from '@components/common/Layout'
import LoadingSpinner from '@components/common/LoadingSpinner'
import ErrorMessage from '@components/common/ErrorMessage'
import BackButton from '@components/common/BackButton'
import Button from '@components/common/Button'
import StudentCheckList from '@components/teacher/StudentCheckList'
import QuickActions from '@components/teacher/QuickActions'
import { useTeacherStore } from '@store/teacherStore'
import { fetchStudents, fetchAttendance, saveAttendance, fetchLessonInfo } from '@services/api/teacher'
import styles from './Attendance.module.css'

/**
 * Страница отметки посещаемости
 */
const Attendance = () => {
  const { t } = useTranslation()
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const {
    students,
    setStudents,
    attendance,
    setAttendance,
  } = useTeacherStore()

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Загрузка информации о паре
  const {
    data: lessonInfo,
    isLoading: lessonLoading,
    error: lessonError,
  } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => fetchLessonInfo(parseInt(lessonId)),
  })

  // Загрузка студентов группы
  const {
    data: studentsData,
    isLoading: studentsLoading,
    error: studentsError,
    refetch: refetchStudents,
  } = useQuery({
    queryKey: ['students', lessonInfo?.group_id],
    queryFn: () => fetchStudents(lessonInfo.group_id),
    enabled: !!lessonInfo?.group_id,
  })

  // Загрузка посещаемости
  const {
    data: attendanceData,
    isLoading: attendanceLoading,
    error: attendanceError,
    refetch: refetchAttendance,
  } = useQuery({
    queryKey: ['attendance', lessonId],
    queryFn: () => fetchAttendance(parseInt(lessonId)),
  })

  // Мутация для сохранения
  const saveMutation = useMutation({
    mutationFn: (data) => saveAttendance(parseInt(lessonId), data),
    onSuccess: () => {
      alert(t('teacher.attendanceSaved'))
      setHasUnsavedChanges(false)
      navigate(-1)
    },
    onError: (error) => {
      console.error('Ошибка сохранения:', error)
      alert(t('teacher.errorSavingAttendance'))
    },
  })

  useEffect(() => {
    if (studentsData) {
      setStudents(studentsData)
    }
  }, [studentsData, setStudents])

  useEffect(() => {
    if (attendanceData && studentsData) {
      // Инициализация attendance на основе загруженных данных
      const initialAttendance = studentsData.map((student) => {
        const existing = attendanceData.find((a) => a.studentId === student.id)
        return {
          studentId: student.id,
          present: existing?.present || false,
        }
      })
      setAttendance(parseInt(lessonId), initialAttendance)
    }
  }, [attendanceData, studentsData, lessonId, setAttendance])

  const handleToggle = (studentId) => {
    const currentAttendance = attendance[parseInt(lessonId)] || []
    const updatedAttendance = currentAttendance.map((item) =>
      item.studentId === studentId
        ? { ...item, present: !item.present }
        : item
    )
    setAttendance(parseInt(lessonId), updatedAttendance)
    setHasUnsavedChanges(true)
  }

  const handleMarkAll = () => {
    const currentAttendance = attendance[parseInt(lessonId)] || []
    const updatedAttendance = currentAttendance.map((item) => ({
      ...item,
      present: true,
    }))
    setAttendance(parseInt(lessonId), updatedAttendance)
    setHasUnsavedChanges(true)
  }

  const handleClearAll = () => {
    const currentAttendance = attendance[parseInt(lessonId)] || []
    const updatedAttendance = currentAttendance.map((item) => ({
      ...item,
      present: false,
    }))
    setAttendance(parseInt(lessonId), updatedAttendance)
    setHasUnsavedChanges(true)
  }

  const handleSave = () => {
    const currentAttendance = attendance[parseInt(lessonId)] || []
    // Преобразуем формат данных для API
    const attendanceData = currentAttendance.map((item) => ({
      student_id: item.studentId,
      status: item.present ? 'present' : 'absent',
      date: new Date().toISOString().split('T')[0],
    }))
    saveMutation.mutate(attendanceData)
  }

  const getCurrentAttendance = (studentId) => {
    const currentAttendance = attendance[parseInt(lessonId)] || []
    const studentAttendance = currentAttendance.find((a) => a.studentId === studentId)
    return studentAttendance?.present || false
  }

  const currentAttendance = attendance[parseInt(lessonId)] || []

  if (lessonLoading || studentsLoading || attendanceLoading) {
    return (
      <Layout title={t('teacher.attendance')}>
        <LoadingSpinner text={t('common.loading')} />
      </Layout>
    )
  }

  if (lessonError || studentsError || attendanceError) {
    return (
      <Layout title={t('teacher.attendance')}>
        <ErrorMessage
          message={t('teacher.errorLoadingData')}
          onRetry={() => {
            refetchStudents()
            refetchAttendance()
          }}
        />
      </Layout>
    )
  }

  return (
    <Layout title={t('teacher.attendance')} showHeader>
      <BackButton to="/teacher" />
      <div className={styles.container}>
        {/* Информация о паре */}
        <div className={styles.lessonInfo}>
          <h2 className={styles.lessonTitle}>
            {lessonInfo?.subject_name || t('teacher.lesson')} #{lessonId}
          </h2>
          <p className={styles.lessonDescription}>
            {lessonInfo?.group_name && <span>Группа: {lessonInfo.group_name} • </span>}
            {t('teacher.markStudentAttendance')}
          </p>
        </div>

        {/* Быстрые действия */}
        <QuickActions onMarkAll={handleMarkAll} onClearAll={handleClearAll} />

        {/* Список студентов */}
        <StudentCheckList
          students={students}
          attendance={currentAttendance}
          onToggle={handleToggle}
        />

        {/* Кнопки действий */}
        <div className={styles.actions}>
          <Button
            variant="secondary"
            onClick={() => navigate(-1)}
            disabled={saveMutation.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            loading={saveMutation.isPending}
            disabled={!hasUnsavedChanges}
          >
            💾 {t('teacher.saveAttendance')}
          </Button>
        </div>

        {/* Предупреждение о несохраненных изменениях */}
        {hasUnsavedChanges && (
          <div className={styles.warning}>
            ⚠️ {t('teacher.unsavedChanges')}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Attendance