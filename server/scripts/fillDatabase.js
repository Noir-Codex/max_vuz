const bcrypt = require('bcrypt');
const { query } = require('../config/database');
const User = require('../models/User');
const Group = require('../models/Group');
const Subject = require('../models/Subject');
const Schedule = require('../models/Schedule');

/**
 * Скрипт для заполнения базы данных
 * НЕ удаляет существующие данные, только добавляет недостающие
 */

/**
 * Проверить, существует ли пользователь с таким email
 */
async function userExists(email) {
  const result = await query('SELECT id FROM users WHERE email = $1', [email]);
  return result.rows.length > 0;
}

/**
 * Проверить, существует ли группа с таким названием
 */
async function groupExists(name) {
  const result = await query('SELECT id FROM groups WHERE name = $1', [name]);
  return result.rows.length > 0;
}

/**
 * Проверить, существует ли предмет с таким названием
 */
async function subjectExists(name) {
  const result = await query('SELECT id FROM subjects WHERE name = $1', [name]);
  return result.rows.length > 0;
}

/**
 * Создать пользователя, если его нет
 */
async function createUserIfNotExists(userData) {
  const exists = await userExists(userData.email);
  if (exists) {
    const existing = await User.findByEmail(userData.email);
    console.log(`  ⏭️  Пользователь ${userData.email} уже существует (ID: ${existing.id})`);
    return existing;
  }
  
  const hashedPassword = await bcrypt.hash(userData.password || 'teacher123', 10);
  const newUser = await User.create({
    telegram_id: userData.telegram_id || null,
    username: userData.username || userData.email.split('@')[0],
    first_name: userData.first_name,
    last_name: userData.last_name,
    role: userData.role,
    email: userData.email,
    password: hashedPassword
  });
  console.log(`  ✅ Создан пользователь: ${userData.first_name} ${userData.last_name} (${userData.email})`);
  return newUser;
}

/**
 * Создать группу, если её нет
 */
async function createGroupIfNotExists(groupData) {
  const exists = await groupExists(groupData.name);
  if (exists) {
    const result = await query('SELECT id FROM groups WHERE name = $1', [groupData.name]);
    console.log(`  ⏭️  Группа ${groupData.name} уже существует (ID: ${result.rows[0].id})`);
    return result.rows[0];
  }
  
  const newGroup = await Group.create(groupData);
  console.log(`  ✅ Создана группа: ${groupData.name}`);
  return newGroup;
}

/**
 * Создать предмет, если его нет
 */
async function createSubjectIfNotExists(subjectData) {
  const exists = await subjectExists(subjectData.name);
  if (exists) {
    const result = await query('SELECT id FROM subjects WHERE name = $1', [subjectData.name]);
    console.log(`  ⏭️  Предмет ${subjectData.name} уже существует (ID: ${result.rows[0].id})`);
    return result.rows[0];
  }
  
  const newSubject = await Subject.create(subjectData);
  console.log(`  ✅ Создан предмет: ${subjectData.name}`);
  return newSubject;
}

/**
 * Проверить, существует ли такая пара в расписании
 */
async function scheduleExists(lessonData) {
  const result = await query(`
    SELECT id FROM schedule 
    WHERE subject_id = $1 
      AND group_id = $2 
      AND teacher_id = $3 
      AND day_of_week = $4 
      AND time_start = $5 
      AND time_end = $6
      AND week_type = $7
  `, [
    lessonData.subject_id,
    lessonData.group_id,
    lessonData.teacher_id,
    lessonData.day_of_week,
    lessonData.time_start,
    lessonData.time_end,
    lessonData.week_type || 0
  ]);
  return result.rows.length > 0;
}

/**
 * Создать пару в расписании, если её нет
 */
async function createScheduleIfNotExists(lessonData) {
  const exists = await scheduleExists(lessonData);
  if (exists) {
    return null; // Пара уже существует
  }
  
  const newLesson = await Schedule.create(lessonData);
  return newLesson;
}

/**
 * Основная функция заполнения базы данных
 */
