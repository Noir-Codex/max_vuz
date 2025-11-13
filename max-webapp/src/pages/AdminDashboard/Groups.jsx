import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Layout, Button, BackButton } from '@components/common'
import { GroupList, GroupForm, ConfirmDialog } from '@components/admin'
import { fetchGroups, fetchTeachers, fetchGroupStudents, createGroup, updateGroup, deleteGroup } from '@services/api/admin'
import styles from './Users.module.css'

const Groups = () => {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [viewingStudents, setViewingStudents] = useState(null)
  const queryClient = useQueryClient()

  const { data: groups = [], isLoading } = useQuery({ queryKey: ['groups'], queryFn: fetchGroups })
  const { data: teachers = [] } = useQuery({ queryKey: ['teachers'], queryFn: fetchTeachers })
  
  // Загрузка студентов группы
  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['groupStudents', viewingStudents?.id],
    queryFn: () => fetchGroupStudents(viewingStudents.id),
    enabled: !!viewingStudents
  })

  const createMutation = useMutation({
    mutationFn: createGroup,
    onSuccess: () => { queryClient.invalidateQueries(['groups']); setShowForm(false) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateGroup(id, data),
    onSuccess: () => { queryClient.invalidateQueries(['groups']); setEditing(null); setShowForm(false) },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteGroup,
    onSuccess: () => { queryClient.invalidateQueries(['groups']); setDeleteConfirm(null) },
  })

  return (
    <Layout title="Управление группами">
      <BackButton to="/admin" />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Группы</h1>
          <Button onClick={() => { setShowForm(true); setEditing(null) }}>+ Добавить группу</Button>
        </div>

        {showForm && (
          <div className={styles.formContainer}>
            <GroupForm
              group={editing}
              teachers={teachers}
              onSubmit={(data) => editing ? updateMutation.mutate({ id: editing.id, data }) : createMutation.mutate(data)}
              onCancel={() => { setShowForm(false); setEditing(null) }}
              loading={createMutation.isPending || updateMutation.isPending}
            />
          </div>
        )}

        <GroupList
          groups={groups}
          loading={isLoading}
          onEdit={(g) => { setEditing(g); setShowForm(true) }}
          onDelete={(g) => setDeleteConfirm(g)}
          onViewStudents={(g) => setViewingStudents(g)}
        />

        {viewingStudents && (
          <div className={styles.modal} onClick={() => setViewingStudents(null)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h2>Студенты группы {viewingStudents.name}</h2>
              <p className={styles.studentsCount}>Всего студентов: {viewingStudents.students_count || 0}</p>
              
              {studentsLoading ? (
                <p style={{color: '#666', padding: '20px', textAlign: 'center'}}>Загрузка...</p>
              ) : students && students.length > 0 ? (
                <div className={styles.studentsList}>
                  {students.map((student) => (
                    <div key={student.id} className={styles.studentItem}>
                      <span className={styles.studentName}>
                        {student.last_name} {student.first_name}
                      </span>
                      {student.email && (
                        <span className={styles.studentEmail}>{student.email}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.noStudents}>В группе пока нет студентов</p>
              )}
              
              <div style={{marginTop: '16px'}}>
                <Button onClick={() => setViewingStudents(null)}>Закрыть</Button>
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          isOpen={!!deleteConfirm}
          title="Удалить группу"
          message={`Удалить группу ${deleteConfirm?.name}?`}
          type="danger"
          onConfirm={() => deleteMutation.mutate(deleteConfirm.id)}
          onCancel={() => setDeleteConfirm(null)}
        />
      </div>
    </Layout>
  )
}

export default Groups