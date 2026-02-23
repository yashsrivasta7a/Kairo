import { createAzure } from '@ai-sdk/azure';
import { streamText, generateText } from 'ai';
import { adminDB } from 'lib/instant/adminDb';
import { getSystemPrompt } from '../../utils/systemPromptV2';

const azure = createAzure({
    resourceName: process.env.AZURE_OPENAI_ENDPOINT!
        .replace('https://', '')
        .split('.')[0],
    apiKey: process.env.AZURE_OPENAI_API_KEY!,
});


async function optimizePrompt(userPrompt: string): Promise<string> {
    try {
        const { text: optimizedPrompt } = await generateText({
            model: azure(process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-5.2-chat'),
            prompt: `You are an expert UX/product designer and React Native developer. 
            
Your task is to enhance and expand a user's app idea to make it more polished, feature-rich, and user-friendly.

User's original request: "${userPrompt}"

IMPORTANT CONSTRAINTS & AVAILABLE TOOLS:

Available React Native APIs:
- Vibration: For haptic feedback
- Alert: For dialogs and confirmations
- Dimensions: For responsive layouts
- Platform: To detect iOS/Android
- Keyboard: To control keyboard
- Animated: For smooth animations
- FlatList/SectionList: For efficient lists
- Appearance: For dark mode detection
- Clipboard: For copy/paste
- Linking: For deep links
- Share: For sharing content

MUST FOLLOW:
- ONLY use: React, React Native, InstantDB
- NO external packages (expo-*, react-native-*, lodash, etc.)
- Use InstantDB for all data that needs persistence
- Use React Native's Animated API for animations
- Handle loading/empty/error states in JSX, not with early returns

Please enhance this request by:
1. Adding meaningful features that make sense for this type of app
2. Suggesting UI/UX improvements (nice layouts, visual feedback, animations using React Native Animated)
3. Recommending data organization and filtering with InstantDB
4. Proposing empty states, loading states, and error handling
5. Suggesting a cohesive design system with colors and typography
6. Adding features that improve user engagement and polish
7. Suggesting use of Vibration, Alert, Clipboard, or other available APIs where appropriate
8. Ensuring all data is stored in InstantDB (not AsyncStorage or filesystem)

Return ONLY the enhanced prompt (no explanations or meta-commentary). The enhanced prompt should be detailed, specific, and ready to be given to a React Native developer.`,
            temperature: 0.7,
        });

        return optimizedPrompt;
    } catch (error) {
        console.error('Error optimizing prompt:', error);
        return userPrompt;
    }
}



export async function generateAndStreamCode({
    buildId,
    prompt,
    userId,
}: {
    buildId: string;
    prompt: string;
    userId: string;
}) {
    // AI-powered prompt optimization
    const optimizedPrompt = await optimizePrompt(prompt);
    
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
            prompt: optimizedPrompt,
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