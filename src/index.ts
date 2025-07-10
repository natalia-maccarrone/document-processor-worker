import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
	async fetch(request, env, ctx): Promise<Response> {
		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		if (request.method !== 'POST') {
			return new Response(JSON.stringify({ error: `${request.method} method not allowed.` }), { status: 405, headers: corsHeaders });
		}

		try {
			const { document }: { document: string } = await request.json();

			const chunks = await chunkDocument(document);

			const requestBody = JSON.stringify(chunks);

			const embeddingsResponse = await env.EMBEDDINGS_WORKER.fetch(
				new Request('http://fake', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: requestBody,
				})
			);

			if (!embeddingsResponse.ok) {
				const errorText = await embeddingsResponse.text();
				console.log('Embeddings worker error:', errorText);
				throw new Error(`Failed to create embeddings: ${errorText}`);
			}

			const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

			const embeddings: number[][] = await embeddingsResponse.json();

			const documentId = crypto.randomUUID();

			const chunkData = chunks.map((chunk, index) => ({
				document_id: documentId,
				chunk_text: chunk,
				embedding: embeddings[index],
				chunk_index: index,
			}));

			const { error } = await supabase.from('document_chunks').insert(chunkData);

			if (error) {
				throw new Error(`Database error: ${error.message}`);
			}

			return new Response(
				JSON.stringify({
					success: true,
					document_id: documentId,
					chunks_processed: chunks.length,
				}),
				{ headers: corsHeaders }
			);
		} catch (error: any) {
			return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
		}
	},
} satisfies ExportedHandler<Env>;

async function chunkDocument(text: string) {
	const splitter = new RecursiveCharacterTextSplitter({
		chunkSize: 500,
		chunkOverlap: 50,
		separators: ['\n\n', '\n', '.', '!', '?', ' ', ''],
	});

	return splitter.splitText(text);
}
