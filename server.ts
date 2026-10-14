import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialization of Gemini API
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Global server memory state (reset on server start, prepopulated with professional realistic realistic AHF Zambia clinical records)
let clinics = [
  {
    id: "lsk-1",
    name: "AHF Lusaka Clinic (HQ)",
    location: "Lusaka District",
    supplies: {
      artkits: 450,
      condoms: 8500,
      testKits: 320,
    },
    minThresholds: {
      artkits: 150,
      condoms: 3000,
      testKits: 100,
    }
  },
  {
    id: "ndl-2",
    name: "AHF Ndola Centre",
    location: "Ndola, Copperbelt",
    supplies: {
      artkits: 280,
      condoms: 4200,
      testKits: 150,
    },
    minThresholds: {
      artkits: 100,
      condoms: 2000,
      testKits: 80,
    }
  },
  {
    id: "lvs-3",
    name: "AHF Livingstone Outpost",
    location: "Livingstone, Southern",
    supplies: {
      artkits: 35, // Low
      condoms: 1200, // Low
      testKits: 24, // Low
    },
    minThresholds: {
      artkits: 80,
      condoms: 2500,
      testKits: 60,
    }
  },
  {
    id: "chp-4",
    name: "AHF Chipata Hub",
    location: "Chipata, Eastern",
    supplies: {
      artkits: 190,
      condoms: 3500,
      testKits: 120,
    },
    minThresholds: {
      artkits: 90,
      condoms: 1500,
      testKits: 70,
    }
  },
  {
    id: "ktw-5",
    name: "Kitwe Support Clinic",
    location: "Kitwe, Copperbelt",
    supplies: {
      artkits: 12, // Critical Alert!
      condoms: 800, // Low
      testKits: 8, // Critical Alert!
    },
    minThresholds: {
      artkits: 100,
      condoms: 3000,
      testKits: 100,
    }
  }
];

let smsQueue = [
  {
    id: "sms-1",
    patientName: "Hidden Patient #398", // Anonymized internally for HIPAA/privacy but referenceable
    phoneNumber: "+260 97 **** 4125",
    type: "Pharmacy ART Pick-up",
    clinic: "AHF Lusaka Clinic (HQ)",
    message: "AHF Care: Hello. Your monthly ART pharmacy refill is scheduled for tomorrow at Lusaka HQ Clinic. Please bring your card. Your health is our priority.",
    scheduledDate: "Tomorrow, 09:00",
    status: "Queued",
    sentTime: null
  },
  {
    id: "sms-2",
    patientName: "Hidden Patient #204",
    phoneNumber: "+260 76 **** 8820",
    type: "Default Follow-up",
    clinic: "Kitwe Support Clinic",
    message: "AHF Support: We noticed you missed your pick-up date on Friday. Your medication continuity is vital. Feel free to come in tomorrow morning or text us. We care about you.",
    scheduledDate: "Immediate",
    status: "Sent",
    sentTime: "2026-06-21 11:30"
  },
  {
    id: "sms-3",
    patientName: "Hidden Patient #112",
    phoneNumber: "+260 95 **** 0281",
    type: "Doctor Consultation",
    clinic: "AHF Ndola Centre",
    message: "AHF Care: Confirmed appointment with Dr. Mwansa at Ndola Clinic on Thursday at 14:00. Reply to cancel or reschedule.",
    scheduledDate: "Next Thursday, 14:00",
    status: "Queued",
    sentTime: null
  }
];

