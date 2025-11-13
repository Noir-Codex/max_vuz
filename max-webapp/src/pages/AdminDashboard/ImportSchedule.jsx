import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Layout, Button, BackButton } from '@components/common'
import { FileUpload, ImportPreview } from '@components/admin'
import { validateSchedule, importSchedule } from '@services/api/admin'
import styles from './Users.module.css'

const ImportSchedule = () => {
  const [file, setFile] = useState(null)
  const [validation, setValidation] = useState(null)
  const queryClient = useQueryClient()

  const validateMutation = useMutation({
    mutationFn: (data) => validateSchedule(data),
    onSuccess: (result) => setValidation(result),
  })

  const importMutation = useMutation({
    mutationFn: (data) => importSchedule(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['schedule'])
      setFile(null)
      setValidation(null)
      alert('Расписание успешно импортировано!')
    },
  })

  const handleFileSelect = async (selectedFile) => {
    setFile(selectedFile)
    setValidation(null)
    
    if (selectedFile) {
      // Парсинг файла и валидация
      const mockData = [
        { group: 'ИС-301', subject: 'Программирование', teacher: 'Иванов И.И.', day: 'Monday', time: '09:00', room: '301' },
        { group: 'ИС-302', subject: 'Базы данных', teacher: 'Петров П.П.', day: 'Tuesday', time: '10:45', room: '205' },
      ]
      validateMutation.mutate(mockData)
    }
  }

  const handleImport = () => {
    const mockData = [
      { group: 'ИС-301', subject: 'Программирование', teacher: 'Иванов И.И.', day: 'Monday', time: '09:00', room: '301' },
    ]
    importMutation.mutate(mockData)
  }

  return (
    <Layout title="Импорт расписания">
      <BackButton to="/admin" />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Импорт расписания</h1>
        </div>

        <div className={styles.formContainer}>
          <FileUpload
            onFileSelect={handleFileSelect}
            accept=".xlsx,.csv"
          />
        </div>

        {validateMutation.isPending && <p>Валидация файла...</p>}

        {validation && (
          <ImportPreview
            validationResult={validation}
            onConfirm={handleImport}
            onCancel={() => { setFile(null); setValidation(null) }}
            loading={importMutation.isPending}
          />
        )}
      </div>
    </Layout>
  )
}

export default ImportSchedule