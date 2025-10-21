import { fetchRemoteData } from "@/lib/api-utils";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {

    const response = await fetchRemoteData({
      endpoint: "/processing_fees",
      method: "GET",
      tags: ["processing_fees"],
      revalidate: 3600,
      needToken: true,
    })

    if (!response.success) {
      return NextResponse.json(
        {
          code: 500,
          message: "服务器内部错误",
          data: null,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("获取加工费用数据出错:", error);

    return NextResponse.json(
      {
        code: 500,
        message: "服务器内部错误",
        data: null,
      },
      { status: 500 }
    );
  }
} 