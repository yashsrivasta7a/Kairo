import { createAzure } from '@ai-sdk/azure';
import { generateText } from 'ai';
import { validateCode } from './validator';
import { adminDB } from 'lib/instant/adminDb';
import { getSpecPrompt, getScreenPrompt, getGluePrompt } from '../../utils/systemPromptV2';

const azure = createAzure({
    resourceName: process.env.AZURE_OPENAI_ENDPOINT!
        .replace('https://', '')
        .split('.')[0],
    apiKey: process.env.AZURE_OPENAI_API_KEY!,
});

const MAX_FIX_ATTEMPTS = 3;

export async function runPipeline({
    buildId,
    prompt,
    userId,
}: {
    buildId: string;
    prompt: string;
    userId: string;
}) {
    let currentStage = 'init';
    let lastCode: string | undefined;
    let lastAttempt = 0;

    try {
        currentStage = 'specs';
        await adminDB.transact([
            adminDB.tx.builds[buildId].update({
                status: 'generating',
                stage: 'specs',
                updatedAt: Date.now()
            }).link({ owner: userId })])

        const { text: specText } = await generateText({
            model: azure(process.env.AZURE_OPENAI_DEPLOYMENT_NAME!),
            system: getSpecPrompt(),
            prompt,
        })
        // Parse spec - if it fails, we throw and status goes to 'failed'
        let spec;
        try {
            // Strip markdown fences if the model added them
            const cleaned = specText.replace(/```json|```/g, '').trim();
            spec = JSON.parse(cleaned);
        } catch {
            throw new Error(`Stage 1 failed: AI returned invalid JSON.\nRaw output: ${specText.slice(0, 200)}`);
        }
        // Validate the spec has what we need
        if (!spec.screens || !spec.dataModels || !spec.initialScreen) {
            throw new Error(`Stage 1 failed: Spec is missing required fields. Got: ${JSON.stringify(spec)}`);
        }

        // Sanitize screen names to valid PascalCase JS identifiers (no spaces or special chars)
        spec.screens = spec.screens.map((s: any) => ({
            ...s,
            name: s.name.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, ''),
        }));
        // Keep initialScreen in sync
        spec.initialScreen = spec.initialScreen.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
        console.log('📋 SPEC:', JSON.stringify(spec, null, 2));

        currentStage = 'screens';
        await adminDB.transact([
            adminDB.tx.builds[buildId].update({ stage: 'screens', updatedAt: Date.now() })
        ])

        const screenCodes: string[] = [];
        for (const screen of spec.screens) {
            const { text: screenCode } = await generateText({
                model: azure(process.env.AZURE_OPENAI_DEPLOYMENT_NAME!),
                system: getScreenPrompt(spec, screen),
                prompt: `Write the ${screen.name} screen.`,
            });
            screenCodes.push(screenCode);
            console.log(`📺 SCREEN [${screen.name}]:\n`, screenCode.slice(0, 500));
        }

        // Stage 3 — glue everything together
        currentStage = 'gluing';
        await adminDB.transact([
            adminDB.tx.builds[buildId].update({ stage: 'gluing', updatedAt: Date.now() })
        ]);

        const { text: rawFinalCode } = await generateText({
            model: azure(process.env.AZURE_OPENAI_DEPLOYMENT_NAME!),
            system: getGluePrompt(spec, screenCodes),
            prompt: 'Assemble the final app.',
        });

        console.log('🔧 FINAL CODE (first 1000 chars):\n', rawFinalCode.slice(0, 1000));

        // ── 3-attempt fix loop ────────────────────────────────────────────
        currentStage = 'validation';
        // Strip markdown fences the glue AI sometimes wraps output in
        const stripFences = (s: string) => s.replace(/^```[\w]*\n?/m, '').replace(/```\s*$/m, '').trim();
        let codeToFix = stripFences(rawFinalCode);
        lastCode = codeToFix;
        const collectedErrors: string[] = [];

        for (let attempt = 1; attempt <= MAX_FIX_ATTEMPTS; attempt++) {
            lastAttempt = attempt;
            const validation = validateCode(codeToFix);

            if (validation.valid) {
                // ✅ Code is good — save and exit
                await adminDB.transact([
                    adminDB.tx.builds[buildId].update({
                        code: codeToFix,
                        streaming: 'false',
                        status: 'completed',
                        stage: 'completed',
                        updatedAt: Date.now(),
                    }),
                ]);
                return;
            }

            const errorMsg = validation.error!;
            collectedErrors.push(`Attempt ${attempt}/${MAX_FIX_ATTEMPTS}: ${errorMsg}`);
            console.warn(`⚠️ Validation failed (attempt ${attempt}/${MAX_FIX_ATTEMPTS}):`, errorMsg);

            if (attempt === MAX_FIX_ATTEMPTS) break; // no more retries — exhausted

            // Final fix call gets a "simplify" instruction
            const isLastFixCall = attempt === MAX_FIX_ATTEMPTS - 1;
            const finalAttemptInstruction = isLastFixCall
                ? `\n\nThis is your final attempt.\nYou must simplify the code.\nRemove optional features.\nFavor correctness over completeness.`
                : '';

            const { text: fixedRaw } = await generateText({
                model: azure(process.env.AZURE_OPENAI_DEPLOYMENT_NAME!),
                system: `You are a code fixer. Output ONLY the corrected JavaScript code. No markdown fences. No explanation.`,
                prompt: `This React Native code has an error (attempt ${attempt}/${MAX_FIX_ATTEMPTS}):\n\nERROR: ${errorMsg}\n\nFix ONLY that error. Output the entire corrected file with NO markdown.${finalAttemptInstruction}\n\nCODE:\n${codeToFix}`,
            });
            const fixedCode = stripFences(fixedRaw);

            codeToFix = fixedCode;
            lastCode = fixedCode;
        }

        // All attempts exhausted
        throw new Error(`All ${MAX_FIX_ATTEMPTS} fix attempts failed:\n${collectedErrors.join('\n')}`);

    } catch (error: any) {
        console.error('Pipeline failed:', error);
        await adminDB.transact([
            adminDB.tx.builds[buildId].update({
                streaming: 'false',
                status: 'failed',
                stage: 'failed',
                error: JSON.stringify({
                    stage: currentStage,
                    attempt: lastAttempt,
                    message: error?.message ?? String(error),
                    hint: lastCode?.slice(0, 300),
                }),
                updatedAt: Date.now(),
            }),
        ]);
    }
}
