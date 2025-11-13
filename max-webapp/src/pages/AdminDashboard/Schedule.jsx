import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Layout, Button, BackButton } from '@components/common'
import { ScheduleTable, ScheduleForm, ConfirmDialog } from '@components/admin'
import { fetchSchedule, fetchGroups, fetchSubjects, fetchTeachers, createLesson, updateLesson, deleteLesson } from '@services/api/admin'
import styles from './Users.module.css'

const Schedule = () => {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const queryClient = useQueryClient()

  // Загружаем все расписание (без фильтра по week_type, чтобы показать все пары)
  const { data: schedule = [], isLoading } = useQuery({ 
    queryKey: ['adminSchedule'], 
    queryFn: () => fetchSchedule(null) // null = все расписание
  })
  const { data: groups = [] } = useQuery({ queryKey: ['groups'], queryFn: fetchGroups })
  const { data: subjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: fetchSubjects })
  const { data: teachers = [] } = useQuery({ queryKey: ['teachers'], queryFn: fetchTeachers })

  const createMutation = useMutation({
    mutationFn: createLesson,
    onSuccess: () => { 
      queryClient.invalidateQueries(['schedule']); 
      setShowForm(false);
      console.log('✅ Пара успешно создана');
    },
    onError: (error) => {
      console.error('❌ Ошибка создания пары:', error);
      alert(error.response?.data?.message || error.message || 'Ошибка при создании пары');
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateLesson(id, data),
    onSuccess: () => { 
      queryClient.invalidateQueries(['schedule']); 
      setEditing(null); 
      setShowForm(false);
      console.log('✅ Пара успешно обновлена');
    },
    onError: (error) => {
      console.error('❌ Ошибка обновления пары:', error);
      alert(error.response?.data?.message || error.message || 'Ошибка при обновлении пары');
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteLesson,
    onSuccess: () => { queryClient.invalidateQueries(['schedule']); setDeleteConfirm(null) },
  })

  return (
    <Layout title="Управление расписанием">
      <BackButton to="/admin" />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Расписание</h1>
          <Button onClick={() => { setShowForm(true); setEditing(null) }}>+ Добавить пару</Button>
        </div>

        {showForm && (
          <div className={styles.formContainer}>
            <ScheduleForm
              lesson={editing}
              groups={groups}
              subjects={subjects}
              teachers={teachers}
              onSubmit={(data) => editing ? updateMutation.mutate({ id: editing.id, data }) : createMutation.mutate(data)}
              onCancel={() => { setShowForm(false); setEditing(null) }}
              loading={createMutation.isPending || updateMutation.isPending}
            />
          </div>
        )}

        <ScheduleTable
          schedule={schedule}
          loading={isLoading}
          onEdit={(l) => { setEditing(l); setShowForm(true) }}
          onDelete={(l) => setDeleteConfirm(l)}
        />

        <ConfirmDialog
          isOpen={!!deleteConfirm}

          title="Удалить пару"
          message="Удалить эту пару из расписания?"
          type="danger"
          onConfirm={() => deleteMutation.mutate(deleteConfirm.id)}
          onCancel={() => setDeleteConfirm(null)}
        />
      </div>
    </Layout>
  )
}

export default Schedule