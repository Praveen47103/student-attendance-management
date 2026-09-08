// ==============================================================================
// SUPABASE EDGE FUNCTION: SECURE EMAIL NOTIFICATIONS DISPATCHER
// ==============================================================================
// Deploy command: supabase functions deploy send-email --no-verify-jwt
// Set Secret:     supabase secrets set RESEND_API_KEY=re_your_api_key_here
//
// NOTE: This Edge Function runs securely in Supabase's serverless Deno runtime.
// The email API key and secrets are NEVER exposed to the frontend browser client!
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
        const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "";

        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

        // 1. Fetch pending emails from queue
        const { data: queue, error: fetchErr } = await supabase
            .from("email_queue")
            .select("*")
            .eq("status", "pending")
            .limit(10);

        if (fetchErr) {
            throw fetchErr;
        }

        if (!queue || queue.length === 0) {
            return new Response(
                JSON.stringify({ success: true, message: "No pending emails in queue" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const results = [];

        for (const item of queue) {
            try {
                if (!resendApiKey) {
                    console.log(`[SIMULATED DISPATCH] Email to ${item.recipient_email}: ${item.subject}`);
                    // If no Resend API key is configured yet, mark as simulated success
                    await supabase
                        .from("email_queue")
                        .update({
                            status: "sent",
                            sent_at: new Date().toISOString(),
                            error_message: "Simulated dispatch (RESEND_API_KEY not set in secrets)"
                        })
                        .eq("id", item.id);

                    results.push({ id: item.id, status: "simulated_sent" });
                    continue;
                }

                // Dispatch via Resend API
                const res = await fetch("https://api.resend.com/emails", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${resendApiKey}`,
                    },
                    body: JSON.stringify({
                        from: "Attendance System <notifications@resend.dev>",
                        to: [item.recipient_email],
                        subject: item.subject,
                        html: item.body_html,
                    }),
                });

                if (res.ok) {
                    await supabase
                        .from("email_queue")
                        .update({
                            status: "sent",
                            sent_at: new Date().toISOString(),
                        })
                        .eq("id", item.id);
                    results.push({ id: item.id, status: "sent" });
                } else {
                    const errData = await res.text();
                    await supabase
                        .from("email_queue")
                        .update({
                            status: "failed",
                            error_message: errData,
                        })
                        .eq("id", item.id);
                    results.push({ id: item.id, status: "failed", error: errData });
                }
            } catch (dispatchErr: any) {
                await supabase
                    .from("email_queue")
                    .update({
                        status: "failed",
                        error_message: dispatchErr?.message || String(dispatchErr),
                    })
                    .eq("id", item.id);
                results.push({ id: item.id, status: "error", error: dispatchErr?.message });
            }
        }

        return new Response(
            JSON.stringify({ success: true, processed: results }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (err: any) {
        return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
