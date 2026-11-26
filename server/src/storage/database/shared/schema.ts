import { sql } from "drizzle-orm";
import { pgTable, varchar, timestamp, integer, serial, index, numeric as pgNumeric } from "drizzle-orm/pg-core";
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
    // 额外课时（赠送/调整，可为小数）：实际总课时 = total_lessons + bonus_lessons
    bonus_lessons: pgNumeric("bonus_lessons", { precision: 10, scale: 2 }).notNull().default("0"),
    teacher_id: integer("teacher_id").references(() => teachers.id),
    start_date: varchar("start_date", { length: 20 }),
    created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  },
  (table) => [
    index("course_packages_teacher_idx").on(table.teacher_id),
  ]
);

// 课程包课时调整记录表（记录每次总课时的变更原因与数额）
export const course_package_adjustments = pgTable(
  "course_package_adjustments",
  {
    id: serial().primaryKey(),
    course_package_id: integer("course_package_id").notNull().references(() => course_packages.id, { onDelete: "cascade" }),
    change_amount: pgNumeric("change_amount", { precision: 10, scale: 2 }).notNull(),
    reason: varchar("reason", { length: 500 }),
    created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  },
  (table) => [
    index("course_package_adjustments_pkg_idx").on(table.course_package_id),
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
const { createInsertSchema: createAdjustmentInsertSchema } = createSchemaFactory({ coerce: { date: true } });

export const insertTeacherSchema = createTeacherInsertSchema(teachers).pick({ name: true, phone: true, remark: true });
export const insertCoursePackageSchema = createCoursePackageInsertSchema(course_packages).pick({ name: true, total_lessons: true, bonus_lessons: true, teacher_id: true, start_date: true });
export const insertLessonRecordSchema = createLessonRecordInsertSchema(lesson_records).pick({ course_package_id: true, teacher_id: true, lesson_date: true, duration: true, remark: true, confirmed_by: true });
export const insertAdjustmentSchema = createAdjustmentInsertSchema(course_package_adjustments).pick({ course_package_id: true, change_amount: true, reason: true });

export type Teacher = typeof teachers.$inferSelect;
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;
export type CoursePackage = typeof course_packages.$inferSelect;
export type InsertCoursePackage = z.infer<typeof insertCoursePackageSchema>;
export type LessonRecord = typeof lesson_records.$inferSelect;
export type InsertLessonRecord = z.infer<typeof insertLessonRecordSchema>;
export type CoursePackageAdjustment = typeof course_package_adjustments.$inferSelect;
export type InsertCoursePackageAdjustment = z.infer<typeof insertAdjustmentSchema>;