let fieldLogs = [
  {
    id: "flog-1",
    location: "Kabwata Market, Lusaka",
    coordinates: { lat: -15.4338, lng: 28.3289 }, // Real Lusaka coordinate offset
    reached: 320,
    tested: 145,
    reactive: 4,
    condoms: 1200,
    date: "2026-06-19",
    team: "Lusaka Mobile Van A"
  },
  {
    id: "flog-2",
    location: "Intercity Bus Terminus, Lusaka",
    coordinates: { lat: -15.4242, lng: 28.2917 },
    reached: 540,
    tested: 280,
    reactive: 9,
    condoms: 3000,
    date: "2026-06-20",
    team: "Lusaka Mobile Van B"
  },
  {
    id: "flog-3",
    location: "Chifubu Market Open Circle, Ndola",
    coordinates: { lat: -12.9463, lng: 28.6294 }, // Ndola area coordinate offset
    reached: 210,
    tested: 110,
    reactive: 2,
    condoms: 800,
    date: "2026-06-21",
    team: "Copperbelt Field Van 1"
  }
];

// Patient-Facing Peer Discussions
let forumPosts = [
  {
    id: "post-1",
    category: "side_effects",
    title: "Experiencing extreme fatigue in week 2 of starting ART",
    author: "ZambiaHope_94",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&h=100&q=80",
    content: "Hey peers, I started my new ART medicine two weeks ago. For the last 3 days, I've had terrible fatigue and a bit of nausea in the morning. Is this common? Does it get better?",
    timestamp: "3 hours ago",
    likes: 12,
    replies: [
      {
        id: "rep-1-1",
        author: "Mosi_Support_260",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80",
        isVerified: false,
        role: "Peer Buddy",
        content: "Nidya bwino (eat well) before taking it, my friend! It happened to me too in the first month. By week 4, the body adjusted and I have my full energy back. Stay strong, you're not alone!",
        timestamp: "2 hours ago"
      },
      {
        id: "rep-1-2",
        author: "Dr. Mwansa, AHF Medical Officer",
        avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=100&h=100&q=80",
        isVerified: true,
        role: "Verified Doctor",
        content: "Hello ZambiaHope_94. Mild fatigue and nausea are indeed common initial side effects during the first 2-4 weeks because your body is adjusting. However, make sure you take it with a light meal, and keep hydrated. If the fatigue is accompanied by extreme weakness, skin yellowish tint, or dark urine, please message me here or stop by our Lusaka Clinic immediately so we can run a quick liver profile check. Stay compliant!",
        timestamp: "1 hour ago"
      }
    ]
  },
  {
    id: "post-2",
    category: "disclosure",
    title: "How do I tell my family without losing their support?",
    author: "CopperbeltLover",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&h=100&q=80",
    content: "I am preparing to tell my sister. She is very traditional but we are so close. I don't want her to fear or push me away. AHF counselors have been great, but I want to hear from someone who actually disclosed. How did it go for you?",
    timestamp: "1 day ago",
    likes: 19,
    replies: [
      {
        id: "rep-2-1",
        author: "LusakaProud_01",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80",
        isVerified: false,
        role: "Peer Lead",
        content: "I took my sister directly to AHF Ndola to sit with a counselor. It helped ofya (it erased) all the old myths she had in her head about the disease. When she saw how healthy I was, she cried but hugged me. Education is key!",
        timestamp: "18 hours ago"
      },
      {
        id: "rep-2-2",
        author: "Counselor Alice, AHF Psychosocial Lead",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&h=100&q=80",
        isVerified: true,
        role: "Verified Support Specialist",
        content: "Greetings CopperbeltLover. It is very natural to feel anxious. A great strategy is to gauge her general view on medical matters first. Having leaflets or offering to bring her into AHF clinic for an open discussion can defuse fear. We can also schedule a facilitated disclosure meeting here where you both sit with me! Let me know if you would like to book a space.",
        timestamp: "12 hours ago"
      }
    ]
  }
];

// Confidential chat logs between patient (by random username) and AHF doctors
let doctorChats: Record<string, Array<{ id: string; sender: "patient" | "doctor"; content: string; timestamp: string }>> = {
  "default": [
    {
      id: "ch-1",
      sender: "doctor",
      content: "Hello! I am Dr. Chileshe, active on duty today at AHF Zambia. This is a private, completely anonymous chat. Rest assured your real identity is never exposed. How may I support you with your health or medication today?",
      timestamp: "14:43"
    }
  ]
};

