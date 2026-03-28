# Window-Based Attendance System

## Overview

This upgrade transforms the face-recognition attendance system from frame-based counting to a robust window-based architecture with better accuracy, scalability, and fault tolerance.

## Architecture Changes

### 🎯 Core Concept
- **3-second non-overlapping time windows**
- Each window produces one present/absent decision per student
- Final attendance based on percentage of windows where student was present

### 📊 New Logic Flow
1. **Python Service**: Collects face recognition data per 3-second window
2. **Backend API**: Processes window payloads with idempotency checks
3. **Redis Storage**: Temporary window-based data with TTL
4. **Scheduler**: Calculates final attendance using presence ratios

## Key Improvements

### ✅ Accuracy
- **Presence Ratio**: Student must be present in ≥30% of frames within a window
- **Attendance Ratio**: Student must be present in ≥60% of total windows
- **Consistent Timing**: Fixed 3-second windows eliminate timing inconsistencies

### ✅ Fault Tolerance
- **Idempotency**: Duplicate window requests are ignored
- **Redis TTL**: Automatic cleanup after 2 hours
- **Safe Transactions**: Database operations are atomic
- **Graceful Degradation**: System continues if individual components fail

### ✅ Scalability
- **No Frame-Level DB Writes**: Redis handles short-term aggregation
- **Efficient Storage**: Window-based keys with automatic expiration
- **Batch Processing**: SQL operations use bulk inserts

## Implementation Details

### Python Changes (`came/main.py`)
```python
# New window-based tracking
window_start_time = time.time()
window_id = 0
window_student_counts = defaultdict(int)
total_frames_in_window = 0

# Window payload structure
{
  "class_id": "X",
  "window_id": 12,
  "students": [
    { "roll_no": "101", "count": 45 },
    { "roll_no": "102", "count": 10 }
  ],
  "total_frames": 90
}
```

### Backend Changes

#### Controller (`attendance.controller.js`)
- Validates window payload structure
- Handles idempotency via service layer
- Maintains backward compatibility

#### Service (`attendance.service.js`)
- **New Functions**:
  - `processWindowData()`: Main window processing
  - `getAllWindowData()`: Retrieve all window data
  - `calculateAttendanceFromWindows()`: Final attendance calculation
  - `storeWindowResults()`: Optional SQL storage for analytics

#### Scheduler (`finalize.scheduler.js`)
- Uses window-based calculation instead of static thresholds
- Detailed logging of attendance ratios
- Enhanced error handling and reporting

### Redis Schema Changes

#### Old Schema:
```
lecture:{lectureId} → { studentId: count }
```

#### New Schema:
```
lecture:{lectureId}:window:{windowId} → { studentId: frame_count }
lecture:{lectureId}:processed_windows → SET(window_ids)
```

### SQL Schema Addition

New table for detailed analytics:
```sql
CREATE TABLE window_attendance (
    lecture_id INT NOT NULL,
    student_id INT NOT NULL,
    window_id INT NOT NULL,
    status TINYINT NOT NULL,
    frame_count INT DEFAULT 0,
    total_frames INT DEFAULT 0,
    presence_ratio DECIMAL(5,4) DEFAULT 0.0000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (lecture_id, student_id, window_id)
);
```

## Configuration

### Thresholds
- **Window Presence Threshold**: 30% (student present in ≥30% of frames)
- **Final Attendance Threshold**: 60% (student present in ≥60% of windows)
- **Window Duration**: 3 seconds
- **TTL**: 2 hours for all Redis keys

### Environment Variables
```bash
# Existing variables remain the same
CLASS_ID=your_class_id
CAM_INDEX=0
MONGO_URI=your_mongo_uri
MONGO_DB_NAME=ClassMonitor
```

## Deployment Steps

### 1. Update SQL Schema
```bash
mysql -u username -p database_name < backend/migrations/create_window_attendance_table.sql
```

### 2. Restart Backend Services
```bash
# Stop existing services
npm stop

# Start updated services
npm start
```

### 3. Update Python Service
```bash
cd came
python main.py
```

