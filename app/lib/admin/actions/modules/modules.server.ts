import { data, redirect } from "react-router";
import { and, desc, eq, max } from "drizzle-orm";
import db from "~/db/index.server";
import { coursesTable, modulesTable } from "~/db/schema";
import { isAdminLoggedIn } from "~/lib/auth/auth.server";
import { titleToSlug } from "~/lib/utils";
import { createModuleSchema, editModuleSchema } from "~/lib/zod-schemas/module";
import { getModuleBySlug } from "../../data-access/modules/modules.server";

export async function handleCreateModule(request: Request, formData: FormData) {
    try {
        const rawData = {
            name: formData.get("name") as string,
            description: formData.get("description") as string,
            courseSlug: formData.get("courseSlug") as string,
        };

        const validatedData = createModuleSchema.parse(rawData);

        // Get the course by slug to get the courseId
        const [course] = await db
            .select()
            .from(coursesTable)
            .where(eq(coursesTable.slug, validatedData.courseSlug))
            .limit(1);

        if (!course) {
            return data(
                { success: false, message: "Course not found" },
                { status: 404 }
            );
        }

        // Generate slug from name
        const slug = validatedData.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

        // Check if module with this slug already exists for this course
        const existingModule = await db
            .select()
            .from(modulesTable)
            .where(
                and(
                    eq(modulesTable.slug, slug),
                    eq(modulesTable.courseId, course.id)
                )
            )
            .limit(1);

        if (existingModule.length > 0) {
            return data(
                { success: false, message: "A module with this name already exists" },
                { status: 400 }
            );
        }

        // get the next order index
        const [nextOrderIndex] = await db
            .select({ max: max(modulesTable.orderIndex) })
            .from(modulesTable)
            .where(eq(modulesTable.courseId, course.id))
            .limit(1);

        const orderIndex = nextOrderIndex ? parseInt(nextOrderIndex.max || "0") + 1 : 1;

        // Create the module
        const [newModule] = await db
            .insert(modulesTable)
            .values({
                name: validatedData.name,
                slug,
                courseId: course.id,
                orderIndex: orderIndex.toString(),
                description: validatedData.description,
            })
            .returning();

        return data({
            success: true,
            message: "Module created successfully",
            moduleSlug: newModule.slug,
        });
    } catch (error) {
        console.error("Create module error:", error);
        return data(
            { success: false, message: "Failed to create module" },
            { status: 500 }
        );
    }
}

export async function handleDeleteModule(request: Request, formData: FormData) {
    const { isLoggedIn } = await isAdminLoggedIn(request);
    if (!isLoggedIn) {
        throw redirect("/admin/login");
    }

    const moduleSlug = formData.get("moduleSlug") as string;
    const courseSlug = formData.get("courseSlug") as string;

    if (!moduleSlug || !courseSlug) {
        return data(
            { success: false, message: "Module and course information is required" },
            { status: 400 },
        );
    }

    try {
        // Get the module to verify it exists and get its ID
        const { success: moduleResponse, module } = await getModuleBySlug(
            request,
            moduleSlug,
            courseSlug,
        );

        if (!moduleResponse || !module) {
            return data(
                { success: false, message: "Module not found" },
                { status: 404 },
            );
        }
        await db
            .delete(modulesTable)
            .where(eq(modulesTable.id, module.id));

        return data(
            { success: true, message: "Module deleted successfully" },
            { status: 200 },
        );
    } catch (error) {
        console.error("Delete module error:", error);
        return data(
            { success: false, message: "Failed to delete module" },
            { status: 500 }
        );
    }
}

export async function handleEditModule(request: Request, formData: FormData) {
    // auth check
    const { isLoggedIn } = await isAdminLoggedIn(request);

    if (!isLoggedIn) {
        throw redirect("/admin/login");
    }

    const unvalidatedFields = editModuleSchema.safeParse(
        Object.fromEntries(formData),
    );

    if (!unvalidatedFields.success) {
        return data(
            { success: false, message: "Invalid form data" },
            { status: 400 },
        );
    }

    const { courseSlug, moduleSlug, name, description } = unvalidatedFields.data;

    try {
        // Get the course by slug to get the courseId
        const course = await db
            .select()
            .from(coursesTable)
            .where(eq(coursesTable.slug, courseSlug))
            .limit(1);

        if (!course.length) {
            return data(
                { success: false, message: "Course not found" },
                { status: 404 }
            );
        }

        // Check if module exists
        const existingModule = await db
            .select()
            .from(modulesTable)
            .where(
                and(
                    eq(modulesTable.slug, moduleSlug),
                    eq(modulesTable.courseId, course[0].id)
                )
            )
            .limit(1);

        if (!existingModule.length) {
            return data(
                { success: false, message: "Module not found" },
                { status: 404 }
            );
        }

        // Generate new slug from name
        const newSlug = titleToSlug(name);

        // Check if new slug conflicts with other modules (unless it's the same module)
        if (newSlug !== moduleSlug) {
            const conflictingModule = await db
                .select()
                .from(modulesTable)
                .where(
                    and(
                        eq(modulesTable.slug, newSlug),
                        eq(modulesTable.courseId, course[0].id)
                    )
                )
                .limit(1);

            if (conflictingModule.length > 0) {
                return data(
                    { success: false, message: "A module with this name already exists" },
                    { status: 400 }
                );
            }
        }

        // Update the module
        const [updatedModule] = await db
            .update(modulesTable)
            .set({
                name,
                slug: newSlug,
                description,
            })
            .where(
                and(
                    eq(modulesTable.slug, moduleSlug),
                    eq(modulesTable.courseId, course[0].id)
                )
            )
            .returning({
                slug: modulesTable.slug,
            });

        if (!updatedModule) {
            return data(
                { success: false, message: "Failed to update module" },
                { status: 500 }
            );
        }

        return data(
            {
                success: true,
                message: "Module updated successfully",
                redirectTo: updatedModule.slug,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error updating module:", error);
        return data(
            {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "An unexpected error occurred",
            },
            { status: 500 }
        );
    }
}