// --- HTTP REST ENDPOINTS ---

// Clinics endpoints
app.get("/api/clinics", (req, res) => {
  res.json(clinics);
});

app.post("/api/clinics/restock", (req, res) => {
  const { id, type, amount } = req.body;
  const clinic = clinics.find(c => c.id === id);
  if (clinic) {
    if (type === "artkits") clinic.supplies.artkits += Number(amount);
    if (type === "condoms") clinic.supplies.condoms += Number(amount);
    if (type === "testKits") clinic.supplies.testKits += Number(amount);
    res.json({ success: true, clinic });
  } else {
    res.status(404).json({ error: "Clinic not found" });
  }
});

// SMS reminders endpoints
app.get("/api/sms-queue", (req, res) => {
  res.json(smsQueue);
});

app.post("/api/sms-queue/add", (req, res) => {
  const { type, clinic, message, phoneNumber, patientName, scheduledDate } = req.body;
  const newSms = {
    id: `sms-${Date.now()}`,
    patientName: patientName || `Hidden Patient #${Math.floor(Math.random() * 900) + 100}`,
    phoneNumber: phoneNumber || "+260 97 **** " + Math.floor(Math.random() * 9000 + 1000),
    type: type || "General Alert",
    clinic: clinic || "AHF Lusaka Clinic (HQ)",
    message: message || "AHF Care: Restock alert or general appointment update.",
    scheduledDate: scheduledDate || "Immediate",
    status: "Queued",
    sentTime: null
  };
  smsQueue.unshift(newSms);
  res.json({ success: true, sms: newSms });
});

app.post("/api/sms-queue/trigger", (req, res) => {
  const { id } = req.body;
  const msg = smsQueue.find(s => s.id === id);
  if (msg) {
    msg.status = "Sent";
    const date = new Date();
    msg.sentTime = date.toISOString().replace('T', ' ').substring(0, 16);
    res.json({ success: true, sms: msg });
  } else {
    res.status(404).json({ error: "SMS not found" });
  }
});

// Field logs
app.get("/api/field-logs", (req, res) => {
  res.json(fieldLogs);
});

app.post("/api/field-logs/add", (req, res) => {
  const { location, reached, tested, reactive, condoms, team, lat, lng } = req.body;
  const newLog = {
    id: `flog-${Date.now()}`,
    location,
    coordinates: {
      lat: Number(lat) || (-15.4 + (Math.random() - 0.5) * 0.1),
      lng: Number(lng) || (28.3 + (Math.random() - 0.5) * 0.1)
    },
    reached: Number(reached) || 0,
    tested: Number(tested) || 0,
    reactive: Number(reactive) || 0,
    condoms: Number(condoms) || 0,
    date: new Date().toISOString().split("T")[0],
    team: team || "Mobile Outreach Team C"
  };
  fieldLogs.unshift(newLog);
  res.json({ success: true, log: newLog });
});

// Forum endpoints
app.get("/api/forum/posts", (req, res) => {
  res.json(forumPosts);
});

app.post("/api/forum/posts/add", (req, res) => {
  const { category, title, author, content, avatar } = req.body;
  const newPost = {
    id: `post-${Date.now()}`,
    category,
    title,
    author: author || "LusakaPeer_88",
    avatar: avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80",
    content,
    timestamp: "Just now",
    likes: 0,
    replies: []
  };
  forumPosts.unshift(newPost);
  res.json({ success: true, post: newPost });
});

app.post("/api/forum/posts/reply", (req, res) => {
  const { postId, author, isVerified, role, avatar, content } = req.body;
  const post = forumPosts.find(p => p.id === postId);
  if (post) {
    const newReply = {
      id: `rep-${Date.now()}`,
      author: author || "Anonymous Peer",
      avatar: avatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&h=100&q=80",
      isVerified: !!isVerified,
      role: role || (isVerified ? "Verified Staff" : "Community Peer"),
      content,
      timestamp: "Just now"
    };
    post.replies.push(newReply);
    res.json({ success: true, reply: newReply });
  } else {
    res.status(404).json({ error: "Post not found" });
  }
});

