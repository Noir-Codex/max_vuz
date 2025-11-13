import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import styles from './BackButton.module.css'

/**
 * Кнопка "Назад" для навигации
 */
const BackButton = ({ to, label = 'Назад', className = '' }) => {
  const navigate = useNavigate()

  const handleClick = () => {
    if (to) {
      navigate(to)
    } else {
      navigate(-1) // Назад в истории браузера
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${styles.backButton} ${className}`}
    >
      <span className={styles.backIcon}>←</span>
      <span className={styles.backLabel}>{label}</span>
    </button>
  )
}

BackButton.propTypes = {
  to: PropTypes.string,
  label: PropTypes.string,
  className: PropTypes.string,
}

export default BackButton

