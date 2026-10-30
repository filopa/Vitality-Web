import { NextResponse } from "next/server";
import { checkUsername } from "@/lib/server/username";

export async function POST(request) {
  try {
    const body = await request.json();
    const username = body.username;

    const result = await checkUsername({
      username,
      name: body.name,
      birthDate: body.birthDate,
    });

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    });
  } catch (error) {
    console.error("Username check error:", error);

    return NextResponse.json(
      { success: false, message: "Something went wrong." },
      { status: 500 },
    );
  }
}