// Doctor chat messages
app.get("/api/chat/doctor", (req, res) => {
  const username = (req.query.username as string) || "default";
  if (!doctorChats[username]) {
    doctorChats[username] = [
      {
        id: "ch-init",
        sender: "doctor",
        content: `Hello ${username}! I am Dr. Chileshe, active on duty today at AHF Zambia. This is a private, completely anonymous chat. Your health and emotional safety are our number one priority. Ask me any question about side effects, schedules, or support!`,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      }
    ];
  }
  res.json(doctorChats[username]);
});

app.post("/api/chat/doctor/send", async (req, res) => {
  const { username, message } = req.body;
  const user = username || "default";

  if (!doctorChats[user]) {
    doctorChats[user] = [];
  }

  // Save patient's message
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const patientMsg = {
    id: `msg-${Date.now()}-user`,
    sender: "patient" as const,
    content: message,
    timestamp: timeStr
  };
  doctorChats[user].push(patientMsg);

  // Generate Doctor's Reply (AI or empathetic fallback model)
  const ai = getGeminiClient();
  let replyText = "";

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            text: `You are Dr. Chileshe, a caring, highly supportive, professional, and empathetic clinical doctor representing AIDS Healthcare Foundation (AHF) Zambia. 
You are speaking in a 100% confidential, stigma-free peer-level chat in the "AHF Community App". 
The patient is currently logged in anonymously as "${username}".

Primary Directives:
1. Provide accurate, simple, reassuring medical facts according to WHO and AHF HIV guidelines (e.g., importance of continuous ART medication adherence, how to manage common mild fatigue side effects, tips for disclosure, healthy living during pregnancy).
2. Answer the patient's specific worry: "${message}"
3. Speak in a warm, Zambian professional tone. (You can occasionally use common local friendly markers like "Muli Bwanji", "Nizakupatsani" or reference local contexts if they fit perfectly and warmly, but keep it clear and professional).
4. Always prioritize compliance: remind them that missing doses can cause drug resistance.
5. Safety notice: End with a soft, caring advice that for physical symptoms checkups or urgent lab work, they are always free to walk into any of our partner clinics (like AHF Lusaka HQ or Ndola Centre) for a free warm consultation.
Keep your response concise, personal, and supportive (under 130 words).`
          }
        ]
      });
      replyText = response.text || "";
    } catch (e: any) {
      console.error("Gemini medical generation failed, triggering fallback: ", e);
    }
  }

  if (!replyText) {
    // Intelligent fallback dialogue
    const lower = message.toLowerCase();
    if (lower.includes("miss") || lower.includes("forgot") || lower.includes("pill") || lower.includes("dose")) {
      replyText = `Hello ${user}. Thank you for sharing this with me. Missing a single pill occasionally happens, but do not panic! Take it as soon as you remember. However, if it's almost time for your next dose, skip the missed one and continue your normal schedule. Consistency is key to keeping the virus fully suppressed and preventing drug resistance. Remember, you can always visit our team here at the clinic for a free pill counselor refresher. You are doing great!`;
    } else if (lower.includes("fatigue") || lower.includes("tired") || lower.includes("nausea") || lower.includes("side effect") || lower.includes("sick")) {
      replyText = `Hello ${user}. Mild fatigue and stomach upset are common within the first 2-4 weeks of starting or switching ART regimens as your system adjusts. Try taking your dose with a light evening meal and drink plenty of water. If the tiredness becomes extreme, or you notice yellowish eyes or dark urine, please let me know or stop by the AHF center next so we can check your lab levels. We are right here with you!`;
    } else if (lower.includes("pregnant") || lower.includes("baby") || lower.includes("child")) {
      replyText = `Hello ${user}. Congratulations, and rest assured that staying adherent to your ART keeps both you and your baby perfectly healthy and 100% safe! With proper viral suppression, the chance of transmitting to your baby (PMTCT) is practically zero. Make sure you attend your regular ANC clinics. We are here to walk with you every step of this beautiful journey!`;
    } else if (lower.includes("tell") || lower.includes("disclose") || lower.includes("reveal") || lower.includes("family")) {
      replyText = `Hello ${user}. Disclosing your status to loved ones takes immense courage. Take your time! You do not have to rush. We recommend starting with one trusted person who has shown great empathy. If you want, you can bring them to the AHF clinic under the guise of general counseling, and we will guide the conversation for you. Stay strong!`;
    } else {
      replyText = `Thank you for sharing your concern, ${user}. As your AHF doctor, I want you to know that your health is in highly capable hands. HIV is entirely manageable, and you can live a long, fully vibrant life! If you are feeling under the weather or just need support, we are here. For any specific symptoms requiring a physical lab test, please do stop by our clinic for a free, stigma-free checkup!`;
    }
  }

  const doctorMsg = {
    id: `msg-${Date.now()}-doc`,
    sender: "doctor" as const,
    content: replyText,
    timestamp: timeStr
  };
  doctorChats[user].push(doctorMsg);

  res.json({ success: true, messages: doctorChats[user] });
});

