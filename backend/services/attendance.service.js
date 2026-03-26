import { client } from "../config/redis.js";

// increment count for students
export async function updateStudentCounts(lectureId, studentIds) {
  const key = `lecture:${lectureId}`;

  const uniqueStudents = [...new Set(studentIds)];
  console.log("[REDIS] updateStudentCounts key:", key, "students:", uniqueStudents);
  console.log("[REDIS] client.isOpen:", client.isOpen);

  const promises = uniqueStudents.map(id =>
    client.hIncrBy(key, String(id), 1)
  );

  await Promise.all(promises);

  const after = await client.hGetAll(key);
  console.log("[REDIS] after hGetAll:", after);

  await client.expire(key, 7200); // 2 hours
}

// get all counts
export async function getLectureCounts(lectureId) {
  const key = `lecture:${lectureId}`;
  return await client.hGetAll(key);
}

// delete lecture data
export async function clearLecture(lectureId) {
  const key = `lecture:${lectureId}`;
  await client.del(key);
}