### 4. Verify System
- Check logs for window processing messages
- Monitor Redis keys: `lecture:*:window:*`
- Verify attendance calculations in scheduler logs

## Monitoring & Debugging

### Key Log Messages
- `[WINDOW] Window X - Total frames: Y, Students: Z`
- `[SERVICE] Window X processed successfully`
- `[SERVICE] Window X already processed, skipping`
- `[SCHED] Student 101: present=5/8 (62.5%) -> PRESENT`

### Redis Monitoring
```bash
# View window keys
redis-cli KEYS "lecture:*:window:*"

# View processed windows
redis-cli SMEMBERS "lecture:123:processed_windows"

# View window data
redis-cli HGETALL "lecture:123:window:5"
```

### SQL Queries
```sql
-- View window attendance details
SELECT * FROM window_attendance WHERE lecture_id = 123;

-- View attendance summary
SELECT 
    student_id,
    COUNT(*) as total_windows,
    SUM(status) as present_windows,
    ROUND(SUM(status) / COUNT(*) * 100, 2) as attendance_percentage
FROM window_attendance 
WHERE lecture_id = 123
GROUP BY student_id;
```

## Edge Cases Handled

### ✅ No Faces Detected
- Empty window payload still sent
- System continues processing next window

### ✅ Duplicate API Calls
- Idempotency check prevents double processing
- Duplicate windows logged and ignored

### ✅ Redis Restart
- System handles missing keys gracefully
- No crash on Redis connection issues

### ✅ Partial Data
- Attendance calculated with available windows
- Missing windows don't break final calculation

## Backward Compatibility

- ✅ Existing `/attendance/frame-result` endpoint maintained
- ✅ Same lecture start/stop flow
- ✅ Legacy functions available for gradual migration
- ✅ No breaking changes to existing APIs

## Performance Considerations

### Redis Usage
- Window keys expire automatically (2 hours)
- Efficient hash storage for student counts
- Set operations for idempotency checks

### Database Usage
- No frame-level writes to SQL
- Bulk operations for window storage
- Indexed queries for analytics

### Memory Usage
- Python: Limited to 3-second window buffer
- Redis: Automatic cleanup prevents memory leaks
- Backend: Efficient data structures

## Troubleshooting

### Common Issues

#### 1. Windows Not Processing
**Check**: Redis connection and global lecture ID
```bash
redis-cli PING
# Check backend logs for activeLectureId
```

#### 2. Incorrect Attendance Calculations
**Check**: Threshold values and window data
```bash
redis-cli HGETALL "lecture:123:window:*"
# Verify presence_ratio calculations
```

#### 3. High Memory Usage
**Check**: TTL settings and key cleanup
```bash
redis-cli TTL "lecture:123:window:5"
# Monitor key expiration
```

### Performance Tuning

#### High Load Scenarios
- Increase Redis memory allocation
- Monitor window processing frequency
- Consider batch window processing for very high FPS

#### Accuracy Optimization
- Adjust presence threshold (0.3) based on testing
- Modify attendance threshold (0.6) for requirements
- Fine-tune window duration (3 seconds) for balance

## Migration Notes

### From Frame-Based System
1. **Backup**: Export existing attendance data
2. **Schema**: Run migration script
3. **Deploy**: Update all services
4. **Test**: Verify with sample lecture
5. **Monitor**: Check accuracy and performance

### Rollback Plan
- Keep frame-based functions as backup
- Database schema supports both systems
- Configuration can toggle between systems

## Future Enhancements

### Potential Improvements
- **Adaptive Windows**: Dynamic window sizes based on activity
- **Machine Learning**: Learn optimal thresholds per class
- **Real-time Dashboard**: Live window processing visualization
- **Analytics API**: Detailed window-based insights

### Scaling Considerations
- **Horizontal Scaling**: Multiple camera instances
- **Load Balancing**: Distribute window processing
- **Caching Layer**: Additional caching for analytics
- **Microservices**: Separate window processing service

---

## Support

For issues or questions:
1. Check logs for detailed error messages
2. Verify Redis connectivity and data
3. Monitor system resources during peak usage
4. Review threshold configurations for accuracy needs
