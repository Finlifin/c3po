"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { FormField } from "@/components/forms/FormField";
import { getCourse, updateCourse } from "@/lib/api/courses";
import type { Course } from "@/types/api";
import { ArrowLeft } from "lucide-react";

const courseSchema = z.object({
  name: z.string().max(128, "课程名称最多128个字符").optional(),
  semester: z.string().max(32, "学期最多32个字符").optional(),
  credit: z
        .number()
        .int("学分必须是整数")
        .positive("学分必须大于0")
        .max(10, "学分最多为10")
    .optional(),
  enrollLimit: z
        .number()
        .int("选课上限必须是整数")
        .positive("选课上限必须大于0")
    .optional(),
});

type CourseFormData = z.infer<typeof courseSchema>;

export default function EditCoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: "",
      semester: "",
      credit: undefined,
      enrollLimit: undefined,
    },
  });

  useEffect(() => {
    const loadCourse = async () => {
      try {
        const courseData = await getCourse(courseId);
        setCourse(courseData);
        form.reset({
          name: courseData.name,
          semester: courseData.semester || "",
          credit: courseData.credit || undefined,
          enrollLimit: courseData.enrollLimit || undefined,
        });
      } catch (error) {
        console.error("Failed to load course:", error);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      loadCourse();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const handleSubmit = async (data: CourseFormData) => {
    setSubmitting(true);
    try {
      // Transform empty strings to undefined
      const courseData = {
        name: data.name?.trim() || undefined,
        semester: data.semester?.trim() || undefined,
        credit: data.credit || undefined,
        enrollLimit: data.enrollLimit || undefined,
      };

      await updateCourse(courseId, courseData);
      router.push(`/courses/${courseId}`);
    } catch (error) {
      console.error("Failed to update course:", error);
      // TODO: Show error toast
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/courses/${courseId}`);
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="p-6">
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            <p className="mt-4 text-gray-600">加载中...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!course) {
    return (
      <AuthGuard>
        <div className="p-6">
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500">课程不存在</p>
            <button
              onClick={() => router.push("/courses")}
              className="mt-4 text-red-600 hover:text-red-700"
            >
              返回课程列表
            </button>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleCancel}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">编辑课程</h1>
            <p className="text-gray-600 mt-1">{course.name}</p>
          </div>
        </div>

        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <FormField
              name="name"
              label="课程名称"
              placeholder="请输入课程名称"
            />

            <FormField
              name="semester"
              label="学期"
              placeholder="例如：2024春季学期"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="credit"
                label="学分"
                type="number"
                placeholder="请输入学分（1-10）"
                options={{
                  valueAsNumber: true,
                }}
              />

              <FormField
                name="enrollLimit"
                label="选课上限"
                type="number"
                placeholder="请输入选课人数上限"
                options={{
                  valueAsNumber: true,
                }}
              />
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "保存中..." : "保存更改"}
              </button>
            </div>
          </form>
        </FormProvider>
      </div>
    </AuthGuard>
  );
}

