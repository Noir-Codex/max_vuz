import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Layout, Button, BackButton } from '@components/common'
import { UserList, UserForm, ConfirmDialog } from '@components/admin'
import { fetchUsers, createUser, updateUser, deleteUser, fetchGroups } from '@services/api/admin'
import styles from './Users.module.css'

const Users = () => {
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const queryClient = useQueryClient()

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => fetchUsers(),
  })

  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: () => fetchGroups(),
  })

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      setShowForm(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      setEditingUser(null)
      setShowForm(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      setDeleteConfirm(null)
    },
  })

  const handleSubmit = (data) => {
    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <Layout title="Управление пользователями">
      <BackButton to="/admin" />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Пользователи</h1>
          <Button onClick={() => { setShowForm(true); setEditingUser(null) }}>
            + Добавить пользователя
          </Button>
        </div>

        {showForm && (
          <div className={styles.formContainer}>
            <UserForm
              user={editingUser}
              groups={groups}
              onSubmit={handleSubmit}
              onCancel={() => { setShowForm(false); setEditingUser(null) }}
              loading={createMutation.isPending || updateMutation.isPending}
            />
          </div>
        )}

        <UserList
          users={users}
          loading={isLoading}
          onEdit={(user) => { setEditingUser(user); setShowForm(true) }}
          onDelete={(user) => setDeleteConfirm(user)}
        />

        <ConfirmDialog
          isOpen={!!deleteConfirm}
          title="Удалить пользователя"
          message={`Вы уверены, что хотите удалить пользователя ${deleteConfirm?.name}?`}
          type="danger"
          onConfirm={() => deleteMutation.mutate(deleteConfirm.id)}
          onCancel={() => setDeleteConfirm(null)}
        />
      </div>
    </Layout>
  )
}

export default Users