// Hiring customized cover letter / verbal pitch generator using Gemini
app.post("/api/hiring/pitch", async (req, res) => {
  const { name, strength, depth, background, email } = req.body;

  const ai = getGeminiClient();
  let generatedData = "";

  const promptText = `Generate a high-quality job/internship application package for AHF Zambia (AIDS Healthcare Foundation) represented of a talented Software Developer named "${name || "Applicant"}".
Email contact: "${email || "applicant@example.com"}"
Unique strength: "${strength || "Full-stack development and real-time logistics mapping"}"
Selected Internship Role background context: "${background || "Software Engineering & Clinical Data Systems Intern"}"

The applicant has developed a fully-functional digital prototype containing:
1. An AHF Administrative Control Center that solves medication stockouts using a Real-Time Supply Stock alert system, monitors rural health mobile outposts via a Field GIS Tracking Map, and queues automated SMS adherence reminders.
2. An anonymous AHF Patient Community app that eliminates social stigma through avatar-only community discussion-boards and direct secure live chat with clinical doctors on duty.

Generate three elegant, highly structured text blocks in JSON-compatible markdown:
[VERBAL_PITCH]
A short, high-impact non-technical 1-minute verbal elevator pitch (under 200 words) the applicant can speak in front of AHF recruiters or clinical managers. Focus on how combining code with empathy bridges logistics gaps and client care retention in Zambia. Highlighting specific clinic examples built into the prototype (e.g. Ndola, Lusaka HQ, Kitwe alert).

[COVER_LETTER]
A formal, professional, highly customized cover letter addressed to "AHF Zambia Recruitment Team, Lusaka". It must be extremely polished, reference actual AHF missions (stigma reduction, clinic retention, medication adherence, logistics restocking), and describe how their digital prototype functions as working evidence of their skill.

[SOLUTIONS_MAPPING]
A brief bulleted breakdown linking the app's features (Supply tracker with alerting thresholds, Patient SMS loop, GIS Map for hot-spot outreach, peer safety boards) to actual clinical frustrations reported on the ground by AHF managers.

If the Gemini API key is active, speak with incredible precision. Ensure the style is highly professional, warm, empathetic, and strictly technical/mature. Let's return this in a clean format.`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptText
      });
      generatedData = response.text || "";
    } catch (e) {
      console.error("Gemini hiring generator failed: ", e);
    }
  }

  if (!generatedData) {
    // Elegant hardcoded template with fallback if Gemini key not set
    generatedData = `### 🎤 Elevator Pitch (1-Minute Verbal Presentation)
"Muli bwanji! My name is ${name || "Friday"}, and I am incredibly excited to demonstrate how we can bridge clinical logistics and patient care retention for AHF Zambia. Currently, clinic managers deal with critical medication shortages while patients struggle with stigma-induced adherence dropouts. 

To solve this, I designed and coded an fully functional digital platform. In the Administrative Control Center, managers see a real-time smart supply tracker that automatically flags kit shortages at the Kitwe and Livingstone Hubs before they run dry, paired with a GIS Map plotting high-reactive remote centers. For patients, the completely anonymous community room eliminates stigma, offering peer support boards and a private live chat with verified of-duty AHF doctors. I built this prototype to show that I don't just write code; I design systems that save lives, support clinics, and restore dignity."

***

### ✉️ Formal Cover Letter to AHF Zambia
**To:**
The Recruitment & Operations Coordinator
AIDS Healthcare Foundation (AHF) Zambia
Plot 112, Great East Road
Lusaka, Zambia

**Subject: Application for Software Engineering & Systems Integration Internship**

Dear Hiring Committee,

I am writing to formally express my interest in joining the AHF Zambia technical and clinic support operations. Having admired AHF's relentless contribution toward achieving HIV epidemic control in Zambia—providing free testing, pharmacy refills, and psychosocial support to over hundreds of thousands of active clients—I want to offer my technical skills as a passionate developer who builds with deep empathy.

To demonstrate my readiness and commitment, I have developed a full-scale digital prototype tailored strictly to the three core administrative and community needs of AHF:
1. **Medication Stock Continuity**: Our Supply Tracker live-monitors stocks of ART kits, condoms, and HIV test kits against custom safety thresholds (like Ndola or Kitwe Outposts), automatically flagging bottlenecks to the logistics teams.
2. **Mobility-Driven Data GIS**: A field outreach logistics map where mobile health vans log tested ratios on-the-spot, instantly highlighting geographic hot-spots for subsequent van dispatches.
3. **Stigma-Free Adherence Community**: Our anonymous patient space integrates medical-staff badges, support forums (covering status disclosure and pregnancy care), and direct chat channels with active AHF physicians.

Through this prototype, I am showcasing that I possess both the full-stack architecture skills and the understanding of public healthcare directives needed to hit the ground running. I am eager to discuss how I can assist your IT, clinical, and database monitoring teams during an internship. Thank you for your time, consideration, and life-saving leadership.

Sincerely,
${name || "Applicant"}
${email || "applicant@example.com"}

***

### 📋 Prototype Features to Clinical Challenges Mapping
- **Real-time Supply Threshold Alerts:** Solves the challenge of stockouts of life-saving antiretroviral therapy (ART) and testing supplies, especially in remote outreach clinics.
- **Outreach Hot-Spot GIS Hub:** Solves the challenge of inefficient mobile health clinic routing by guiding dispatches directly to high-need or high-reactive regions based on actual live test results.
- **Automated Client SMS Adherence Reminders:** Directly addresses patient retention and pharmacy default drop-outs through gentle, discreet, non-stigmatization follow-ups.
- **Anonymous Community Board & doctor chat:** Dismantles stigma-induced isolation, giving patients safe peer access and immediate clinical clarity without long transport costs.`;
  }

  res.json({ success: true, result: generatedData });
});

