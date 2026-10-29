import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!(body.email && body.password)) {
      throw new Error("INVALID_BODY");
    }
    const req = await fetch("https://irs.zuvio.com.tw/app_v2/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36",
      },
      body: JSON.stringify({
        email: body.email,
        password: body.password,
        loginType: "email",
      }),
    });
    const res = await req.json();
    if (res.status === false) {
      throw new Error("INVALID_CREDENTIALS");
    }
    return Response.json({
      status: true,
      message: "Login successful",
      token: res.accessToken,
      userID: res.user_id,
      user: res.name,
      has_course: res.has_course,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error";
    return Response.json(
      { status: false, message },
      {
        status: 500,
      },
    );
  }
}
