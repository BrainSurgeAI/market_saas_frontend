import { NextRequest, NextResponse } from "next/server";
import { fetchRemoteData } from "@/lib/api-utils";

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    // 调用远程API进行密码修改
    const response = await fetchRemoteData({
      endpoint: `/password/reset`,
      method: "PATCH",
      body: {
        currentPassword: body.currentPassword,
        newPassword: body.newPassword,
      },
    });

    if (!response.success) {
      let errorMessage = "密码修改失败";

      if (response.error) {
        // 尝试解析错误消息
        try {
          // 提取JSON部分
          const jsonMatch = response.error.match(/\{.*\}/);
          if (jsonMatch) {
            const errorData = JSON.parse(jsonMatch[0]);

            // 根据错误类型返回友好的中文消息
            if (errorData.message && errorData.message.includes("Invalid password format")) {
              errorMessage = "错误的密码格式";
            } else if (errorData.message && errorData.message.includes("current password")) {
              errorMessage = "当前密码错误";
            } else if (errorData.message && errorData.message.includes("new password")) {
              errorMessage = "新密码格式不正确";
            } else {
              errorMessage = errorData.message || "密码修改失败";
            }
          }
        } catch (parseError) {
          // 如果解析失败，使用原始错误消息
          console.warn("解析错误消息失败:", parseError);
          errorMessage = response.error;
        }
      }

      return NextResponse.json(
        { message: errorMessage },
        { status: response.status || 400 }
      );
    }

    return NextResponse.json(
      { message: "密码修改成功" },
      { status: 200 }
    );
  } catch (error) {
    console.error("密码修改失败", error);
    return NextResponse.json(
      { message: "服务器错误，请稍后再试" },
      { status: 500 }
    );
  }
} 