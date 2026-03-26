<<<<<<< HEAD
# ClassMonitor: Event-Driven Attendance System

A high-performance, distributed attendance monitoring system built with event-driven microservices architecture, leveraging real-time face recognition, Redis caching, and cloud storage for scalable automated student tracking.

## System Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[React Web App]
        B[React Webcam Component]
    end
    
    subgraph "API Gateway"
        C[Node.js/Express Server]
        D[JWT Auth Middleware]
        E[Redis Cache Layer]
    end
    
    subgraph "Data Layer"
        F[MongoDB Primary]
        G[Redis Cache]
        H[AWS S3 Storage]
        I[MySQL Structured Data]
    end
    
    subgraph "ML Processing Layer"
        J[Python Face Service]
        K[Change Stream Listener]
        L[Face Encoder]
        M[S3 Image Processor]
    end
    
    subgraph "Background Services"
        N[Lecture Scheduler]
        O[Attendance Finalizer]
    end
    
    A --> C
    B --> C
    C --> D
    D --> E
    E --> F
    C --> H
    F --> K
    K --> J
    J --> L
    J --> M
    M --> H
    J --> F
    C --> I
    N --> F
    N --> I
    O --> F
    O --> I
```

## Performance Engineering

### Load Testing Results (k6)

| Metric | Target | Before Optimization | After Redis Caching | Improvement |
|--------|--------|-------------------|-------------------|-------------|
| **Auth p95 Latency** | <850ms | 10,459ms | 3,349ms | 68% reduction |
| **DB Read p95 Latency** | <450ms | 5,312ms | 1,547ms | 71% reduction |
| **DB Write p95 Latency** | <650ms | 8,163ms | 3,039ms | 63% reduction |
| **Error Rate** | <3% | 51.84% | 27.37% | 47% reduction |
| **HTTP p95 Latency** | <550ms | 8.55s | 3.06s | 64% reduction |

### Test Configuration
- **Concurrent Users**: 100 VUs with 7-stage ramp-up
- **Test Duration**: 5m 8s sustained load
- **Unique Users**: 10,000 unique indices per VU for collision prevention
- **Custom Metrics**: Auth, DB Read, DB Write latencies tracked separately

## Technical Deep-Dive

### Event-Driven ML Pipeline

The Python Face Service operates as an independent microservice that responds to MongoDB change streams:

**Change Stream Listener Logic:**
```python
# Monitors user collection for photo updates
pipeline = [{"$match": {"operationType": "update"}}]
# Reacts only to photoUrl, photoVersion, or s3key changes
# Filters for photoUploaded=true state
# Yields full documents for processing
```

**Idempotent Update Semantics:**
- Uses `photoVersion` field to prevent race conditions during re-uploads
- Implements deduplication with `(user_id, photo_version)` tuples
- Atomic MongoDB updates with version matching to ensure data consistency

### ML Validation Rules

**Face Encoding Pipeline:**
- **Single-Face Constraint**: Rejects images with 0 or >1 faces detected
- **128-D Embedding**: Generates standardized face vectors using face_recognition library
- **Error Handling**: Comprehensive exception handling for ML failures
- **Validation**: Strict input validation for image bytes vs file paths

**Processing Workflow:**
1. S3 image download → Local temporary storage
2. Face detection and validation
3. 128-dimensional embedding generation
4. Atomic MongoDB update with version checking
5. Failure state persistence for retry logic

### Database Strategy

**Polyglot Persistence Architecture:**
- **MongoDB**: Document store for user profiles, face encodings, and unstructured data
- **MySQL**: Relational database for structured attendance records and teacher assignments
- **Redis**: In-memory caching for response acceleration
- **Cross-Database Transactions**: Atomic operations with rollback mechanisms

**MongoDB Optimization:**
- **Connection Pooling**: `maxPoolSize: 400` for sustained concurrent connections
- **Compound Indexing**: 
  ```javascript
  userSchema.index({ faceProcessed: 1, photoUploaded: 1 });
  userSchema.index({ name: "text", email: "text" });
  ```
- **Change Streams**: Real-time event propagation to ML service

**MySQL Integration:**
- **Connection Pool**: `connectionLimit: 100` with unlimited queue for high concurrency
- **Structured Data**: Teacher assignments, attendance records, class schedules
- **Transactional Integrity**: Automatic MongoDB rollback on MySQL failures
- **Dual-Write Pattern**: Synchronous writes to both databases with error handling

**Redis Caching Layer:**
- **Response Interception**: Middleware automatically caches successful responses
- **TTL Management**: Configurable cache expiration (60s default)
- **Cache Invalidation**: Automatic invalidation on create/update/delete operations
- **Fallback Strategy**: Graceful degradation when Redis unavailable

### Security Architecture

**JWT Implementation:**
- HTTP-only cookies for token storage
- Role-based access control (Admin, Teacher, Student)
- Token blacklisting for secure logout
- CORS configuration for frontend integration

**AWS S3 Integration:**
- Presigned URLs for secure image uploads
- Direct S3 storage bypassing application server
- Image compression before upload
- Secure key extraction from S3 URLs

## Installation & Environment

### Backend (Node.js/Express)
```bash
cd backend
npm install
cp .env.example .env
# Configure MONGODB_URI, REDIS_URL, AWS credentials
npm run dev
```

### Face Service (Python/ML)
```bash
cd face-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Configure MONGO_URI, AWS credentials
python change_stream_listener.py
```

### Frontend (React)
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

**Backend (.env):**
```
MONGODB_URI=mongodb://localhost:27017
REDIS_URL=redis://127.0.0.1:6379
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=attendance_system
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=classmonitor-uploads
JWT_SECRET=your_jwt_secret
PORT=4000
```

**Face Service (.env):**
```
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=ClassMonitor
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=classmonitor-uploads
DOWNLOAD_DIR=downloads
LOG_LEVEL=INFO
```

## Technology Stack

**Backend:**
- Node.js 18+, Express.js 5.x
- MongoDB 6.x with Change Streams
- MySQL 8.x for structured data
- Redis 7.x for caching
- JWT authentication with HTTP-only cookies
- AWS SDK v3 for S3 integration

**ML Processing:**
- Python 3.10+
- face_recognition library for 128-D embeddings
- pymongo for MongoDB operations
- boto3 for AWS S3 integration
- Event-driven architecture with change streams

**Frontend:**
- React 19.x with Vite
- TailwindCSS 4.x
- React Webcam for face capture
- Axios for API communication
- React Router for navigation

**DevOps & Testing:**
- k6 for load testing
- Docker containerization support
- Node-cron for scheduled tasks
- Comprehensive error handling and logging

## Performance Characteristics

- **Concurrent Users**: Validated for 100+ simultaneous users
- **Response Times**: p95 latency <3.5s after optimization
- **Cache Hit Ratio**: 95%+ for read-heavy operations
- **Error Rate**: <30% under sustained load (ongoing optimization)
- **Throughput**: 138+ requests/second sustained
- **ML Processing**: Sub-second face encoding for single-face images

## Scalability Features

- **Horizontal Scaling**: Stateless API design with Redis session storage
- **Polyglot Persistence**: MongoDB for documents, MySQL for relations, Redis for caching
- **Database Sharding Ready**: MongoDB architecture supports shard key configuration
- **Connection Pooling**: MongoDB (400) + MySQL (100) pools for high concurrency
- **Microservice Decoupling**: Independent Python ML service can scale separately
- **Caching Strategy**: Multi-layer caching with Redis for database and response caching
- **Cloud Storage**: AWS S3 for unlimited image storage with CDN capabilities
- **Cross-Database Transactions**: Atomic operations with automatic rollback mechanisms

This system demonstrates production-grade engineering with event-driven architecture, comprehensive performance optimization, and robust error handling suitable for enterprise deployment.
=======
## ClassMonitor
>>>>>>> fae32d8 (Initial commit - teacher dashboard)
