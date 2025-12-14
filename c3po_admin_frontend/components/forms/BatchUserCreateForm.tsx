"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { FormField } from "./FormField";
import { Plus, Trash2 } from "lucide-react";

export function BatchUserCreateForm() {
  const { control, watch } = useFormContext<{
    users: Array<{
      username: string;
      email: string;
      password: string;
      role: "STUDENT" | "TEACHER" | "ADMIN";
      status?: "ACTIVE" | "LOCKED" | "DISABLED";
      statusReason?: string;
      studentProfile?: {
        studentNo: string;
        grade: string;
        major: string;
        className: string;
      };
      teacherProfile?: {
        teacherNo: string;
        department: string;
        title: string;
        subjects: string[];
      };
    }>;
  }>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "users",
  });

  const addUser = () => {
    append({
      username: "",
      email: "",
      password: "",
      role: "STUDENT",
      status: "ACTIVE",
      statusReason: "",
    });
  };

  return (
    <div className="space-y-6">
      {fields.map((field, index) => {
        const role = watch(`users.${index}.role`);
        const status = watch(`users.${index}.status`);

        return (
          <div key={field.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">用户 {index + 1}</h3>
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name={`users.${index}.username`}
                label="用户名"
                required
              />
              <FormField
                name={`users.${index}.email`}
                label="邮箱"
                type="email"
                required
              />
              <FormField
                name={`users.${index}.password`}
                label="密码"
                type="password"
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  角色 <span className="text-red-500">*</span>
                </label>
                <select
                  {...control.register(`users.${index}.role`)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="STUDENT">学生</option>
                  <option value="TEACHER">教师</option>
                  <option value="ADMIN">管理员</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
                <select
                  {...control.register(`users.${index}.status`)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="ACTIVE">正常</option>
                  <option value="LOCKED">锁定</option>
                  <option value="DISABLED">禁用</option>
                </select>
              </div>
              {status && status !== "ACTIVE" && (
                <FormField
                  name={`users.${index}.statusReason`}
                  label="状态原因"
                  required
                />
              )}
            </div>

            {/* 学生档案 */}
            {role === "STUDENT" && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">学生档案</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    name={`users.${index}.studentProfile.studentNo`}
                    label="学号"
                  />
                  <FormField
                    name={`users.${index}.studentProfile.grade`}
                    label="年级"
                  />
                  <FormField
                    name={`users.${index}.studentProfile.major`}
                    label="专业"
                  />
                  <FormField
                    name={`users.${index}.studentProfile.className`}
                    label="班级"
                  />
                </div>
              </div>
            )}

            {/* 教师档案 */}
            {role === "TEACHER" && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">教师档案</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    name={`users.${index}.teacherProfile.teacherNo`}
                    label="工号"
                  />
                  <FormField
                    name={`users.${index}.teacherProfile.department`}
                    label="院系"
                  />
                  <FormField
                    name={`users.${index}.teacherProfile.title`}
                    label="职称"
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={addUser}
        className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-red-500 hover:text-red-600 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        添加用户
      </button>
    </div>
  );
}

