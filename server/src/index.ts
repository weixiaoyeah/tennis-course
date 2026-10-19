import express from "express";
import cors from "cors";
import teachersRouter from './routes/teachers';
import coursesRouter from './routes/courses';
import lessonsRouter from './routes/lessons';
import statsRouter from './routes/stats';
import assistantRouter from './routes/assistant';
import calendarRouter from './routes/calendar';

const app = express();
const port: number = Number(process.env.PORT) || 9091;

// CORS 配置 - 允许前端访问
app.use(cors({
  origin: ['http://115.190.216.16:3000', 'http://localhost:3000'],
  credentials: true
}));

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
app.use('/api/v1/assistant', assistantRouter);
app.use('/api/v1/calendar', calendarRouter);

app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening at http://0.0.0.0:${port}/`);
});
