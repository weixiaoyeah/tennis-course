import { sql } from "drizzle-orm";
import { pgTable, varchar, timestamp, integer, serial, index } from "drizzle-orm/pg-core";
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

// 老师表
export const teachers = pgTable(
  "teachers",
  {
    id: serial().primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    remark: varchar("remark", { length: 500 }),
    created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  },
  (table) => [
    index("teachers_name_idx").on(table.name),
  ]
);

// 课程包表（购买的总课时）
export const course_packages = pgTable(
  "course_packages",
  {
    id: serial().primaryKey(),
    name: varchar("name", { length: 200 }).notNull(),
    total_lessons: integer("total_lessons").notNull().default(10),
    teacher_id: integer("teacher_id").references(() => teachers.id),
    start_date: varchar("start_date", { length: 20 }),
    created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  },
  (table) => [
    index("course_packages_teacher_idx").on(table.teacher_id),
  ]
);

// 上课记录表
export const lesson_records = pgTable(
  "lesson_records",
  {
    id: serial().primaryKey(),
    course_package_id: integer("course_package_id").notNull().references(() => course_packages.id, { onDelete: "cascade" }),
    teacher_id: integer("teacher_id").references(() => teachers.id),
    lesson_date: varchar("lesson_date", { length: 30 }).notNull(),
    duration: integer("duration").notNull().default(1),
    remark: varchar("remark", { length: 500 }),
    confirmed_by: varchar("confirmed_by", { length: 20 }),
    created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  },
  (table) => [
    index("lesson_records_course_idx").on(table.course_package_id),
    index("lesson_records_teacher_idx").on(table.teacher_id),
    index("lesson_records_date_idx").on(table.lesson_date),
  ]
);

// Schema 导出
const { createInsertSchema: createTeacherInsertSchema } = createSchemaFactory({ coerce: { date: true } });
const { createInsertSchema: createCoursePackageInsertSchema } = createSchemaFactory({ coerce: { date: true } });
const { createInsertSchema: createLessonRecordInsertSchema } = createSchemaFactory({ coerce: { date: true } });

export const insertTeacherSchema = createTeacherInsertSchema(teachers).pick({ name: true, phone: true, remark: true });
export const insertCoursePackageSchema = createCoursePackageInsertSchema(course_packages).pick({ name: true, total_lessons: true, teacher_id: true, start_date: true });
export const insertLessonRecordSchema = createLessonRecordInsertSchema(lesson_records).pick({ course_package_id: true, teacher_id: true, lesson_date: true, duration: true, remark: true, confirmed_by: true });

export type Teacher = typeof teachers.$inferSelect;
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;
export type CoursePackage = typeof course_packages.$inferSelect;
export type InsertCoursePackage = z.infer<typeof insertCoursePackageSchema>;
export type LessonRecord = typeof lesson_records.$inferSelect;
export type InsertLessonRecord = z.infer<typeof insertLessonRecordSchema>;
