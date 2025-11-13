import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Layout, Button, BackButton } from '@components/common'
import { SubjectList, SubjectForm, ConfirmDialog } from '@components/admin'
import { fetchSubjects, createSubject, updateSubject, deleteSubject } from '@services/api/admin'
import styles from './Users.module.css'

const Subjects = () => {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const queryClient = useQueryClient()

  const { data: subjects = [], isLoading } = useQuery({ queryKey: ['subjects'], queryFn: fetchSubjects })

  const createMutation = useMutation({
    mutationFn: createSubject,
    onSuccess: () => { queryClient.invalidateQueries(['subjects']); setShowForm(false) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateSubject(id, data),
    onSuccess: () => { queryClient.invalidateQueries(['subjects']); setEditing(null); setShowForm(false) },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSubject,
    onSuccess: () => { queryClient.invalidateQueries(['subjects']); setDeleteConfirm(null) },
  })

  return (
    <Layout title="Управление дисциплинами">
      <BackButton to="/admin" />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Дисциплины</h1>
          <Button onClick={() => { setShowForm(true); setEditing(null) }}>+ Добавить дисциплину</Button>
        </div>

        {showForm && (
          <div className={styles.formContainer}>
            <SubjectForm
              subject={editing}
              onSubmit={(data) => editing ? updateMutation.mutate({ id: editing.id, data }) : createMutation.mutate(data)}
              onCancel={() => { setShowForm(false); setEditing(null) }}
              loading={createMutation.isPending || updateMutation.isPending}
            />
          </div>
        )}

        <SubjectList
          subjects={subjects}
          loading={isLoading}
          onEdit={(s) => { setEditing(s); setShowForm(true) }}
          onDelete={(s) => setDeleteConfirm(s)}
        />

        <ConfirmDialog
          isOpen={!!deleteConfirm}
          title="Удалить дисциплину"
          message={`Удалить дисциплину ${deleteConfirm?.name}?`}
          type="danger"
          onConfirm={() => deleteMutation.mutate(deleteConfirm.id)}
          onCancel={() => setDeleteConfirm(null)}
        />
      </div>
    </Layout>
  )
}

export default Subjects