import {
	boolean,
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

// AUTH RELATED

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").notNull(),
	image: text("image"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.$onUpdate(() => new Date()),
	role: text("role").notNull(),
	banned: boolean("banned"),
	banReason: text("ban_reason"),
	banExpires: timestamp("ban_expires"),
	phone: text("phone"),
});

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expires_at").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.$onUpdate(() => new Date()),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	impersonatedBy: text("impersonated_by"),
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.$onUpdate(() => new Date()),
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at"),
	updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

// BUSINESS LOGIC

export const agentsTable = pgTable(
	"agents",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		studentId: text("student_id").unique().notNull(),
		name: varchar("name", { length: 255 }).notNull(),
		email: varchar("email", { length: 255 }).notNull().unique(),
		phone: varchar("phone", { length: 255 }),
		isActivated: boolean("is_activated").notNull().default(true),
		teamLeaderId: uuid("team_leader_id").references(() => teamLeadersTable.id),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at")
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(t) => [
		index("student_email_index").on(t.email),
		index("student_id_index").on(t.studentId),
	],
);

export const teamLeadersTable = pgTable("team_leaders", {
	id: uuid("id").primaryKey().defaultRandom(),
	teamLeaderId: text("team_leader_id").unique().notNull(),
	name: varchar("name", { length: 255 }).notNull(),
	email: varchar("email", { length: 255 }).notNull().unique(),
	phone: varchar("phone", { length: 255 }),
	isActivated: boolean("is_activated").notNull().default(true),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const coursesTable = pgTable(
	"courses",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		name: varchar("name", { length: 255 }).notNull(),
		description: varchar("description", { length: 255 }).notNull(),
		thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
		isPublic: boolean("is_public").notNull().default(false),
		slug: varchar("slug", { length: 255 }).notNull(),
		orderIndex: text("order_index").notNull().default("0"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at")
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(t) => [
		index("course_name_index").on(t.name),
		index("course_slug_index").on(t.slug),
	],
);

export const modulesTable = pgTable(
	"modules",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		name: varchar("name", { length: 255 }).notNull(),
		description: varchar("description", { length: 255 }),
		slug: varchar("slug", { length: 255 }).notNull(),
		courseId: uuid("course_id")
			.references(() => coursesTable.id, { onDelete: "cascade" })
			.notNull(),
		orderIndex: text("order_index").notNull().default("0"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at")
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(t) => [
		index("module_name_index").on(t.name),
		index("module_slug_index").on(t.slug),
		index("module_course_id_index").on(t.courseId),
	],
);

export const lessonsTable = pgTable(
	"lessons",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		name: varchar("name", { length: 255 }).notNull(),
		description: varchar("description", { length: 255 }),
		videoUrl: varchar("video_url", { length: 255 }).notNull(),
		slug: varchar("slug", { length: 255 }).notNull(),
		moduleId: uuid("module_id")
			.references(() => modulesTable.id, { onDelete: "cascade" })
			.notNull(),
		orderIndex: text("order_index").notNull().default("0"),
		created_at: timestamp("created_at").notNull().defaultNow(),
		updated_at: timestamp("updated_at")
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(t) => [
		index("segment_name_index").on(t.name),
		index("segment_slug_index").on(t.slug),
		index("segment_module_id_index").on(t.moduleId),
	],
);

export const studentCoursesTable = pgTable(
	"student_courses",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		studentId: text("student_id").notNull().references(() => user.id, { onDelete: "cascade" }),
		courseId: uuid("course_id")
			.references(() => coursesTable.id, { onDelete: "cascade" })
			.notNull(),
		created_at: timestamp("created_at").notNull().defaultNow(),
		updated_at: timestamp("updated_at")
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(t) => [
		index("student_course_student_id_index").on(t.studentId),
		index("student_course_course_id_index").on(t.courseId),
	],
);

export const quizzesTable = pgTable("quizzes", {
	id: uuid("id").primaryKey().defaultRandom(),
	lessonId: uuid("lesson_id")
		.references(() => lessonsTable.id, { onDelete: "cascade" })
		.notNull(),
	questions: jsonb("questions").notNull().$type<
		{
			title: string;
			answers: string[];
			correctAnswerIndex: number;
		}[]
	>(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const completedQuizAssignmentsTable = pgTable(
	"completed_quiz_assignments",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		quizId: uuid("quiz_id")
			.references(() => quizzesTable.id, { onDelete: "cascade" })
			.notNull(),
		studentId: text("student_id"),
		lessonId: uuid("lesson_id")
			.references(() => lessonsTable.id, { onDelete: "cascade" })
			.notNull(),
		selectedAnswers: jsonb("selected_answers").$type<number[]>(),
		numberOfQuestions: integer("number_of_questions").notNull(),
		totalCorrectAnswers: integer("total_correct_answers").notNull(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
);

export const attachmentsTable = pgTable(
	"attachments",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		lessonId: uuid("lesson_id")
			.references(() => lessonsTable.id, { onDelete: "cascade" })
			.notNull(),
		fileName: varchar("file_name", { length: 255 }).notNull(),
		fileUrl: varchar("file_url", { length: 500 }).notNull(),
		fileExtension: varchar("file_extension", { length: 10 }).notNull(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(t) => [index("attachment_lesson_id_index").on(t.lessonId)],
);

// certificates (agents upon a course completion will have acess to a branded certificate)
export const certificatesTable = pgTable("certificates", {
	id: uuid("id").primaryKey().defaultRandom(),
	studentId: text("student_id").notNull(),
	courseId: uuid("course_id")
		.references(() => coursesTable.id, { onDelete: "cascade" })
		.notNull(),
	certificateUrl: varchar("certificate_url", { length: 500 }).notNull(),
	completedAt: timestamp("completed_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const leadCaptureTable = pgTable("lead_capture", {
	id: uuid("id").primaryKey().defaultRandom(),
	firstName: varchar("first_name", { length: 255 }).notNull(),
	lastName: varchar("last_name", { length: 255 }).notNull(),
	email: varchar("email", { length: 255 }).notNull(),
	phoneNumber: varchar("phone_number", { length: 255 }),
	stateOfResidence: varchar("state_of_residence", { length: 255 }),
	areYouOver18: boolean("are_you_over_18").notNull(),
	doYouHaveAnyFeloniesOrMisdemeanors: boolean("do_you_have_any_felonies_or_misdemeanors").notNull(),
	leadStatus: text("lead_status").notNull().default("pending"),
	reason: text("reason"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

// TYPES
export type Student = typeof agentsTable.$inferSelect;
export type Course = typeof coursesTable.$inferSelect;
export type Module = typeof modulesTable.$inferSelect;
export type Segment = typeof lessonsTable.$inferSelect;
export type StudentCourse = typeof studentCoursesTable.$inferSelect;
export type TeamLeader = typeof teamLeadersTable.$inferSelect;
export type Quiz = typeof quizzesTable.$inferSelect;
export type CompletedQuizAssignment =
	typeof completedQuizAssignmentsTable.$inferSelect;
export type Attachment = typeof attachmentsTable.$inferSelect;
export type Certificate = typeof certificatesTable.$inferSelect;
export type LeadCapture = typeof leadCaptureTable.$inferSelect;

// AUTH RELATED
export type User = typeof user.$inferSelect;
export type Session = typeof session.$inferSelect;
export type Account = typeof account.$inferSelect;
export type Verification = typeof verification.$inferSelect;