// AI Operations Analysis Endpoint using Gemini
app.post("/api/admin/analysis", async (req, res) => {
  const ai = getGeminiClient();
  let analysisResult = "";

  const promptText = `You are the lead AI Operations Strategist for AHF Zambia (AIDS Healthcare Foundation).
We operate clinics, field testing logistics vans, and SMS patient adherence reminders.
Below is our current live database:

1. CLINICAL INVENTORY LEVELS (Safety Threshold vs Current stock):
${JSON.stringify(clinics, null, 2)}

2. GIS SECTOR FIELD OUTREACH ACTIVITY LOGS (Number of tests done vs reactive/positive cases):
${JSON.stringify(fieldLogs, null, 2)}

3. RECENT SMS PRE-ADHERENCE CAMPAIGNS QUEUED:
${JSON.stringify(smsQueue, null, 2)}

Please write an intensive, highly analytical, and extremely professional Strategic Action Plan & Optimization Recommendation report based exactly on this live data.
The report must contain:
1. **🚨 CRITICAL INVENTORY WARNINGS & RESTOCK TIMINGS**: Identify exactly which hubs are suffering from dangerous stock levels (current stock is below safety thresholds, e.g. Kitwe with 12 ART kits, Livingstone with 35 ART kits) and calculate exactly how many units of ART kits, condoms, or test tools must be dispatched to bring them back to safety.
2. **📍 GIS FIELD OUTREACH TARGET PRIORITIES**: Compare the test-positivity ratio (reactive divided by tested) for Kabwata Market, Intercity Bus Terminus, and any other logged outposts. Recommend exactly where our Mobile Health Vans or outreach counselors must be routed next based on geographic hotspots showing higher positivity.
3. **💬 BESPOKE EMPATHETIC ADHERENCE STRATEGIES**: Propose 2 new, discreet, and deeply empathetic SMS templates tailored for regional language contexts (e.g., Bemba or Nyanja subtle greetings like "Muli Bwanji" or "Mulishani") that keep patient identity safe and encourage compliance.

Speak with high technical precision, deep empathy, and structured authority. Format your answer with clean Markdown headers, bullet points, and highlight terms in bold.`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptText
      });
      analysisResult = response.text || "";
    } catch (e) {
      console.error("Gemini admin report failed: ", e);
    }
  }

  if (!analysisResult) {
    // Detailed fallback report if key is not active
    analysisResult = `### 🚨 Critical Inventory Warnings & Restock Plan

1. **Kitwe Support Clinic (Copperbelt)**  
   * **Current stock:** 12 ART kits, 8 Test kits  
   * **Safety Minimum:** 100 ART kits, 100 Test kits  
   * **Status:** **CRITICAL STOCKOUT RISK**  
   * **Action Required:** Urgently dispatch **88 ART kits** and **92 Test kits** from the Main Lusaka Depot within the next 24 hours.
   
2. **Livingstone Outpost (Southern Province)**  
   * **Current stock:** 35 ART kits, 24 Test kits  
   * **Safety Minimum:** 80 ART kits, 60 Test kits  
   * **Status:** **UNDER-STOCKED**  
   * **Action Required:** Logistics team should initiate a routine transfer of **45 ART kits** and **40 Test kits** alongside general condom supplies.

***

### 📍 GIS Field Outreach Target Priorities

Based on current community testing data:
* **Intercity Bus Terminus (Lusaka):** Tested **280** clients | **9** Reactives (**3.2% positivity rate**)
* **Kabwata Market (Lusaka):** Tested **145** clients | **4** Reactives (**2.7% positivity rate**)
* **Chifubu Market (Ndola, Copperbelt):** Tested **110** clients | **2** Reactives (**1.8% positivity rate**)

**Strategic Dispatch Recommendation:**
* Mobile Health Van B should prioritize the **Intercity Bus Terminus** and nearby high-traffic transport hubs. The high testing volume and elevated positivity rate indicate immediate peer counselor deployment and condom distribution are required at these high-transit zones.
* Route Copperbelt Field Van 1 to establish a weekly screening outpost in **Kitwe's industrial area**, close to where clinic stock has dropped, ensuring active testing bridges the supply deficit.

***

### 💬 Bespoke Empathetic Adherence Templates

1. **Empathetic Reminder (Nyanja Context - Lusaka):**  
   *"AHF Care: Muli bwanji. Just a warm reminder to take your daily wellness companion today with food. Your health is your family's strength. Call us for any advice."*
   
2. **Community Support Reminder (Bemba Context - Copperbelt):**  
   *"AHF Support: Mulishani! We are proud of your adherence journey. If you need any help or support, Dr. Chileshe is active on our secure group chat right now."*`;
  }

  res.json({ success: true, analysis: analysisResult });
});

// Configure Vite or Serve static bundle
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AHF Zambia Digital Bridge backend listening on port ${PORT}`);
  });
}

startServer();
