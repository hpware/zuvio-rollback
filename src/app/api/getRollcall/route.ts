import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const accessToken = searchParams.get("accessToken");
  const course_id = searchParams.get("course_id");
  const user_id = searchParams.get("user_id");

  if (!accessToken || !course_id || !user_id) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 },
    );
  }

  if (accessToken === "demo") {
    return NextResponse.json({
      status: true,
      data: {
        rollcall_id: "2048265",
        rollcall_name: "Week 9 點名",
      },
    });
  }

  try {
    const response = await fetch(
      `https://irs.zuvio.com.tw/app_v2/getRollcall?accessToken=${accessToken}&course_id=${course_id}&user_id=${user_id}`,
    );
    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch rollcall" },
      { status: 500 },
    );
  }
}
