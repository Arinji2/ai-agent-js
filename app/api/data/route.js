import { NextResponse } from "next/server";

const data = [
	{
		text: "I absolutely love this new product! Best purchase ever!",
		source: "twitter",
		timestamp: "2025-10-15T10:30:00Z",
	},
	{
		body: "Terrible customer service. Very disappointed with my experience.",
		platform: "reddit",
		timestamp: "2025-10-15T09:15:00Z",
	},
	{
		tweet: "The weather today is nice, nothing special though.",
		source: "twitter",
		timestamp: "2025-10-15T08:00:00Z",
	},
];
export async function GET() {
	return NextResponse.json(data);
}