async function fillDatabase() {
  try {
    console.log('🌱 Начинаем заполнение базы данных...\n');
    console.log('ℹ️  Существующие данные не будут изменены\n');

    // 1. Создание преподавателей
    console.log('👨‍🏫 Создание преподавателей...');
    const teachers = [
      { first_name: 'Иван', last_name: 'Иванов', email: 'ivanov@university.ru', username: 'ivanov' },
      { first_name: 'Пётр', last_name: 'Петров', email: 'petrov@university.ru', username: 'petrov' },
      { first_name: 'Анна', last_name: 'Сидорова', email: 'sidorova@university.ru', username: 'sidorova' },
      { first_name: 'Мария', last_name: 'Козлова', email: 'kozlova@university.ru', username: 'kozlova' },
      { first_name: 'Сергей', last_name: 'Волков', email: 'volkov@university.ru', username: 'volkov' },
      { first_name: 'Елена', last_name: 'Новикова', email: 'novikova@university.ru', username: 'novikova' },
      { first_name: 'Дмитрий', last_name: 'Морозов', email: 'morozov@university.ru', username: 'morozov' },
      { first_name: 'Ольга', last_name: 'Лебедева', email: 'lebedeva@university.ru', username: 'lebedeva' }
    ];
    
    const teacherIds = [];
    for (const teacher of teachers) {
      const user = await createUserIfNotExists({
        ...teacher,
        role: 'teacher',
        password: 'teacher123'
      });
      teacherIds.push(user.id);
    }
    console.log(`✅ Обработано преподавателей: ${teacherIds.length}\n`);

    // 2. Создание групп и назначение кураторов
    console.log('👨‍🎓 Создание групп...');
    const groups = [
      { name: 'ИС-301', course: 3, specialty: 'Информационные системы', curator_id: teacherIds[0] },
      { name: 'ИС-302', course: 3, specialty: 'Информационные системы', curator_id: teacherIds[1] },
      { name: 'ПИ-401', course: 4, specialty: 'Прикладная информатика', curator_id: teacherIds[2] },
      { name: 'ПИ-402', course: 4, specialty: 'Прикладная информатика', curator_id: teacherIds[3] },
      { name: 'ИС-201', course: 2, specialty: 'Информационные системы', curator_id: teacherIds[4] },
      { name: 'ИС-202', course: 2, specialty: 'Информационные системы', curator_id: teacherIds[5] },
      { name: 'ПИ-501', course: 5, specialty: 'Прикладная информатика', curator_id: teacherIds[6] },
      { name: 'ПИ-502', course: 5, specialty: 'Прикладная информатика', curator_id: teacherIds[7] }
    ];
    
    const groupIds = [];
    for (const group of groups) {
      const groupRecord = await createGroupIfNotExists(group);
      groupIds.push(groupRecord.id);
    }
    console.log(`✅ Обработано групп: ${groupIds.length}\n`);

    // 3. Создание предметов
    console.log('📚 Создание предметов...');
    const subjects = [
      { name: 'Программирование', type: 'Лекция', hours: 120 },
      { name: 'Базы данных', type: 'Практика', hours: 90 },
      { name: 'Веб-разработка', type: 'Лабораторная', hours: 80 },
      { name: 'Алгоритмы и структуры данных', type: 'Лекция', hours: 100 },
      { name: 'Математика', type: 'Лекция', hours: 110 },
      { name: 'Физика', type: 'Лекция', hours: 90 },
      { name: 'Информатика', type: 'Практика', hours: 100 },
      { name: 'Теория вероятностей', type: 'Лекция', hours: 80 },
      { name: 'Дискретная математика', type: 'Лекция', hours: 90 },
      { name: 'Компьютерные сети', type: 'Лабораторная', hours: 70 },
      { name: 'Операционные системы', type: 'Практика', hours: 85 },
      { name: 'Архитектура ЭВМ', type: 'Лекция', hours: 75 }
    ];
    
    const subjectIds = [];
    for (const subject of subjects) {
      const subjectRecord = await createSubjectIfNotExists(subject);
      subjectIds.push(subjectRecord.id);
    }
    console.log(`✅ Обработано предметов: ${subjectIds.length}\n`);

    // 4. Создание расписания
    console.log('📅 Создание расписания...');
    const timeSlots = [
      { start: '09:00', end: '10:30' },
      { start: '10:45', end: '12:15' },
      { start: '12:30', end: '14:00' },
      { start: '14:15', end: '15:45' },
      { start: '16:00', end: '17:30' }
    ];
    
    const rooms = ['101', '102', '103', '205', '206', '207', '308', '309', '412', '413', '501', '502'];
    const lessonTypes = ['lecture', 'practice', 'lab'];
    
    let scheduleCount = 0;
    let skippedCount = 0;

    // Создаём расписание для каждой группы
    // week_type: 0 = каждую неделю, 1 = первая (нечетная), 2 = вторая (четная)
    for (let groupIdx = 0; groupIdx < groupIds.length; groupIdx++) {
      const groupId = groupIds[groupIdx];
      const teacherId = teacherIds[groupIdx % teacherIds.length]; // Распределяем преподавателей
      
      // Создаём пары на каждый день недели (понедельник-пятница = 1-5)
      for (let day = 1; day <= 5; day++) {
        // 3-4 пары в день
        const lessonsPerDay = 3 + Math.floor(Math.random() * 2);
        
        for (let lessonIdx = 0; lessonIdx < lessonsPerDay && lessonIdx < timeSlots.length; lessonIdx++) {
          const subjectId = subjectIds[Math.floor(Math.random() * subjectIds.length)];
          const timeSlot = timeSlots[lessonIdx];
          const room = rooms[Math.floor(Math.random() * rooms.length)];
          const lessonType = lessonTypes[Math.floor(Math.random() * lessonTypes.length)];
          
          // Создаём пары для всех типов недель
          // 0 = каждую неделю (основные пары)
          // 1 и 2 = для первой и второй недели (дополнительные пары)
          const weekTypes = [0]; // Основные пары - каждую неделю
          
          // Добавляем дополнительные пары для первой и второй недели (примерно 30% пар)
          if (Math.random() < 0.3) {
            weekTypes.push(Math.random() < 0.5 ? 1 : 2);
          }
          
          for (const weekType of weekTypes) {
            const lessonData = {
              subject_id: subjectId,
              group_id: groupId,
              teacher_id: teacherId,
              day_of_week: day,
              time_start: timeSlot.start,
              time_end: timeSlot.end,
              room: room,
              week_type: weekType,
              lesson_type: lessonType
            };
            
            const created = await createScheduleIfNotExists(lessonData);
            if (created) {
              scheduleCount++;
            } else {
              skippedCount++;
            }
          }
        }
      }
    }
    
    // Дополнительно создаём пары для каждого преподавателя (чтобы у всех было расписание)
    for (let teacherIdx = 0; teacherIdx < teacherIds.length; teacherIdx++) {
      const teacherId = teacherIds[teacherIdx];
      // Назначаем преподавателю случайные группы
      const assignedGroups = groupIds.filter((_, idx) => idx % teacherIds.length === teacherIdx);
      
      for (const groupId of assignedGroups) {
        // Создаём 2-3 пары в неделю для этого преподавателя
        const lessonsCount = 2 + Math.floor(Math.random() * 2);
        
        for (let i = 0; i < lessonsCount; i++) {
          const day = 1 + Math.floor(Math.random() * 5); // Понедельник-пятница
          const timeSlotIdx = Math.floor(Math.random() * Math.min(4, timeSlots.length));
          const timeSlot = timeSlots[timeSlotIdx];
          const subjectId = subjectIds[Math.floor(Math.random() * subjectIds.length)];
          const room = rooms[Math.floor(Math.random() * rooms.length)];
          const lessonType = lessonTypes[Math.floor(Math.random() * lessonTypes.length)];
          const weekType = Math.random() < 0.7 ? 0 : (Math.random() < 0.5 ? 1 : 2); // 70% каждую неделю
          
          const lessonData = {
            subject_id: subjectId,
            group_id: groupId,
            teacher_id: teacherId,
            day_of_week: day,
            time_start: timeSlot.start,
            time_end: timeSlot.end,
            room: room,
            week_type: weekType,
            lesson_type: lessonType
          };
          
          const created = await createScheduleIfNotExists(lessonData);
          if (created) {
            scheduleCount++;
          } else {
            skippedCount++;
          }
        }
      }
    }
    
    console.log(`✅ Создано новых пар: ${scheduleCount}`);
    console.log(`⏭️  Пропущено существующих: ${skippedCount}\n`);

    // 5. Статистика
    console.log('📊 Статистика базы данных:');
    const usersStats = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE role = 'teacher') as teachers,
        COUNT(*) FILTER (WHERE role = 'student') as students,
        COUNT(*) FILTER (WHERE role = 'admin') as admins
      FROM users
    `);
    const groupsStats = await query('SELECT COUNT(*) as total FROM groups');
    const subjectsStats = await query('SELECT COUNT(*) as total FROM subjects');
    const scheduleStats = await query('SELECT COUNT(*) as total FROM schedule');
    
    console.log(`   • Преподавателей: ${usersStats.rows[0].teachers}`);
    console.log(`   • Студентов: ${usersStats.rows[0].students}`);
    console.log(`   • Администраторов: ${usersStats.rows[0].admins}`);
    console.log(`   • Групп: ${groupsStats.rows[0].total}`);
    console.log(`   • Предметов: ${subjectsStats.rows[0].total}`);
    console.log(`   • Пар в расписании: ${scheduleStats.rows[0].total}`);
    
    console.log('\n✨ Заполнение базы данных завершено успешно!\n');
    console.log('🔑 Пароли для преподавателей: teacher123\n');

  } catch (error) {
    console.error('❌ Ошибка при заполнении базы данных:', error);
    throw error;
  }
}

// Запуск скрипта
if (require.main === module) {
  fillDatabase()
    .then(() => {
      console.log('✅ Скрипт завершён успешно');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Ошибка выполнения скрипта:', error);
      process.exit(1);
    });
}

module.exports = { fillDatabase };

