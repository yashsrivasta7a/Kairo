import { createAzure } from '@ai-sdk/azure';
import { streamText } from 'ai';
import { adminDB } from 'lib/instant/adminDb';
import { getSystemPrompt } from './systemPrompt';

const azure = createAzure({
    resourceName: process.env.AZURE_OPENAI_ENDPOINT!
        .replace('https://', '')
        .split('.')[0],
    apiKey: process.env.AZURE_OPENAI_API_KEY!,
});

export async function generateAndStreamCode({
    buildId,
    prompt,
    userId,
}: {
    buildId: string;
    prompt: string;
    userId: string;
}) {
    let code = '';
    let streaming: string = 'true';

    // debounce / concurrency control
    let isPending = false;
    let needsAnotherSave = false;
    let lastSaveTime = 0;

    const triggerSave = async () => {
        const now = Date.now();
        if (now - lastSaveTime < 300) return;
        lastSaveTime = now;

        if (isPending) {
            needsAnotherSave = true;
            return;
        }

        isPending = true;

        while (true) {
            needsAnotherSave = false;
            try {
                await adminDB.transact([
                    adminDB.tx.builds[buildId]
                        .update({
                            code,
                            streaming,
                            status: 'generating',
                            updatedAt: Date.now(),
                        })
                        .link({ owner: userId }),
                ]);
            } catch (error) {
                console.error('Error saving build progress:', error);
            }

            if (!needsAnotherSave) break;
        }

        isPending = false;
    };

    try {
        // mark build as started
        await adminDB.transact([
            adminDB.tx.builds[buildId]
                .update({
                    streaming: 'true',
                    status: 'generating',
                    updatedAt: Date.now(),
                })
                .link({ owner: userId }),
        ]);

        const { fullStream } = streamText({
            model: azure(
                process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-5.2-chat'
            ),
            prompt,
            system: getSystemPrompt(),
            onError: (error) => {
                console.error('Error streaming text:', error);
            },
        });

        for await (const chunk of fullStream) {
            if (chunk.type === 'text-delta') {
                code += chunk.text;
                triggerSave();
            }
        }

        streaming = 'false';

        await adminDB.transact([
            adminDB.tx.builds[buildId].update({
                code,
                streaming: 'false',
                status: 'completed',
                updatedAt: Date.now(),
            }),
        ]);
    } catch (error) {
        console.error('AI Generation Error:', error);

        try {
            await adminDB.transact([
                adminDB.tx.builds[buildId].update({
                    streaming: 'false',
                    status: 'failed',
                    error: { message: String(error) },
                    updatedAt: Date.now(),
                }),
            ]);
        } catch (dbError) {
            console.error('Failed to update error status:', dbError);
        }
    }
}