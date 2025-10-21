import { NextRequest, NextResponse } from "next/server";
import { fetchRemoteData } from "@/lib/api-utils";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const body = await request.json();

    // 调用远程API进行密码修改
    const response = await fetchRemoteData({
      endpoint: `/users/${username}/password`,
      method: "PATCH",
      body: {
        currentPassword: body.currentPassword,
        newPassword: body.newPassword,
      },
    });

    if (!response.success) {
      return NextResponse.json(
        { message: response.error || "密码修改失败" },
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