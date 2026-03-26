import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'new_password',
    database: 'attendance_system',
<<<<<<< HEAD
    waitForConnections: true,  // wait if no free connections
    connectionLimit: 100,       // increase from default 10
    queueLimit: 0              // unlimited queued requests
=======
>>>>>>> fae32d8 (Initial commit - teacher dashboard)
});

export default pool;