import Link from "next/link";

export default function Home() {
	return (
		<div className="w-full h-[100svh] flex flex-row items-center justify-between">
			<Link href="/api/agent" target="_blank">
				<p className="text-4xl font-bold text-white">Langchain Agent</p>
			</Link>
			<Link href="/api/graph" target="_blank">
				<p className="text-4xl font-bold text-white">Langchain Graph</p>
			</Link>
		</div>
	);
}
