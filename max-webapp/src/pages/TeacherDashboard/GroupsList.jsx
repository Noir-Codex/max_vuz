import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import Layout from '@components/common/Layout'
import LoadingSpinner from '@components/common/LoadingSpinner'
import ErrorMessage from '@components/common/ErrorMessage'
import BackButton from '@components/common/BackButton'
import GroupCard from '@components/teacher/GroupCard'
import { useTeacherStore } from '@store/teacherStore'
import { fetchGroups } from '@services/api/teacher'
import styles from './GroupsList.module.css'

/**
 * Страница списка групп преподавателя
 */
const GroupsList = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setGroups, setSearchQuery, getFilteredGroups } = useTeacherStore()
  const [searchInput, setSearchInput] = useState('')

  const {
    data: groups,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['teacherGroups'],
    queryFn: fetchGroups,
  })

  useEffect(() => {
    if (groups) {
      setGroups(groups)
    }
  }, [groups, setGroups])

  const handleSearch = (e) => {
    const query = e.target.value
    setSearchInput(query)
    setSearchQuery(query)
  }

  const handleGroupClick = (group) => {
    navigate(`/teacher/schedule?groupId=${group.id}`)
  }

  const filteredGroups = getFilteredGroups()

  if (isLoading) {
    return (
      <Layout title={t('teacher.groups')}>
        <LoadingSpinner text={t('common.loading')} />
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title={t('teacher.groups')}>
        <ErrorMessage
          message={t('teacher.errorLoadingGroups')}
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
      title={t('teacher.groups')}
      showNavigation
      navigationItems={navigationItems}
    >
      <BackButton to="/teacher" />
      <div className={styles.container}>
        {/* Поиск */}
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder={t('teacher.searchGroups')}
            value={searchInput}
            onChange={handleSearch}
            className={styles.searchInput}
          />
          <span className={styles.searchIcon}>🔍</span>
        </div>

        {/* Список групп */}
        {filteredGroups.length > 0 ? (
          <div className={styles.groupsGrid}>
            {filteredGroups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                onClick={() => handleGroupClick(group)}
              />
            ))}
          </div>
        ) : (
          <div className={styles.noResults}>
            <span className={styles.noResultsIcon}>🔍</span>
            <p>{t('teacher.noGroupsFound')}</p>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default GroupsList