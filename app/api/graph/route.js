import { tool } from "@langchain/core/tools";
import { HumanMessage } from "@langchain/core/messages";
import { z } from "zod";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { StateGraph, StateGraphArgs } from "@langchain/langgraph";
import { MemorySaver, Annotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { NextResponse } from "next/server";
import dotenv from "dotenv";

dotenv.config();

export const CatFactSchema = z.object({
	fact: z.string(),
	length: z.number(),
});

export async function GET(req) {
	try {
		const GraphState = Annotation.Root({
			messages: Annotation({
				reducer: (x, y) => x.concat(y),
			}),
		});

		const search = new TavilySearchResults({
			maxResults: 2,
		});

		const catTool = tool(
			async () => {
				try {
					const res = await fetch("https://catfact.ninja/fact");
					const data = await res.json();
					const parsedData = CatFactSchema.parse(data);
					return parsedData.fact;
				} catch (error) {
					console.error("Error fetching cat fact:", error);
					return "An error occurred while fetching the cat fact.";
				}
			},
			{
				name: "cat",
				description: "Get a random cat fact",
			},
		);

		const tools = [search, catTool];
		const toolNode = new ToolNode(tools);

		const model = new ChatGoogleGenerativeAI({
			model: "gemini-2.5-flash",
			maxOutputTokens: 2048,
			apiKey: process.env.GOOGLE_API_KEY,
		}).bindTools(tools);

		//when it stop
		function shouldContinue(state) {
			const messages = state.messages;
			const lastMessage = messages[messages.length - 1];

			if (lastMessage.tool_calls?.length) {
				return "tools";
			}
			return "__end__";
		}

		async function callModel(state) {
			const messages = state.messages;
			const response = await model.invoke(messages);

			return { messages: [response] };
		}

		const workflow = new StateGraph(GraphState)
			.addNode("agent", callModel)
			.addNode("tools", toolNode)
			.addEdge("__start__", "agent")
			.addConditionalEdges("agent", shouldContinue)
			.addEdge("tools", "agent");

		const checkpointer = new MemorySaver();

		const app = workflow.compile({ checkpointer });

		const finalState = await app.invoke(
			{
				messages: [
					new HumanMessage(
						"who is winning gold olympics 2024. Also provide me with a random cat fact",
					),
				],
			},
			{ configurable: { thread_id: "43" } },
		);

		return NextResponse.json({
			response: {
				running: finalState,
				final: finalState.messages[finalState.messages.length - 1].content,
			},
		});
	} catch (error) {
		console.log(error);
		return NextResponse.json(error.message);
	}
}
