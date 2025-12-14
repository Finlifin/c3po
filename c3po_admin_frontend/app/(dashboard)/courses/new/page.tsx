"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { FormField } from "@/components/forms/FormField";
import { FormModal } from "@/components/ui/FormModal";
import { createCourse } from "@/lib/api/courses";
import { ArrowLeft } from "lucide-react";

const courseSchema = z.object({
  name: z
    .string()
    .min(1, "课程名称不能为空")
    .max(128, "课程名称最多128个字符"),
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
  teacherId: z.string().uuid("教师ID格式不正确").optional().or(z.literal("")),
});

type CourseFormData = z.infer<typeof courseSchema>;

export default function CreateCoursePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: "",
      semester: "",
      credit: undefined,
      enrollLimit: undefined,
      teacherId: "",
    },
  });

  const handleSubmit = async (data: CourseFormData) => {
    setLoading(true);
    try {
      // Transform empty strings to undefined
      const courseData = {
        name: data.name,
        semester: data.semester?.trim() || undefined,
        credit: data.credit || undefined,
        enrollLimit: data.enrollLimit || undefined,
        teacherId: data.teacherId?.trim() || undefined,
      };

      await createCourse(courseData);
      router.push("/courses");
    } catch (error) {
      console.error("Failed to create course:", error);
      // TODO: Show error toast
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/courses");
  };

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
            <h1 className="text-2xl font-bold text-gray-900">创建课程</h1>
            <p className="text-gray-600 mt-1">填写课程信息以创建新课程</p>
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
              required
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

            <FormField
              name="teacherId"
              label="教师ID"
              placeholder="请输入教师ID（可选，留空则使用当前用户）"
            />

            <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "创建中..." : "创建课程"}
              </button>
            </div>
          </form>
        </FormProvider>
      </div>
    </AuthGuard>
  );
}

