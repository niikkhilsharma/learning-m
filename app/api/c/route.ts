import { NextResponse } from "next/server";
import * as z from "zod";
import axios, { AxiosError } from "axios";
import cheerio from "cheerio"; // Import cheerio

const websiteUrlSchema = z.object({
  websiteUrl: z.string().url(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const websiteUrl = searchParams.get("websiteUrl");

  try {
    const validatedWebsiteUrl = websiteUrlSchema.parse({ websiteUrl });
    const { data } = await axios.get(validatedWebsiteUrl.websiteUrl);

    // Load the HTML data with cheerio
    const $ = cheerio.load(data);

    // Extract metadata using cheerio's jQuery-like syntax
    const metadata = {
      title: $("title").text(),
      description: $('meta[name="description"]').attr("content"),
      ogImage: $('meta[property="og:image"]').attr("content"),
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
