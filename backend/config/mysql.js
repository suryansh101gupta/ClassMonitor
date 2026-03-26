import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'new_password',
    database: 'attendance_system',
});

export default pool;