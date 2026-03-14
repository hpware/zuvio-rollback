import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, accessToken, rollcall_id, device, lat, lng } = body;

    if (
      !user_id ||
      !accessToken ||
      !rollcall_id ||
      !device ||
      lat === undefined ||
      lng === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const response = await fetch(
      "https://irs.zuvio.com.tw/app_v2/makeRollcall",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id,
          accessToken,
          rollcall_id,
          device,
          lat,
          lng,
        }),
      },
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to make rollcall" },
      { status: 500 },
    );
  }
}
