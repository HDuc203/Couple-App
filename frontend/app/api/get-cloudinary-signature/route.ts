import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get("folder") || "user_uploads";
    const timestamp = Math.floor(Date.now() / 1000);

    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

    if (!apiKey || !apiSecret || !cloudName) {
      return NextResponse.json(
        { error: "Cloudinary environment variables (CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME) are not fully configured on the server." },
        { status: 500 }
      );
    }

    // Cloudinary signature calculation:
    // Sort all signing parameters alphabetically, join with & (without spaces), and append the API Secret directly.
    const stringToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    
    // Hash stringToSign using SHA-1 and represent the output in hex
    const signature = crypto.createHash("sha1").update(stringToSign).digest("hex");

    return NextResponse.json({
      signature,
      timestamp,
      cloud_name: cloudName,
      api_key: apiKey,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate signature" },
      { status: 500 }
    );
  }
}
