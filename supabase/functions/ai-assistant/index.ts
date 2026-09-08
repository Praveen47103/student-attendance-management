// ==============================================================================
// SUPABASE EDGE FUNCTION: AI ATTENDANCE ASSISTANT
// ==============================================================================
// Deploy command: supabase functions deploy ai-assistant --no-verify-jwt
// Set Secret:     supabase secrets set GEMINI_API_KEY=AIzaSy...
//
// NOTE: This Edge Function runs securely in Supabase Deno runtime.
// The Gemini AI API key is NEVER exposed to the frontend browser client!
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { question, context, role } = await req.json();
        const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

        if (!geminiApiKey) {
            // Return structured flag so client-side AI analytics engine responds
            return new Response(
                JSON.stringify({
                    hasServerKey: false,
                    message: "Server GEMINI_API_KEY not configured. Using client analytics engine."
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const systemPrompt = `You are the AI Attendance Assistant for the Student Attendance Management System.
You are helping a ${role || 'user'}.
Here is their live system context data:
${JSON.stringify(context || {})}

Provide a friendly, accurate, and concise answer (with emojis and bullet points if appropriate).
Explain the 75% attendance rule and give exact advice if they are in shortage.`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        {
                            role: "user",
                            parts: [
                                { text: systemPrompt },
                                { text: `User Question: ${question}` }
                            ]
                        }
                    ]
                })
            }
        );

        if (!response.ok) {
            const err = await response.text();
            return new Response(
                JSON.stringify({ hasServerKey: false, error: err }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const data = await response.json();
        const answerText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "I was unable to generate a response.";

        return new Response(
            JSON.stringify({ hasServerKey: true, answer: answerText }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (err: any) {
        return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
