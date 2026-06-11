// Lovable AI-powered chatbot for HOPE2 ACADEMY.
// Uses LOVABLE_API_KEY (auto-provisioned) to call the AI Gateway.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `You are the official HOPE2 ACADEMY (HOPE 2 Liberia) virtual assistant.

About the institution:
- Name: HOPE2 ACADEMY ("The Lizard Kingdom"), part of HOPE 2 Liberia.
- Motto: "Learning To Serve For God's Purpose"
- Established: 2013
- Address: Barber's Joe Town, Marshall Road, Lower Margibi County, Republic of Liberia
- Office hours: Mon–Fri, 7:00 AM – 4:00 PM
- Email: info@hope2academy.org

The organisation has four divisions (departments) that work together:
1. HOPE2 MISSION — humanitarian outreach, mobile clinics, water, food and community development across Liberia.
2. HOPE2 ACADEMY — K-12 Christian school in Lower Margibi County, the educational heart of the movement.
3. HOPE2 CHURCH — local congregations and spiritual care, discipleship and worship gatherings.
4. HOPE2 MEDIA — radio, video, social and publishing arm that tells the story of Liberia's renewal.

The web system (this app) includes:
- Public site: Home, About, Team, Departments (the 4 divisions above), Projects, Stories, Contact.
- Portal with role-specific dashboards for Super Admin, Admin, Teacher, Student, Parent, Alumni.
- Modules: Classes, Assignments, Grades, Attendance, Timetable, Announcements, Messages, Fees, Donations, Pages (CMS), Posts, Media Library, Navigation, Departments, User Management, Analytics, Audit Logs, Site Settings, Library, Resources, Alumni Directory, Jobs, Events, Mentorship.
- Login is admin-invite only; demo accounts use password "demo1234".
- Address, logo, contact details and most text are editable by Super Admin / Admin under Site Settings.

How you should respond:
- Be warm, concise, accurate. Use plain English. Liberian-English friendly tone.
- If asked something you don't know, say so and direct people to email info@hope2academy.org or call during office hours.
- For admissions, sponsorship or partnership, point to the Contact page.
- Never invent fees, dates, scholarships or staff names that weren't stated above.
- Replies should be short (1–4 sentences) unless the user asks for detail.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const { messages = [] } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      }),
    });

    if (upstream.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit reached. Please try again shortly." }), {
        status: 429, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }
    if (upstream.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in workspace settings." }), {
        status: 402, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }
    if (!upstream.ok) {
      const t = await upstream.text();
      return new Response(JSON.stringify({ error: "AI gateway error", detail: t }), {
        status: 500, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const data = await upstream.json();
    const reply: string = data?.choices?.[0]?.message?.content ?? "Sorry — I didn't catch that. Could you rephrase?";
    return new Response(JSON.stringify({ reply }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});