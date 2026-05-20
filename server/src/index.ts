import express from "express";
import cors from "cors";
import teachersRouter from './routes/teachers';
import coursesRouter from './routes/courses';
import lessonsRouter from './routes/lessons';
import statsRouter from './routes/stats';

const app = express();
const port = process.env.PORT || 9091;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check
app.get('/api/v1/health', (req, res) => {
  console.log('Health check success');
  res.status(200).json({ status: 'ok' });
});

// Routes - 静态路由优先，动态路由在后
app.use('/api/v1/teachers', teachersRouter);
app.use('/api/v1/courses', coursesRouter);
app.use('/api/v1/lessons', lessonsRouter);
app.use('/api/v1/stats', statsRouter);

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}/`);
});
