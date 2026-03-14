import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const accessToken = searchParams.get("accessToken");

    if (!userId || !accessToken) {
      return Response.json(
        { status: false, message: "Missing user_id or accessToken" },
        { status: 400 }
      );
    }

    const req = await fetch(
      `https://irs.zuvio.com.tw/course/listStudentCurrentCourses?user_id=${userId}&accessToken=${accessToken}`,
      {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36",
        },
      }
    );

    const res = await req.json();

    if (res.status === false) {
      return Response.json(
        { status: false, message: res.message || "Failed to fetch courses" },
        { status: 400 }
      );
    }

    return Response.json({
      status: true,
      message: "Courses fetched successfully",
      courses: res.courses || res,
    });
  } catch (e: any) {
    return Response.json(
      { status: false, message: e.message || "Internal server error" },
      { status: 500 }
    );
  }
}
