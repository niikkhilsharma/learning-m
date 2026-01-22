import { NextResponse } from "next/server";
import * as z from "zod";
import axios, { AxiosError } from "axios";
import { JSDOM } from "jsdom";

const websiteUrlSchema = z.object({
  websiteUrl: z.string().url(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const websiteUrl = searchParams.get("websiteUrl");

  try {
    const validatedWebsiteUrl = websiteUrlSchema.parse({ websiteUrl });
    const { data } = await axios.get(validatedWebsiteUrl.websiteUrl);

    // Dynamically import JSDOM
    const { JSDOM } = await import("jsdom");
    const dom = new JSDOM(data);
    const document = dom.window.document;

    const metadata = {
      title: document.querySelector("title")?.textContent,
      description: document.querySelector('meta[name="description"]')?.getAttribute("content"),
      ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute("content"),
    };

    return NextResponse.json({ metadata, websiteUrl }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid website URL", details: error.issues.map((issue) => issue.message).join(", ") },
        { status: 400 }
      );
    }
    if (error instanceof AxiosError) {
      return NextResponse.json({ error: "Failed to get website data", details: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Failed to get website data", details: error }, { status: 500 });
  }
}
