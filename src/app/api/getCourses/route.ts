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

    if (accessToken === "demo") {
      return Response.json({
        status: true,
        courses: [
          {
            course_id: "1412725",
            course_name: "資料結構 Data Structures",
            instructor_name: "王大明",
          },
          {
            course_id: "1413880",
            course_name: "作業系統 Operating Systems",
            instructor_name: "陳建宏",
          },
          {
            course_id: "1415901",
            course_name: "線性代數 Linear Algebra",
            instructor_name: "林美玲",
          },
          {
            course_id: "1416207",
            course_name: "計算機網路 Computer Networks",
            instructor_name: "黃俊傑",
          },
        ],
      });
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
