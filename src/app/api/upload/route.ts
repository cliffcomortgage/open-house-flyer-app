import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

const USE_LOCAL = !process.env.STORAGE_PROVIDER || process.env.STORAGE_PROVIDER === "local";

async function saveLocally(
  buffer: Buffer,
  mimeType: string,
  folder: string
): Promise<string> {
  const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") || "bin";
  const filename = `${crypto.randomUUID()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), buffer);
  return `/uploads/${folder}/${filename}`;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "uploads";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    const allowedTypes = [
      "image/jpeg", "image/jpg", "image/png", "image/webp",
      "image/svg+xml", "image/gif",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (USE_LOCAL) {
      const publicUrl = await saveLocally(buffer, file.type, folder);
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      return NextResponse.json({
        publicUrl: `${baseUrl}${publicUrl}`,
        uploadUrl: null,
      });
    }

    // Cloud storage path
    const { getPresignedUploadUrl } = await import("@/lib/upload");
    const { url: uploadUrl, publicUrl } = await getPresignedUploadUrl(
      file.name,
      file.type,
      folder
    );

    // Upload to storage
    await fetch(uploadUrl, {
      method: "PUT",
      body: buffer,
      headers: { "Content-Type": file.type },
    });

    return NextResponse.json({ publicUrl, uploadUrl });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
