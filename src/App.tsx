import React, { useState, useEffect } from "react";
import { Clinic, SmsReminder, FieldLog, ForumPost, ChatMessage } from "./types";
import AHFLogo from "./components/AHFLogo";
import AIOperationsAdvisor from "./components/AIOperationsAdvisor";
import { 
  Building2, 
  MapPin, 
  Plus, 
  Send, 
  MessageSquare, 
  ShieldAlert, 
  CheckCircle, 
  Truck, 
  AlertTriangle, 
  BellRing, 
  Users, 
  Heart, 
  MessageCircle, 
  Lock, 
  HelpCircle,
  FileSpreadsheet,
  Globe,
  Radio,
  Zap,
  Activity,
  Smile,
  RefreshCw,
  Info,
  Sparkles
} from "lucide-react";

export default function App() {
  // Navigation Tabs: 'launcher', 'admin', 'community'
  const [activeTab, setActiveTab] = useState<"launcher" | "admin" | "community">("community");
  const [adminDept, setAdminDept] = useState<"all" | "logistics" | "outreach" | "clinical">("all");
  
  // State from server/API with dynamic local updates
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [smsQueue, setSmsQueue] = useState<SmsReminder[]>([]);
  const [fieldLogs, setFieldLogs] = useState<FieldLog[]>([]);
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);
  
  // Community active state
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostCategory, setNewPostCategory] = useState("side_effects");
  const [anonUsername, setAnonUsername] = useState("LusakaHope26");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});

  // Doctor Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // New Restock Modals/State
  const [selectedClinicId, setSelectedClinicId] = useState("lsk-1");
  const [restockType, setRestockType] = useState<"artkits" | "condoms" | "testKits">("artkits");
  const [restockAmount, setRestockAmount] = useState(100);

  // New Field Log Creator
  const [newLocation, setNewLocation] = useState("");
  const [newReached, setNewReached] = useState(150);
  const [newTested, setNewTested] = useState(80);
  const [newReactive, setNewReactive] = useState(2);
  const [newCondoms, setNewCondoms] = useState(500);
  const [newTeam, setNewTeam] = useState("Mobile Outreach Team C");

  // New SMS Creator
  const [smsType, setSmsType] = useState("Pharmacy ART Pick-up");
  const [smsClinic, setSmsClinic] = useState("AHF Lusaka Clinic (HQ)");
  const [smsPhone, setSmsPhone] = useState("+260 97 ");
  const [smsMessage, setSmsMessage] = useState("AHF Care: Restock alert or general appointment update.");
  const [smsPatientName, setSmsPatientName] = useState("");

  // Loading States
  const [loadingClinics, setLoadingClinics] = useState(true);
  const [loadingForum, setLoadingForum] = useState(true);

  // Global alert message and dynamic synthesized chiptunes
  const [globalToast, setGlobalToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Synthesize custom auditory feedback using Web Audio API
  const playAudioChime = (type: "success" | "error" | "info" = "success") => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const playTone = (freq: number, start: number, duration: number, toneType: OscillatorType = "sine") => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = toneType;
        
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(type === "error" ? 0.06 : 0.04, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        
        osc.start(start);
        osc.stop(start + duration);
      };

      if (type === "success") {
        playTone(523.25, ctx.currentTime, 0.12); // C5
        playTone(659.25, ctx.currentTime + 0.06, 0.12); // E5
        playTone(783.99, ctx.currentTime + 0.12, 0.3); // G5
      } else if (type === "error") {
        playTone(240, ctx.currentTime, 0.15, "triangle");
        playTone(190, ctx.currentTime + 0.08, 0.25, "triangle");
      } else {
        // Info chime
        playTone(587.33, ctx.currentTime, 0.08); // D5
        playTone(880, ctx.currentTime + 0.06, 0.2); // A5
      }
    } catch (e) {
      // Swallowed safely - background page context constraints
    }
  };

  const triggerToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    setGlobalToast({ message: msg, type });
    playAudioChime(type);
    setTimeout(() => setGlobalToast(null), 4000);
  };

  // Advanced Interactive State Enhancements
  const [selectedClinicDetailsId, setSelectedClinicDetailsId] = useState<string | null>(null);
  const [gisDetailsDistrict, setGisDetailsDistrict] = useState<string>("Lusaka");
  
  // Interactive side-effects advisor helper
  const [selectedSideEffectInfo, setSelectedSideEffectInfo] = useState<string | null>(null);
  
  // Stigma-free Client intake schedule companion (streak tracker)
  const [pillLog, setPillLog] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("ahf_pill_log");
      return saved ? JSON.parse(saved) : {
        "Mon": true,
        "Tue": true,
        "Wed": false,
        "Thu": false,
        "Fri": false,
        "Sat": false,
        "Sun": false
      };
    } catch {
      return { "Mon": true, "Tue": true, "Wed": false, "Thu": false, "Fri": false, "Sat": false, "Sun": false };
    }
  });

  const [pillStreak, setPillStreak] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("ahf_pill_streak");
      return saved ? Number(saved) : 5; // Default starter streak
    } catch {
      return 5;
    }
  });

  // Toggle dynamic daily intake pill log
  const handleTogglePill = (day: string) => {
    const nextLogs = { ...pillLog, [day]: !pillLog[day] };
    setPillLog(nextLogs);
    try {
      localStorage.setItem("ahf_pill_log", JSON.stringify(nextLogs));
    } catch (e) {}

    // Calculate current contiguous streak of filled doses
    const daysOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    let computedStreak = 0;
    for (const d of daysOrder) {
      if (nextLogs[d]) {
        computedStreak += 1;
      } else {
        break; // contiguous streak broken or not yet attained
      }
    }
    
    // Set streak
    const finalStreak = computedStreak > 0 ? computedStreak + 3 : 2; // Keep starter streak offset
    setPillStreak(finalStreak);
    try {
      localStorage.setItem("ahf_pill_streak", String(finalStreak));
    } catch (e) {}

    if (!pillLog[day]) {
      triggerToast(`Dose registered for ${day}! Perfect regimen adherence registered.`, "success");
    } else {
      triggerToast(`Dose unchecked for ${day}. Remember daily suppression is power.`, "info");
    }
  };

  // Draft Encouragement to post forum board
  const handleDraftStreakForumPost = () => {
    setNewPostCategory("pregnancy");
    setNewPostTitle(`My Regimen Journey: Hit a ${pillStreak}-day streak!`);
    setNewPostContent(`I wanted to encourage all peer buddies here. I just registered a continuous ${pillStreak}-day full ART medication intake streak using my SafeSpace tracker. Take your doses regularly under safe maize food, the side effects totally clear up by month 1! Stay resilient.`);
    triggerToast("Empathetic encouragement drafted in the supportive peer form generator below!", "info");
  };

  // List of professional cute avatars
  const avatars = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&h=100&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&h=100&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80"
  ];
  const [avatarIndex, setAvatarIndex] = useState(0);

  // Fetch initial data
  const loadAllData = async () => {
    try {
      setLoadingClinics(true);
      const clinicsRes = await fetch("/api/clinics");
      const clinicsData = await clinicsRes.json();
      setClinics(clinicsData);

      const smsRes = await fetch("/api/sms-queue");
      const smsData = await smsRes.json();
      setSmsQueue(smsData);

      const fieldRes = await fetch("/api/field-logs");
      const fieldData = await fieldRes.json();
      setFieldLogs(fieldData);

      setLoadingClinics(false);
    } catch (e) {
      console.error("Error loading clinics metadata:", e);
    }

    try {
      setLoadingForum(true);
      const forumRes = await fetch("/api/forum/posts");
      const forumData = await forumRes.json();
      setForumPosts(forumData);
      setLoadingForum(false);
    } catch (e) {
      console.error("Error loading forums:", e);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Fetch chat when username changes
  useEffect(() => {
    const fetchChat = async () => {
      try {
        const chatRes = await fetch(`/api/chat/doctor?username=${encodeURIComponent(anonUsername)}`);
        const chatData = await chatRes.json();
        setChatMessages(chatData);
      } catch (e) {
        console.error("Error loading chat:", e);
      }
    };
    fetchChat();
  }, [anonUsername]);

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockAmount || restockAmount <= 0) return;
    try {
      const res = await fetch("/api/clinics/restock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedClinicId,
          type: restockType,
          amount: restockAmount
        })
      });
      const data = await res.json();
      if (data.success) {
        setClinics(prev => prev.map(c => c.id === selectedClinicId ? data.clinic : c));
        const matched = clinics.find(c => c.id === selectedClinicId);
        triggerToast(`Successfully dispatched ${restockAmount} ${restockType === "artkits" ? "ART Antiretroviral Kits" : restockType === "condoms" ? "Condoms" : "Rapid Testing Kits"} to ${matched?.name || 'Clinic'}.`, "success");
      }
    } catch (e) {
      triggerToast("Failed to record restock in database", "error");
    }
  };

  const handleQuickRefill = async (clinicId: string, type: "artkits" | "condoms" | "testKits", amount: number) => {
    try {
      const res = await fetch("/api/clinics/restock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: clinicId,
          type,
          amount
        })
      });
      const data = await res.json();
      if (data.success) {
        setClinics(prev => prev.map(c => c.id === clinicId ? data.clinic : c));
        const label = type === "artkits" ? "ART Kits" : type === "condoms" ? "Condoms" : "Rapid Test Kits";
        triggerToast(`Quick Dispatched +${amount} ${label} to ${data.clinic.name}!`, "success");
      }
    } catch (e) {
      triggerToast("Could not process fast restock", "error");
    }
  };

  const handleAddSmsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/sms-queue/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: smsType,
          clinic: smsClinic,
          message: smsMessage,
          phoneNumber: smsPhone,
          patientName: smsPatientName
        })
      });
      const data = await res.json();
      if (data.success) {
        setSmsQueue(prev => [data.sms, ...prev]);
        setSmsPatientName("");
        setSmsPhone("+260 97 ");
        triggerToast("Discreet adherence reminder listed in automatic queue pipeline.", "success");
      }
    } catch (e) {
      triggerToast("Failed to queue SMS reminder", "error");
    }
  };

  const triggerSmsSend = async (smsId: string) => {
    try {
      const res = await fetch("/api/sms-queue/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: smsId })
      });
      const data = await res.json();
      if (data.success) {
        setSmsQueue(prev => prev.map(s => s.id === smsId ? data.sms : s));
        triggerToast("Discreet SMS pushed instantly to Zambia Telecom Gateways!", "success");
      }
    } catch (e) {
      triggerToast("Failed to dispatch SMS", "error");
    }
  };

  const handleFieldLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocation) {
      triggerToast("Please provide an outreach location target.", "error");
      return;
    }
    try {
      const res = await fetch("/api/field-logs/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: newLocation,
          reached: newReached,
          tested: newTested,
          reactive: newReactive,
          condoms: newCondoms,
          team: newTeam
        })
      });
      const data = await res.json();
      if (data.success) {
        setFieldLogs(prev => [data.log, ...prev]);
        setNewLocation("");
        triggerToast(`Outreach data logged! Regional hot-spot indicators updated automatically.`, "success");
      }
    } catch (e) {
      triggerToast("Error publishing field log", "error");
    }
  };

  const randAnonName = () => {
    const prefixed = ["LusakaHope", "CopperbeltSafe", "NdolaPower", "ZambiaProud", "VictoriaCare", "KaribaFriend"];
    const suffix = Math.floor(Math.random() * 900) + 100;
    const name = `${prefixed[Math.floor(Math.random() * prefixed.length)]}${suffix}`;
    setAnonUsername(name);
    setAvatarIndex(prev => (prev + 1) % avatars.length);
    triggerToast(`Anonymous pseudonym generated: ${name}. Your real safety remains protected!`, "info");
  };

  const handleCreateForumPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || !newPostTitle.trim()) {
      triggerToast("Forum topic and description cannot be left blank.", "error");
      return;
    }

    try {
      const res = await fetch("/api/forum/posts/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: newPostCategory,
          title: newPostTitle,
          author: anonUsername,
          content: newPostContent,
          avatar: avatars[avatarIndex]
        })
      });
      const data = await res.json();
      if (data.success) {
        setForumPosts(prev => [data.post, ...prev]);
        setNewPostTitle("");
        setNewPostContent("");
        triggerToast("Safe space forum post successfully added!", "success");
      }
    } catch (e) {
      triggerToast("Failed to publish forum state", "error");
    }
  };

  const handleAddReply = async (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    const content = replyContent[postId];
    if (!content || !content.trim()) return;

    try {
      const res = await fetch("/api/forum/posts/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          author: anonUsername,
          isVerified: false,
          role: "Patient Peer",
          avatar: avatars[avatarIndex],
          content: content
        })
      });
      const data = await res.json();
      if (data.success) {
        setForumPosts(prev => prev.map(p => {
          if (p.id === postId) {
            return { ...p, replies: [...p.replies, data.reply] };
          }
          return p;
        }));
        setReplyContent(prev => ({ ...prev, [postId]: "" }));
        triggerToast("Support reply logged anonymously!", "success");
      }
    } catch (e) {
      triggerToast("Failed to reply", "error");
    }
  };

  const handleSendDoctorChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput("");
    setChatLoading(true);

    // optimistic patient push
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    const optimisticMessage: ChatMessage = {
      id: `opt-${Date.now()}`,
      sender: "patient",
      content: userMsg,
      timestamp: timeStr
    };
    setChatMessages(prev => [...prev, optimisticMessage]);

    try {
      const res = await fetch("/api/chat/doctor/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: anonUsername,
          message: userMsg
        })
      });
      const data = await res.json();
      if (data.success) {
        setChatMessages(data.messages);
      }
    } catch (e) {
      triggerToast("Failed to route request to medical AI endpoint", "error");
    } finally {
      setChatLoading(false);
    }
  };

  // Interactive preset triggers from the presentation kit
  const handleSimulateAction = async (actionType: string) => {
    if (actionType === "sim_stockout") {
      // Simulate critical stockout on Ndola or Livingstone to let hiring managers see the system alert
      setClinics(prev => prev.map(c => {
        if (c.id === "ndl-2") {
          return {
            ...c,
            supplies: {
              ...c.supplies,
              artkits: 14, // Drops to low critical alert range
              condoms: 400,
              testKits: 11
            }
          };
        }
        return c;
      }));
      // Switch tab to admin and tell user
      setActiveTab("admin");
      triggerToast("Simulated low stock levels alert in AHF Ndola Clinic! Check Smart Tracker.", "info");
    } else if (actionType === "sim_outreach") {
      // Create outreach record
      try {
        const res = await fetch("/api/field-logs/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "Chilenje Mobile Market Station",
            reached: 450,
            tested: 195,
            reactive: 15, // Hot-spot alerts!
            condoms: 5000,
            team: "Lusaka Mobile Outreach Team B"
          })
        });
        const data = await res.json();
        if (data.success) {
          setFieldLogs(prev => [data.log, ...prev]);
          setActiveTab("admin");
          triggerToast("Logged 15 positive reactive diagnostics at Chilenje. Hotspot Map updated!", "success");
        }
      } catch (e) {
        console.error(e);
      }
    } else if (actionType === "sim_default_reminder") {
      // Push missed appointment SMS
      try {
        const res = await fetch("/api/sms-queue/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "Default Follow-up",
            clinic: "AHF Chipata Hub",
            message: "AHF Support: Your next wellness & medication review was yesterday. We safely preserved your medicine. We welcome you back anytime.",
            phoneNumber: "+260 95 **** 8295",
            patientName: "Hidden Patient #911",
            scheduledDate: "Immediate"
          })
        });
        const data = await res.json();
        if (data.success) {
          setSmsQueue(prev => [data.sms, ...prev]);
          setActiveTab("admin");
          triggerToast("Adherence follow-up alert loaded into live queue database!", "success");
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  if (activeTab === "launcher") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 justify-between items-center relative overflow-hidden" id="applet-launcher-container">
        {/* Ambient background decoration */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-[#A1231E]"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-50 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-50 rounded-full blur-3xl opacity-60"></div>

        {/* Global Toast Alert Indicator */}
        {globalToast && (
          <div className="fixed bottom-14 right-4 md:right-8 z-50 animate-bounce max-w-sm" id="global-toast-launcher">
            <div className={`p-4 rounded-xl shadow-xl border flex items-start gap-3 transition-all ${
              globalToast.type === "success" 
                ? "bg-emerald-950 border-emerald-800 text-emerald-100" 
                : globalToast.type === "error"
                ? "bg-rose-950 border-rose-800 text-rose-100"
                : "bg-blue-950 border-blue-800 text-blue-100"
            }`}>
              <div className="mt-0.5 shrink-0">
                {globalToast.type === "success" && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                {globalToast.type === "error" && <AlertTriangle className="w-5 h-5 text-rose-400" />}
                {globalToast.type === "info" && <Zap className="w-5 h-5 text-blue-400" />}
              </div>
              <div>
                <p className="text-xs font-mono tracking-wider font-bold uppercase opacity-80">System Activity Stream</p>
                <p className="text-xs mt-0.5 leading-relaxed font-semibold">{globalToast.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Launcher Core Content */}
        <div className="flex-1 max-w-5xl w-full flex flex-col justify-center px-6 py-8 md:py-16 z-10">
          {/* Official AHF Logo & Header */}
          <div className="text-center mb-10 md:mb-14">
            <AHFLogo size="lg" className="mx-auto mb-6 hover:scale-105 transition-transform duration-300" />
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-950 uppercase mt-4">
              Digital Health Worksuite
            </h1>
            <p className="text-slate-500 text-xs md:text-sm font-medium tracking-wide mt-2 max-w-xl mx-auto">
              Custom clinical logistics trackers and secure anonymized patient networks engineered for AHF Zambia. Elect a workspace below to develop or present.
            </p>
          </div>

          {/* Dual Bento Grid Choices */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            
            {/* Card 1: Administrative Control portal */}
            <div 
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-red-200 transition-all duration-350 p-6 flex flex-col justify-between group cursor-pointer relative overflow-hidden" 
              onClick={() => {
                setActiveTab("admin");
                triggerToast("Connected to AHF Zambia Primary Operations Center database.", "info");
              }}
              id="launcher-card-admin"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 rounded-bl-full flex items-center justify-center transition-colors group-hover:bg-red-100/50">
                <Building2 className="w-5 h-5 text-red-600 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-[#A1231E] bg-red-50 border border-red-100 px-2 py-0.5 rounded uppercase tracking-wider">
                  Operational Dashboard (Part 1)
                </span>
                <h3 className="text-lg font-bold text-slate-950 mt-4 group-hover:text-[#A1231E] transition-colors font-display uppercase tracking-tight">
                  Logistics & Outreach Hub
                </h3>
                <p className="text-slate-500 text-xs mt-2.5 leading-relaxed">
                  Engineered for staff coordinators. Houses the clinical stock monitor, interactive GIS outreach map layer, team metrics, and automatic adherence SMS reminding systems.
                </p>
                
                <ul className="mt-5 space-y-2 text-xs font-semibold text-slate-700">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A1231E]"></span> 
                    Real-time stockout trackers
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A1231E]"></span> 
                    GIS outreach diagnostics dashboard
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A1231E]"></span> 
                    Airtel/MTN telecom SMS dispatch queues
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <button className="w-full py-2.5 bg-slate-950 group-hover:bg-[#A1231E] text-white font-bold text-xs tracking-wide uppercase rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5">
                  Boot Logistics Portal <Activity className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Card 2: Patient SafeSpace Client */}
            <div 
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-indigo-200 transition-all duration-350 p-6 flex flex-col justify-between group cursor-pointer relative overflow-hidden" 
              onClick={() => {
                setActiveTab("community");
                triggerToast("Confidential secure session initialized successfully.", "info");
              }}
              id="launcher-card-patient"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50 rounded-bl-full flex items-center justify-center transition-colors group-hover:bg-indigo-100/50">
                <Users className="w-5 h-5 text-indigo-600 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded uppercase tracking-wider">
                  Client Application (Part 2)
                </span>
                <h3 className="text-lg font-bold text-slate-950 mt-4 group-hover:text-indigo-700 transition-colors font-display uppercase tracking-tight">
                  Patient SafeSpace & Care
                </h3>
                <p className="text-slate-500 text-xs mt-2.5 leading-relaxed">
                  Stigma-free, zero-rated smartphone service. Protects patient safety with randomize-pseudonym layers, medication side-effect threads, and secure direct-to-doctor chat.
                </p>
                
                <ul className="mt-5 space-y-2 text-xs font-semibold text-slate-700">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span> 
                    Anti-stigma pseudonym keys
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span> 
                    Interactive medical specialist chat
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span> 
                    Peer support forums
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <button className="w-full py-2.5 bg-indigo-950 group-hover:bg-indigo-700 text-white font-bold text-xs tracking-wide uppercase rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5">
                  Launch Client SafeSpace <Smile className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Elegant Footer */}
        <footer className="w-full max-w-5xl px-6 py-6 border-t border-slate-200/60 text-center text-slate-400 text-[11px] font-mono flex flex-col sm:flex-row justify-between items-center gap-4 z-10">
          <span>Official AHF Zambia IT Department Intern Application Proposal</span>
          <span>Friday Chansa Victor Profile</span>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col font-sans text-slate-900" id="applet-main-container">
      
      {/* Toast Alert Indicator */}
      {globalToast && (
        <div className="fixed bottom-14 right-4 md:right-8 z-50 animate-bounce max-w-sm" id="global-toast">
          <div className={`p-4 rounded-xl shadow-xl border flex items-start gap-3 transition-all ${
            globalToast.type === "success" 
              ? "bg-emerald-950 border-emerald-800 text-emerald-100" 
              : globalToast.type === "error"
              ? "bg-rose-950 border-rose-800 text-rose-100"
              : "bg-blue-950 border-blue-800 text-blue-100"
          }`}>
            <div className="mt-0.5 shrink-0">
              {globalToast.type === "success" && <CheckCircle className="w-5 h-5 text-emerald-400" />}
              {globalToast.type === "error" && <AlertTriangle className="w-5 h-5 text-rose-400" />}
              {globalToast.type === "info" && <Zap className="w-5 h-5 text-blue-400" />}
            </div>
            <div>
              <p className="text-xs font-mono tracking-wider font-bold uppercase opacity-80">System Activity Stream</p>
              <p className="text-xs mt-0.5 leading-relaxed font-semibold">{globalToast.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Primary Navigation Header - Apple Design Language */}
      <header className="bg-white/90 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200/60 px-4 md:px-8 py-3.5 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 shadow-xs" id="app-header">
        {/* Brand section */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <AHFLogo size="sm" className="mr-1 shrink-0 hover:scale-105 transition-all duration-300" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm md:text-base font-extrabold leading-none tracking-tight text-slate-900 font-display uppercase">AHF ZAMBIA</h1>
                <span className="text-[9px] uppercase font-mono font-black bg-red-50 text-[#A1231E] px-2 py-0.5 rounded-full border border-red-100 animate-pulse">PRO SERIES</span>
              </div>
              <p className="text-[9px] text-slate-400 font-mono tracking-widest uppercase mt-1">Smart Health Workstation</p>
            </div>
          </div>
        </div>

        {/* Apple Segment Switcher - CENTERED & HIGH FIDELITY */}
        <div className="flex justify-center items-center w-full md:w-auto" id="apple-segment-switcher">
          <div className="bg-slate-100/90 p-1 rounded-full flex items-center border border-slate-200/50 shadow-inner relative">
            <button
              onClick={() => {
                setActiveTab("community");
                triggerToast("Switched to Patient SafeSpace Client Portal. Confidentiality engaged.", "info");
              }}
              className={`px-5 py-1.5 rounded-full text-[11px] font-bold transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                activeTab === "community"
                  ? "bg-white text-slate-950 shadow-xs scale-102"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              id="apple-switch-client"
            >
              <Smile className="w-3.5 h-3.5 text-indigo-500" />
              <span>Patient Client App</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("admin");
                triggerToast("Connected to live Operational Control Center.", "info");
              }}
              className={`px-5 py-1.5 rounded-full text-[11px] font-bold transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                activeTab === "admin"
                  ? "bg-white text-slate-950 shadow-xs scale-102"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              id="apple-switch-dashboard"
            >
              <Building2 className="w-3.5 h-3.5 text-[#A1231E]" />
              <span>Operational Dashboard</span>
            </button>
          </div>
        </div>

        {/* Right side actions - Presenter's Kit & Profiles */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-xs font-bold leading-none text-slate-800">Friday Chansa Victor</p>
              <p className="text-[9px] text-slate-400 font-mono tracking-wider mt-0.5">IT Intern Candidate</p>
            </div>
            <button 
              onClick={() => {
                triggerToast("Friday Chansa Victor — Ready to make an impact as an IT Intern Candidate.", "success");
              }}
              className="w-8 h-8 rounded-full bg-slate-950 text-white flex items-center justify-center font-bold text-xs uppercase hover:bg-slate-800 transition-all cursor-pointer border border-slate-800 shadow-xs"
              title="View Developer Internship Profile"
              id="user-profile-button-apple"
            >
              FC
            </button>
          </div>
        </div>
      </header>

      {/* Sub-header mini information panel */}
      <div className="bg-slate-50 border-b border-slate-200/50 px-4 md:px-8 py-1.5 flex justify-between items-center text-[10px] text-slate-500 font-mono" id="apple-sub-header">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1 text-emerald-600 font-semibold"><Lock className="w-3 h-3" /> Encrypted Session Active</span>
          <span className="text-slate-300">|</span>
          <span>Zero-Rated for MTN & Airtel Zambia</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#A1231E] animate-ping"></span>
          <span>Primary Hub Gateway: Lusaka Headquarters</span>
        </div>
      </div>

      {/* Main Core Workstations */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8" id="application-workstations">
        {activeTab === "admin" && (
          <div className="space-y-8 max-w-7xl mx-auto" id="admin-workstation">
            
            {/* Context Notice to recruit */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-red-400 font-mono text-xs uppercase tracking-widest font-bold">
                  <span className="w-2 h-2 bg-red-400 rounded-full animate-ping"></span>
                  OPERATIONAL LOGISTICS INTERFACE
                </div>
                <h2 className="text-xl font-display font-medium text-white tracking-tight">Active Supply Tracker & Adherence Coordinator</h2>
                <p className="text-slate-400 text-xs">
                  This secure control dashboard tracks ART stock continuity across 5 regional hubs and powers SMS adherence queues to reduce drops.
                </p>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px] bg-slate-800 py-2 px-3.5 border border-slate-700 rounded-xl">
                <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse shrink-0" />
                <span>ACTIVE MONITORING REGION: ZAMBIA NATIONWIDE</span>
              </div>
            </div>

            {/* Department Navigation Filter for AHF Managers */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4" id="admin-department-navigation">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">Operational Departments Filter</span>
                <h4 className="text-sm font-bold text-slate-800">Select Manager Workstation</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAdminDept("all");
                    triggerToast("HQ workstation loaded. Integrated operations visible.", "info");
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    adminDept === "all"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-white border border-slate-200 hover:bg-slate-100 text-slate-600"
                  }`}
                >
                  🌐 Integrated HQ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdminDept("logistics");
                    triggerToast("Logistics department loaded. Focusing on inventory & dispatch.", "info");
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    adminDept === "logistics"
                      ? "bg-red-650 text-white shadow-xs"
                      : "bg-white border border-slate-200 hover:bg-slate-100 text-slate-600"
                  }`}
                >
                  📦 Logistics & Pharmacy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdminDept("outreach");
                    triggerToast("Outreach department loaded. Focusing on GIS & testing logs.", "info");
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    adminDept === "outreach"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-white border border-slate-200 hover:bg-slate-100 text-slate-600"
                  }`}
                >
                  📍 GIS & Field Outreach
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdminDept("clinical");
                    triggerToast("Clinical department loaded. Focusing on SMS & care retention.", "info");
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    adminDept === "clinical"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-white border border-slate-200 hover:bg-slate-100 text-slate-600"
                  }`}
                >
                  💬 Care Retention & SMS
                </button>
              </div>
            </div>

            {/* AI Operational Analytics Overview Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="admin-ai-overview-grid">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xxs flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-lg">
                  📦
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold font-mono tracking-wider">Total Balanced Stock</p>
                  <p className="text-lg font-bold text-slate-950 font-mono">
                    {clinics.reduce((acc, c) => acc + (c.supplies.artkits || 0) + (c.supplies.condoms || 0) + (c.supplies.testKits || 0), 0).toLocaleString()}
                  </p>
                  <p className="text-[9px] text-slate-500 font-medium">Distributed items across Zambia</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xxs flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
                  🛡️
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold font-mono tracking-wider">Supply Hub Stability</p>
                  <p className="text-lg font-bold text-slate-950 font-mono">
                    {clinics.length > 0 ? Math.round((clinics.filter(c => c.supplies.artkits > c.minThresholds.artkits).length / clinics.length) * 100) : 0}%
                  </p>
                  <p className="text-[9px] text-emerald-600 font-bold">
                    {clinics.filter(c => c.supplies.artkits > c.minThresholds.artkits).length} of {clinics.length} hubs above safe limit
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xxs flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
                  🗺️
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold font-mono tracking-wider">Total Field outreach Tests</p>
                  <p className="text-lg font-bold text-slate-950 font-mono">
                    {fieldLogs.reduce((acc, f) => acc + (f.tested || 0), 0).toLocaleString()}
                  </p>
                  <p className="text-[9px] text-indigo-600 font-bold">
                    Active GIS hotspot diagnostics logs
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xxs flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg">
                  ✉️
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold font-mono tracking-wider">Active Adherence Queue</p>
                  <p className="text-lg font-bold text-slate-950 font-mono">
                    {smsQueue.length} Pending
                  </p>
                  <p className="text-[9px] text-slate-500 font-medium">Stigma-safe text alerts scheduled</p>
                </div>
              </div>
            </div>

            {/* Smart Inventory Section */}
            {(adminDept === "all" || adminDept === "logistics") && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Tracker Panel (col-span-7) */}
                <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs" id="inventory-tracker-container">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 tracking-wide uppercase flex items-center gap-2">
                      <Truck className="w-4 h-4 text-red-600" /> Clinic Inventory Tracker
                    </h3>
                    <p className="text-xs text-slate-500">Live stock versus local minimum safety levels. Click on Ndola or Kitwe to restock.</p>
                  </div>
                  <button 
                    onClick={loadAllData} 
                    className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors rounded-lg border border-slate-200"
                    title="Refresh inventory levels"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {loadingClinics ? (
                    <div className="py-12 text-center text-xs text-slate-500">Retrieving clinic records...</div>
                  ) : (
                    clinics.map((clinic) => {
                      const isArtCritical = clinic.supplies.artkits <= clinic.minThresholds.artkits;
                      const isCondomsCritical = clinic.supplies.condoms <= clinic.minThresholds.condoms;
                      const isTestKitsCritical = clinic.supplies.testKits <= clinic.minThresholds.testKits;
                      const isAnyCritical = isArtCritical || isCondomsCritical || isTestKitsCritical;
                      const isExpanded = selectedClinicDetailsId === clinic.id;

                      // Simulated medical officer metadata
                      const clinicStaff = clinic.id === "lsk-1" ? { doctor: "Dr. Dorothy Chanda", nurse: "Sister Mary Tembo", supportSize: 18 }
                                        : clinic.id === "ndl-2" ? { doctor: "Dr. Mwansa Mulenga", nurse: "Br. Joseph Phiri", supportSize: 11 }
                                        : clinic.id === "lvs-3" ? { doctor: "Dr. Naomi Livingstone", nurse: "Sister Clara Mwila", supportSize: 6 }
                                        : clinic.id === "chp-4" ? { doctor: "Dr. Alice Chipata", nurse: "Sister Susan Mbewe", supportSize: 9 }
                                        : { doctor: "Dr. Peter Kalambuzi", nurse: "Br. Victor Chansa", supportSize: 7 };

                      return (
                        <div 
                          key={clinic.id} 
                          className={`p-4 rounded-xl border transition-all duration-300 ${
                            isExpanded 
                              ? "bg-slate-50 border-red-500 shadow-md ring-1 ring-red-500/10" 
                              : isAnyCritical 
                              ? "bg-red-50/50 border-red-200 hover:bg-red-50 cursor-pointer" 
                              : "bg-slate-50/30 border-slate-200 hover:bg-slate-50 cursor-pointer"
                          }`}
                          onClick={() => {
                            setSelectedClinicDetailsId(isExpanded ? null : clinic.id);
                            setSelectedClinicId(clinic.id); // Auto align shipment form
                            playAudioChime("info");
                          }}
                        >
                          <div className="flex justify-between items-start mb-2.5">
                            <div>
                              <p className="font-bold text-sm text-slate-900 flex items-center gap-1.5 hover:text-red-700 transition-colors">
                                <MapPin className={`w-3.5 h-3.5 ${isExpanded ? "text-red-600" : "text-slate-500"}`} />
                                {clinic.name}
                                <span className="text-[10px] text-slate-400 font-normal">({clinic.location})</span>
                              </p>
                              <p className="text-[10px] text-slate-500 font-mono tracking-tight">ID Code: {clinic.id.toUpperCase()}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {isAnyCritical ? (
                                <span className="text-[9px] font-mono font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded border border-red-200 uppercase tracking-widest flex items-center gap-1">
                                  <ShieldAlert className="w-3 h-3 text-red-600" /> Low Stock
                                </span>
                              ) : (
                                <span className="text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 uppercase tracking-widest">
                                  Stable
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 select-none">
                                {isExpanded ? "▲ Hide Option" : "▼ Interactive Control"}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3 text-xs">
                            {/* ART Kits progress bar */}
                            <div className="bg-white p-2 rounded-lg border border-slate-200/60 shadow-xxs">
                              <div className="flex justify-between font-medium text-[11px] mb-1">
                                <span className="text-slate-500 font-sans">ART Kits</span>
                                <span className={`font-bold ${isArtCritical ? "text-red-600 font-mono" : "text-slate-800 font-mono"}`}>
                                  {clinic.supplies.artkits}
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${isArtCritical ? "bg-red-600" : "bg-emerald-600"}`}
                                  style={{ width: `${Math.min(100, (clinic.supplies.artkits / (clinic.minThresholds.artkits * 2)) * 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-[9px] text-slate-400 block mt-1 font-mono">Min: {clinic.minThresholds.artkits}</span>
                            </div>

                            {/* Condoms Progress bar */}
                            <div className="bg-white p-2 rounded-lg border border-slate-200/60 shadow-xxs">
                              <div className="flex justify-between font-medium text-[11px] mb-1">
                                <span className="text-slate-500 font-sans">Condoms</span>
                                <span className={`font-bold ${isCondomsCritical ? "text-red-700 font-mono" : "text-slate-800 font-mono"}`}>
                                  {clinic.supplies.condoms}
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${isCondomsCritical ? "bg-red-600" : "bg-emerald-600"}`}
                                  style={{ width: `${Math.min(100, (clinic.supplies.condoms / (clinic.minThresholds.condoms * 1.8)) * 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-[9px] text-slate-400 block mt-1 font-mono">Min: {clinic.minThresholds.condoms}</span>
                            </div>

                            {/* Testing kits progress bar */}
                            <div className="bg-white p-2 rounded-lg border border-slate-200/60 shadow-xxs">
                              <div className="flex justify-between font-medium text-[11px] mb-1">
                                <span className="text-slate-500 font-sans">Rapid Test</span>
                                <span className={`font-bold ${isTestKitsCritical ? "text-red-600 font-mono" : "text-slate-800 font-mono"}`}>
                                  {clinic.supplies.testKits}
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${isTestKitsCritical ? "bg-red-600" : "bg-emerald-600"}`}
                                  style={{ width: `${Math.min(100, (clinic.supplies.testKits / (clinic.minThresholds.testKits * 2)) * 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-[9px] text-slate-400 block mt-1 font-mono">Min: {clinic.minThresholds.testKits}</span>
                            </div>
                          </div>

                          {/* Expanded interactive control center panel */}
                          {isExpanded && (
                            <div 
                              className="mt-4 p-3 bg-white rounded-lg border border-red-100 space-y-3 shadow-inner text-xs"
                              onClick={(e) => {
                                e.stopPropagation(); // Stop parent uncollapse bouncers
                              }}
                            >
                              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-100 pb-2 text-[11px]">
                                <div className="space-y-0.5">
                                  <p className="font-bold text-slate-800 uppercase tracking-wide">👨‍⚕️ Clinical Facility Team Logs</p>
                                  <p className="text-slate-500">Lead: <strong>{clinicStaff.doctor}</strong> | Nurse Lead: <strong>{clinicStaff.nurse}</strong></p>
                                </div>
                                <span className="text-[10px] bg-red-50 text-[#A1231E] px-2 py-0.5 rounded font-bold font-mono">
                                  {clinicStaff.supportSize} Field Volunteers Active
                                </span>
                              </div>

                              <div className="space-y-1.5">
                                <p className="font-bold text-slate-700 text-[10px] uppercase tracking-wider">⚡ Instant Refill Dispatcher (One-Tape Restocking)</p>
                                <div className="grid grid-cols-3 gap-2">
                                  <button
                                    onClick={() => handleQuickRefill(clinic.id, "artkits", 100)}
                                    className="py-1.5 px-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-[10px] uppercase tracking-wide transition-colors cursor-pointer text-center"
                                  >
                                    +100 ART Units
                                  </button>
                                  <button
                                    onClick={() => handleQuickRefill(clinic.id, "condoms", 3000)}
                                    className="py-1.5 px-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-[10px] uppercase tracking-wide transition-colors cursor-pointer text-center"
                                  >
                                    +3k Condoms
                                  </button>
                                  <button
                                    onClick={() => handleQuickRefill(clinic.id, "testKits", 80)}
                                    className="py-1.5 px-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] uppercase tracking-wide transition-colors cursor-pointer text-center"
                                  >
                                    +80 Test Kits
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Action Modals and Creators (col-span-5) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Simulated Shipment Router form */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs" id="shipment-router-form">
                  <h4 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wide flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-slate-600" /> Route Medical Shipment
                  </h4>
                  <form onSubmit={handleRestockSubmit} className="space-y-3.5">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Target Client Clinic</label>
                      <select 
                        value={selectedClinicId}
                        onChange={(e) => setSelectedClinicId(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 text-slate-800"
                      >
                        {clinics.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.location})</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Items Dispatched</label>
                        <select
                          value={restockType}
                          onChange={(e) => setRestockType(e.target.value as any)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 text-slate-800"
                        >
                          <option value="artkits">ART Medication Units</option>
                          <option value="condoms">Condoms (Bulk)</option>
                          <option value="testKits">Rapid HIV Test Kits</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Total Quantity</label>
                        <input
                          type="number"
                          value={restockAmount}
                          onChange={(e) => setRestockAmount(Math.max(10, Number(e.target.value)))}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 text-slate-800"
                          min="10"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold tracking-wide transition-colors uppercase shadow-sm"
                    >
                      Authenticate & Dispatch Logistics
                    </button>
                  </form>
                </div>

                {/* Regional Stats Badge */}
                <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold tracking-wider text-rose-400 block">ADHERENCE ALGORITHMS</span>
                    <h5 className="font-semibold text-sm mt-0.5 text-slate-100">Patients On SMS Reminders</h5>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-white block">1,824</span>
                    <span className="text-[10px] text-emerald-400 font-semibold block">● Live Adhering</span>
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Field Map and Outreach Data Logs */}
            {(adminDept === "all" || adminDept === "outreach" || adminDept === "clinical") && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Interactive GIS hot-spot visualizer */}
                {(adminDept === "all" || adminDept === "outreach") && (
                  <div className={`${adminDept === "outreach" ? "lg:col-span-12" : "lg:col-span-8"} bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col`}>
                <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Globe className="w-4 h-4 text-emerald-600" /> Rural & Urban Hotspot Outreach GIS
                    </h3>
                    <p className="text-xs text-slate-500">Interactive testing-density mapping. Shows where Mobile Van outreach results require dispatch prioritizations.</p>
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-mono font-bold">LIVE VECTOR CHART</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1">
                  
                  {/* Beautiful SVG Interactive outline mockup of Zambia Clinical Districts */}
                  <div className="md:col-span-7 bg-slate-950 rounded-xl p-4 flex flex-col justify-between min-h-[300px] relative overflow-hidden shadow-inner border border-slate-800" id="interactive-zambia-gis-map">
                    {/* Abstract Zambia grid lines representing coordinates */}
                    <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                    
                    <div className="relative flex justify-between items-start z-10">
                      <span className="text-[9px] font-mono text-slate-500">ZAMBIA COORDINATE RADIAL RANGES</span>
                      <div className="px-2 py-0.5 bg-red-600 text-white rounded text-[8px] font-mono animate-pulse uppercase">HOT DETECTION ON AIR</div>
                    </div>

                    <div className="relative my-auto flex flex-col items-center justify-center py-6 text-center z-10" id="map-hotspot-display">
                      {/* Interactive Visual circles representing cities scaled by tested positives */}
                      <div className="relative w-full max-w-[280px] h-[190px]">
                        
                        {/* Ndola Beacon */}
                        <div 
                          className={`absolute top-[25%] left-[55%] flex flex-col items-center cursor-pointer group transition-transform ${gisDetailsDistrict === "Ndola" ? "scale-110" : ""}`} 
                          style={{ transform: "translate(-50%, -50%)" }}
                          onClick={() => {
                            setGisDetailsDistrict("Ndola");
                            setSelectedClinicId("ndl-2");
                            triggerToast("GIS Focus: Ndola Urban District. High Testing Urgency registered.", "info");
                          }}
                        >
                          <span className="w-4.5 h-4.5 bg-red-500 rounded-full animate-ping absolute opacity-60"></span>
                          <span className={`w-3 h-3 rounded-full border border-white transition-colors duration-150 ${gisDetailsDistrict === "Ndola" ? "bg-white" : "bg-red-600 group-hover:bg-red-500"}`} title="Ndola Hotspot"></span>
                          <span className="text-[9px] font-bold text-slate-300 mt-1 bg-slate-900/90 px-1 py-0.5 rounded backdrop-blur">Ndola (Alert)</span>
                        </div>

                        {/* Lusaka HQ Beacon */}
                        <div 
                          className={`absolute bottom-[23%] left-[62%] flex flex-col items-center cursor-pointer group transition-transform ${gisDetailsDistrict === "Lusaka" ? "scale-110" : ""}`} 
                          style={{ transform: "translate(-50%, -50%)" }}
                          onClick={() => {
                            setGisDetailsDistrict("Lusaka");
                            setSelectedClinicId("lsk-1");
                            triggerToast("GIS Focus: Lusaka Central Province. Main Operations Hub selected.", "info");
                          }}
                        >
                          <span className="w-6 h-6 bg-emerald-400 rounded-full animate-pulse absolute opacity-40"></span>
                          <span className={`w-3.5 h-3.5 rounded-full border border-white transition-colors duration-150 ${gisDetailsDistrict === "Lusaka" ? "bg-white" : "bg-emerald-500 group-hover:bg-emerald-400"}`} title="Lusaka Hub"></span>
                          <span className="text-[9px] font-bold text-emerald-400 mt-1 bg-slate-900/90 px-1.5 py-0.5 rounded backdrop-blur">Lusaka HQ</span>
                        </div>

                        {/* Livingstone Beacon */}
                        <div 
                          className={`absolute bottom-[10%] left-[25%] flex flex-col items-center cursor-pointer group transition-transform ${gisDetailsDistrict === "Livingstone" ? "scale-110" : ""}`} 
                          style={{ transform: "translate(-50%, -50%)" }}
                          onClick={() => {
                            setGisDetailsDistrict("Livingstone");
                            setSelectedClinicId("lvs-3");
                            triggerToast("GIS Focus: Livingstone Southern Border Outpost.", "info");
                          }}
                        >
                          <span className="w-3.5 h-3.5 bg-red-400 rounded-full animate-pulse absolute opacity-50"></span>
                          <span className={`w-2.5 h-2.5 rounded-full border border-white transition-colors duration-150 ${gisDetailsDistrict === "Livingstone" ? "bg-white" : "bg-red-500 group-hover:bg-red-400"}`} title="Livingstone Hub"></span>
                          <span className="text-[9px] font-bold text-slate-300 mt-1 bg-slate-900/90 px-1 py-0.5 rounded backdrop-blur">Livingstone</span>
                        </div>

                        {/* Kitwe Beacon */}
                        <div 
                          className={`absolute top-[22%] left-[45%] flex flex-col items-center cursor-pointer group transition-transform ${gisDetailsDistrict === "Kitwe" ? "scale-110" : ""}`} 
                          style={{ transform: "translate(-50%, -50%)" }}
                          onClick={() => {
                            setGisDetailsDistrict("Kitwe");
                            setSelectedClinicId("ktw-5");
                            triggerToast("GIS Focus: Kitwe Copperbelt Central Support Clinic. Critical stock Warning active.", "error");
                          }}
                        >
                          <span className="w-4 h-4 bg-red-500 rounded-full animate-ping absolute opacity-60"></span>
                          <span className={`w-3 h-3 rounded-full border border-white transition-colors duration-150 ${gisDetailsDistrict === "Kitwe" ? "bg-white" : "bg-red-600 group-hover:bg-red-500"}`} title="Kitwe Alerts"></span>
                          <span className="text-[9px] font-bold text-red-400 mt-1 bg-slate-900/90 px-1 py-0.5 rounded backdrop-blur">Kitwe Alert</span>
                        </div>

                        {/* Chipata East Beacon */}
                        <div 
                          className={`absolute top-[40%] right-[5%] flex flex-col items-center cursor-pointer group transition-transform ${gisDetailsDistrict === "Chipata" ? "scale-110" : ""}`} 
                          style={{ transform: "translate(-50%, -50%)" }}
                          onClick={() => {
                            setGisDetailsDistrict("Chipata");
                            setSelectedClinicId("chp-4");
                            triggerToast("GIS Focus: Chipata Eastern Frontier Hub.", "info");
                          }}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full border border-white transition-colors duration-150 ${gisDetailsDistrict === "Chipata" ? "bg-white" : "bg-amber-500 group-hover:bg-amber-400"}`} title="Chipata Hub"></span>
                          <span className="text-[9px] font-bold text-slate-300 mt-1 bg-slate-900/90 px-1 py-0.5 rounded-sm backdrop-blur">Chipata</span>
                        </div>

                      </div>
                    </div>

                    {/* Highly polished dynamic district info overlay */}
                    <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-700/60 text-slate-200 text-xs backdrop-blur space-y-1">
                      <div className="flex justify-between font-bold text-white text-[11px] uppercase tracking-wide">
                        <span>📍 Focus: {gisDetailsDistrict} District</span>
                        <span className="text-emerald-400 font-mono">
                          {gisDetailsDistrict === "Lusaka" ? "Pos: 2.2%" : gisDetailsDistrict === "Kitwe" ? "Pos: 4.8%" : gisDetailsDistrict === "Ndola" ? "Pos: 3.5%" : "Pos: 1.8%"}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {gisDetailsDistrict === "Lusaka" && "Active hot spots located around Central Bus terminus and Kabwata markets."}
                        {gisDetailsDistrict === "Kitwe" && "Low safety minimum alerts. Mobile screening highly recommended."}
                        {gisDetailsDistrict === "Ndola" && "Outpost density active. 2 outreach volunteers on field duty."}
                        {gisDetailsDistrict === "Livingstone" && "Surveillance active near border transit terminals."}
                        {gisDetailsDistrict === "Chipata" && "Stable positivity ratios over previous quarter."}
                      </p>
                      <div className="flex justify-between items-center pt-1 border-t border-slate-800 text-[9px] font-mono">
                        <span className="text-slate-500">Auto-aligns Dispatch forms:</span>
                        <span className="text-red-400 font-bold underline">Assigned Refill Mode</span>
                      </div>
                    </div>

                    <div className="relative flex justify-between text-[10px] text-slate-400 z-10 border-t border-slate-900 pt-2 font-mono">
                      <span>Click Beacons to filter GIS</span>
                      <span className="text-emerald-400 font-semibold shadow-xs">● Live Mapping Enabled</span>
                    </div>
                  </div>

                  {/* List of Outreach Logged items */}
                  <div className="md:col-span-5 space-y-3.5 flex flex-col justify-between" id="outreach-logs-strip">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-0.5">Mobile Team Activity Log</p>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {fieldLogs.map((log) => (
                        <div key={log.id} className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl text-xs">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-slate-900">{log.location}</span>
                            <span className="text-[9px] text-slate-400 font-mono">{log.date}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium italic mb-1.5">{log.team}</p>
                          <div className="flex flex-wrap gap-2 text-[10px]">
                            <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium">Reached: {log.reached}</span>
                            <span className="bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded font-mono font-bold">Tested: {log.tested}</span>
                            <span className="bg-red-50 text-red-800 px-1.5 py-0.5 rounded font-mono font-bold">Reactive: {log.reactive}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Quick outreach generator */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200" id="quick-log-outreach">
                      <p className="text-[10px] font-bold text-slate-700 mb-2 uppercase tracking-wide">Publish Field Outreach Numbers</p>
                      <form onSubmit={handleFieldLogSubmit} className="space-y-2">
                        <input
                          type="text"
                          placeholder="Outreach Location (e.g. Ndola Bus Center)"
                          value={newLocation}
                          onChange={(e) => setNewLocation(e.target.value)}
                          className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
                        />
                        <div className="grid grid-cols-4 gap-1">
                          <input
                            type="number"
                            placeholder="Reached"
                            title="Total people reached"
                            value={newReached}
                            onChange={(e) => setNewReached(Number(e.target.value))}
                            className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] text-center"
                          />
                          <input
                            type="number"
                            placeholder="Tested"
                            title="Total tested"
                            value={newTested}
                            onChange={(e) => setNewTested(Number(e.target.value))}
                            className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] text-center"
                          />
                          <input
                            type="number"
                            placeholder="Positive"
                            title="Total reactive test results"
                            value={newReactive}
                            onChange={(e) => setNewReactive(Number(e.target.value))}
                            className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] text-center"
                          />
                          <button
                            type="submit"
                            className="bg-slate-900 hover:bg-slate-800 text-white rounded font-bold text-[10px] py-1"
                          >
                            Publish
                          </button>
                        </div>
                      </form>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* Patient SMS reminder pipeline panel */}
            {(adminDept === "all" || adminDept === "clinical") && (
              <div className={`${adminDept === "clinical" ? "lg:col-span-12" : "lg:col-span-4"} bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between`}>
                <div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <BellRing className="w-4 h-4 text-rose-500" /> Patient Adherence Reminders
                    </h3>
                    <span className="text-[10px] text-slate-400">Total: {smsQueue.length}</span>
                  </div>

                  {/* SMS Creator form */}
                  <form onSubmit={handleAddSmsSubmit} className="space-y-2.5 pb-4 border-b border-slate-100 mb-4">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Queue New Stigma-Free Text</p>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={smsClinic}
                        onChange={(e) => setSmsClinic(e.target.value)}
                        className="w-full px-2 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 text-slate-800"
                      >
                        <option value="AHF Lusaka Clinic (HQ)">AHF Lusaka Clinic</option>
                        <option value="AHF Ndola Centre">AHF Ndola Centre</option>
                        <option value="AHF Livingstone Outpost">AHF Livingstone</option>
                        <option value="Kitwe Support Clinic">Kitwe Support</option>
                      </select>

                      <input
                        type="text"
                        placeholder="Pat. Anonymized Reference"
                        value={smsPatientName}
                        onChange={(e) => setSmsPatientName(e.target.value)}
                        className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px] text-slate-800 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Zambia Phone No"
                        value={smsPhone}
                        onChange={(e) => setSmsPhone(e.target.value)}
                        className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px] text-slate-800 focus:outline-none font-mono"
                      />
                      <select
                        value={smsType}
                        onChange={(e) => {
                          setSmsType(e.target.value);
                          if (e.target.value === "Pharmacy ART Pick-up") {
                            setSmsMessage("AHF Care: Hello. Your monthly ART pharmacy refill is scheduled for tomorrow at AHF Clinic. Please bring your card. Your wellness is our pride.");
                          } else {
                            setSmsMessage("AHF Support: We noticed you missed your pick-up date on Friday. Your medication continuity is vital. Feel free to come in tomorrow morning or text us. We care about you.");
                          }
                        }}
                        className="w-full px-2 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 text-slate-800"
                      >
                        <option value="Pharmacy ART Pick-up">Pharmacy ART Refill</option>
                        <option value="Default Follow-up">Missed Medication Alert</option>
                      </select>
                    </div>

                    <textarea
                      placeholder="Enter discrete, non-stigmatization message content..."
                      rows={2}
                      value={smsMessage}
                      onChange={(e) => setSmsMessage(e.target.value)}
                      className="w-full px-2 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 text-slate-700 resize-none"
                    />

                    <button
                      type="submit"
                      className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-semibold transition"
                    >
                      + Add to Automated SMS Queue
                    </button>
                  </form>

                  {/* List of recent SMS statuses */}
                  <div className="space-y-2.5 max-h-[190px] overflow-y-auto pr-1">
                    {smsQueue.map((sms) => (
                      <div key={sms.id} className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-xs space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold text-slate-800 font-mono">{sms.patientName || "Anonymized Patient"}</span>
                          <span className="text-slate-400 font-mono">{sms.phoneNumber}</span>
                        </div>
                        <p className="font-medium text-slate-700 text-[11px] leading-tight mt-1">"{sms.message}"</p>
                        <div className="flex justify-between items-center pt-1.5 text-[10px]">
                          <span className="text-slate-500 font-mono shrink-0">Clinic: {sms.clinic.replace("AHF ", "")}</span>
                          {sms.status === "Sent" ? (
                            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono font-bold">Sent ({sms.sentTime})</span>
                          ) : (
                            <button
                              onClick={() => triggerSmsSend(sms.id)}
                              className="text-red-700 bg-red-100 hover:bg-red-200 px-2 py-0.5 rounded font-mono font-bold inline-flex items-center gap-1 transition-all"
                            >
                              Push Now
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 text-[10px] text-slate-500 leading-relaxed font-mono mt-4">
                  Note: SMS reminders automatically filter words like "HIV", "AIDS", "ART" to ensure complete confidentiality if a patient shares their device with relatives.
                </div>
              </div>
            )}

            </div>
            )}

            {/* AI Advisor Panel */}
            <div className="mt-8 animate-fade-in" id="ai-strategic-advisor-section">
              <AIOperationsAdvisor 
                adminDept={adminDept}
                onDraftSms={(type, clinic, message, patientName) => {
                  setSmsType(type);
                  setSmsClinic(clinic);
                  setSmsMessage(message);
                  setSmsPatientName(patientName);
                  // Generate an abstract random phone number
                  setSmsPhone("+260 97 " + Math.floor(Math.random() * 9000000 + 1000000).toString().substring(0, 7));
                  triggerToast("Copilot: Loaded template draft. Click '+ Add to Automated SMS Queue' to save it.", "success");
                }} 
                triggerToast={triggerToast} 
              />
            </div>

          </div>
        )}

        {activeTab === "community" && (
          <div className="space-y-8 max-w-7xl mx-auto animate-fade-in" id="community-workstation">
            
            {/* Header safe banner */}
            <div className="bg-indigo-950 text-white p-5 rounded-2xl border border-indigo-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-indigo-900/60 text-indigo-200 rounded text-xs font-mono tracking-widest font-bold border border-indigo-700">
                  <Lock className="w-3.5 h-3.5" /> 100% STIGMA-FREE ANONYMOUS PEER APP ACTIVE
                </div>
                <h2 className="text-xl font-display font-medium text-white tracking-tight">AHF Safe Space discussion boards & live clinical physician chat</h2>
                <p className="text-indigo-200 text-xs">
                  Patients select randomly generated pseudonyms & avatar graphics. Chat safely, read peer suggestions, or interact directly with verified on-duty AHF clinicians.
                </p>
              </div>

              {/* Patient Pseudonym Randomizer Widget card */}
              <div className="bg-indigo-900/40 p-3.5 rounded-xl border border-indigo-800 flex items-center gap-3">
                <img 
                  src={avatars[avatarIndex]} 
                  alt="Anonymized Avatar Illustration" 
                  className="w-10 h-10 rounded-full border-2 border-indigo-400 shrink-0 object-cover" 
                />
                <div>
                  <p className="text-[10px] text-indigo-300 font-mono">YOUR ANONYMOUS IDENTITY</p>
                  <p className="font-bold text-sm text-white">{anonUsername}</p>
                  <button 
                    onClick={randAnonName}
                    className="text-[10px] text-indigo-400 hover:text-indigo-200 font-bold underline flex items-center gap-1 mt-0.5"
                  >
                    Randomize Pseudonym
                  </button>
                </div>
              </div>
            </div>

            {/* AI Patient Wellness Companion Banner */}
            <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 p-5 rounded-2xl border border-indigo-800 text-white grid grid-cols-1 md:grid-cols-12 gap-5 items-center" id="patient-ai-wellness-companion">
              <div className="md:col-span-8 space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] bg-red-600 font-bold px-2 py-0.5 rounded-full font-mono tracking-widest uppercase">
                    ✨ Gemini Wellness Advisor
                  </span>
                  <span className="text-indigo-300 font-mono text-[10px]">Confidential Health Optimizer</span>
                </div>
                <h3 className="text-base font-bold font-display uppercase tracking-wide">
                  Your Personalized Anti-Stigma Guidance
                </h3>
                <p className="text-xs text-indigo-100 leading-relaxed max-w-2xl font-normal">
                  "Health is built day-by-day. Your current medication streak of <strong className="font-extrabold text-red-400 font-mono">{pillStreak} Days</strong> is actively supporting viral load suppression. Combined with balanced meals like maize meal/nshima, initial symptoms such as mild tiredness usually subside within 2-3 weeks. Reach out to our physicians privately for any custom guidelines."
                </p>
              </div>

              <div className="md:col-span-4 bg-indigo-950/60 p-4 rounded-xl border border-indigo-800 space-y-1.5">
                <p className="text-[10px] font-mono font-bold text-indigo-300 uppercase tracking-wider">Adherence Milestones</p>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔥</span>
                  <div>
                    <p className="text-xs font-bold text-white">
                      {pillStreak >= 7 ? "👑 Champion Suppressed Level" : pillStreak >= 3 ? "⭐ Active cellular shield" : "🌱 Growth of Immunity"}
                    </p>
                    <p className="text-[10px] text-indigo-300">
                      Keep log checkboxes active to increase streak multiplier!
                    </p>
                  </div>
                </div>
                <div className="w-full bg-indigo-900 rounded-full h-1.5 mt-2 overflow-hidden font-medium">
                  <div 
                    className="bg-red-500 h-1.5 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (pillStreak / 7) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Forum and post board (col-span-7) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Board topic filter row */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex space-x-1.5 text-xs font-semibold">
                    <button
                      onClick={() => setActiveCategory("all")}
                      className={`px-3 py-1.5 rounded-lg transition-colors ${
                        activeCategory === "all" ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      All Topics
                    </button>
                    <button
                      onClick={() => setActiveCategory("side_effects")}
                      className={`px-3 py-1.5 rounded-lg transition-colors ${
                        activeCategory === "side_effects" ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Side Effects
                    </button>
                    <button
                      onClick={() => setActiveCategory("disclosure")}
                      className={`px-3 py-1.5 rounded-lg transition-colors ${
                        activeCategory === "disclosure" ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Status Disclosure
                    </button>
                    <button
                      onClick={() => setActiveCategory("pregnancy")}
                      className={`px-3 py-1.5 rounded-lg transition-colors ${
                        activeCategory === "pregnancy" ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Healthy Pregnancy
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono font-medium">Safe Space Discussion Board</span>
                </div>

                {/* Form to submit a new forum topic */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200" id="forum-creator-block">
                  <h3 className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wider">Start a Supportive Peer Topic</h3>
                  <form onSubmit={handleCreateForumPost} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Select Category</label>
                        <select
                          value={newPostCategory}
                          onChange={(e) => setNewPostCategory(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
                        >
                          <option value="side_effects">Side Medication Effects</option>
                          <option value="disclosure">Disclosure Advice</option>
                          <option value="pregnancy">Pregnancy Care & ANC</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Brief Topic Header</label>
                        <input
                          type="text"
                          placeholder="e.g., Stomach upset tips on week 1"
                          value={newPostTitle}
                          onChange={(e) => setNewPostTitle(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Explain your challenge or support tip</label>
                      <textarea
                        placeholder="Type descriptive content. No names, contacts, or ID numbers please to preserve complete anonymity."
                        rows={3}
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none resize-none"
                      />
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">🔒 Logging post as anonymous user: <strong className="text-indigo-600">{anonUsername}</strong></span>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition"
                      >
                        Publish Anonymously
                      </button>
                    </div>
                  </form>
                </div>

                {/* Forum list rendering */}
                <div className="space-y-4" id="peer-forum-threads">
                  {loadingForum ? (
                    <div className="py-12 text-center text-xs text-slate-500">Retrieving secure peer-room...</div>
                  ) : (
                    forumPosts
                      .filter(p => activeCategory === "all" || p.category === activeCategory)
                      .map((post) => (
                        <div key={post.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xxs space-y-4">
                          {/* Post Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <img src={post.avatar} alt="Author avatar" className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0" />
                              <div>
                                <span className="text-xs font-mono font-bold text-indigo-600">{post.author}</span>
                                <span className="text-[9px] text-slate-400 block font-light">{post.timestamp}</span>
                              </div>
                            </div>
                            <span className="text-[9px] uppercase font-mono font-bold bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                              {post.category === "side_effects" ? "Side Effects" : post.category === "disclosure" ? "Disclosure" : "Pregnancy"}
                            </span>
                          </div>

                          {/* Post Content */}
                          <div>
                            <h4 className="text-sm font-bold text-slate-950">{post.title}</h4>
                            <p className="text-xs text-slate-600 leading-relaxed mt-1.5 italic font-medium">"{post.content}"</p>
                          </div>

                          {/* Replies section */}
                          <div className="space-y-2.5 pt-3.5 border-t border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                              <MessageCircle className="w-3.5 h-3.5 text-indigo-500" /> Professional & Peer Advice ({post.replies.length})
                            </p>
                            
                            {post.replies.map((reply) => (
                              <div key={reply.id} className={`p-3 rounded-xl border ${
                                reply.isVerified 
                                  ? "bg-red-50/50 border-red-100 text-slate-800"
                                  : "bg-slate-50 border-slate-100 text-slate-700"
                              }`}>
                                <div className="flex justify-between items-center mb-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-slate-900">{reply.author}</span>
                                    {reply.isVerified && (
                                      <span className="text-[8px] bg-red-600 text-white font-extrabold px-1 py-0.5 rounded uppercase tracking-wider font-mono">
                                        Verified Staff
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[9px] text-slate-400 font-mono">{reply.timestamp}</span>
                                </div>
                                <p className="text-xs font-medium leading-relaxed">{reply.content}</p>
                              </div>
                            ))}

                            {/* Reply Input block */}
                            <form 
                              onSubmit={(e) => handleAddReply(e, post.id)} 
                              className="mt-2 flex gap-2 items-center"
                            >
                              <input
                                type="text"
                                placeholder={`Write comfort advice to peer anonymously...`}
                                value={replyContent[post.id] || ""}
                                onChange={(e) => setReplyContent({ ...replyContent, [post.id]: e.target.value })}
                                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
                              />
                              <button
                                type="submit"
                                className="p-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition"
                                title="Post reply"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                            </form>

                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Complete Client Care & Clinical Support Side-panel (col-span-5) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* 1. Interactive Client Regimen intake companion */}
                <div className="bg-gradient-to-br from-red-650/5 via-white to-slate-50 p-5 rounded-2xl border border-red-100 shadow-xxs space-y-4" id="peer-intake-companion">
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded uppercase tracking-wider">REGIMEN CHAMPION</span>
                      <h3 className="text-sm font-bold text-slate-900 mt-1 uppercase tracking-wide">Client Intake Daily Companion</h3>
                      <p className="text-[11px] text-slate-500">Log your daily antiretroviral (ART) dose anonymously to maintain key cellular adherence levels.</p>
                    </div>
                  </div>

                  {/* Calendar row Mon - Sun */}
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-2 font-mono tracking-wider">Weekly Pill Log Checklist</p>
                    <div className="grid grid-cols-7 gap-1.5">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => {
                        const checked = pillLog[day];
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => handleTogglePill(day)}
                            className={`py-2 text-center rounded-xl font-bold text-xs transition-all cursor-pointer ${
                              checked 
                                ? "bg-red-600 text-white shadow-sm ring-2 ring-red-400/20" 
                                : "bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800"
                            }`}
                          >
                            <p className="text-[10px] font-normal">{day}</p>
                            <p className="text-sm font-semibold">{checked ? "✓" : "○"}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Streak result and peer encouragement draft CTA */}
                  <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-slate-400 font-mono">CURRENT SUPPRESSION STREAK</p>
                      <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        🔥 <span className="text-red-600 font-mono font-extrabold text-base">{pillStreak} Days</span> Adhered
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDraftStreakForumPost}
                      className="py-1 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition hover:text-indigo-800 text-[10px] font-bold rounded-lg border border-indigo-100 flex items-center gap-1 cursor-pointer"
                    >
                      📢 Share Streak to Board
                    </button>
                  </div>
                </div>

                {/* 2. Side Medication Effects Advisor */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xxs space-y-3" id="side-effects-advisor">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                      💊 Medicine Side-Effects Advisor
                    </h3>
                    <span className="text-[9px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded">HANDBOOK</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Select any symptom to view clinical coping guidance verified by AHF Zambia pharmacists.</p>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: "nausea", label: "🤢 Nausea / Stomach" },
                      { key: "insomnia", label: "😴 Insomnia / Dreams" },
                      { key: "rash", label: "🌸 Mild Skin Rash" }
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          setSelectedSideEffectInfo(selectedSideEffectInfo === item.key ? null : item.key);
                          playAudioChime("info");
                        }}
                        className={`p-2 rounded-xl text-center border text-[10px] font-bold transition-all cursor-pointer ${
                          selectedSideEffectInfo === item.key 
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" 
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {selectedSideEffectInfo && (
                    <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 text-xs text-slate-800 font-medium leading-relaxed shadow-inner">
                      <p className="font-bold text-indigo-700 uppercase p-0.5 text-[9px] tracking-wider">📋 CLINICAL COPING STRATEGY:</p>
                      <p className="text-slate-700 text-[11px]">
                        {selectedSideEffectInfo === "nausea" && "Take dose with nshima/maize food. Avoid dry ginger tea. Stomach lining adaptiveness clears in 2 weeks limit."}
                        {selectedSideEffectInfo === "insomnia" && "Take TLD regimen in the morning rather than late night to prevent sleep cycle disruption (Efavirenz component causes active REM dreams)."}
                        {selectedSideEffectInfo === "rash" && "Wear soft Zambian cotton, avoid harsh scented bath soaps. If the rash becomes painful or blistering, click on Ndola or HQ on the map to query dispatch teams."}
                      </p>
                    </div>
                  )}
                </div>

                {/* 3. Secure Clinician Chat Block */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between min-h-[400px]">
                  {/* Chat header on duty */}
                  <div>
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping absolute -top-0.5 -right-0.5"></span>
                          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-xs">🩺</div>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest leading-none">
                            AHF Doctor Chat
                          </h3>
                          <p className="text-[10px] text-slate-400 font-mono tracking-wide mt-1">CONFIDENTIAL CHAT ● STIGMA SAFE</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono font-bold bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200 uppercase tracking-widest">
                        Verified Active
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 mb-4">
                      <div className="flex items-center gap-1.5 bg-red-50/80 border border-red-100 text-[#A1231E] p-2 rounded-xl text-xs font-semibold leading-normal">
                        <Sparkles className="w-3.5 h-3.5 animate-bounce shrink-0 text-amber-500" />
                        <span>
                          <strong className="font-bold">Gemini Clinical AI Companion:</strong> Interactive guidance on drug retention, side-effects, and coping strategies.
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed italic bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                        Need instant advice on missed doses, tiredness, or clinic dates? Ask below. Your real identity is completely protected.
                      </p>
                    </div>

                    {/* Messages container list */}
                    <div className="space-y-4 max-h-[200px] overflow-y-auto pr-1 flex flex-col" id="live-doctor-confidential-chat">
                      {chatMessages.map((msg) => {
                        const isDoctor = msg.sender === "doctor";
                        return (
                          <div 
                            key={msg.id} 
                            className={`flex flex-col max-w-[85%] ${
                              isDoctor ? "self-start" : "self-end items-end"
                            }`}
                          >
                            <div className={`p-3 rounded-2xl text-xs font-semibold ${
                              isDoctor 
                                ? "bg-slate-100 text-slate-800 rounded-tl-none border-l-4 border-red-600" 
                                : "bg-indigo-600 text-white rounded-tr-none"
                            }`}>
                              {isDoctor && (
                                <p className="text-[8px] tracking-wider font-extrabold text-red-600 mb-1 uppercase font-mono">
                                  DR. Mwansa / Specialist
                                </p>
                              )}
                              <p className="leading-relaxed whitespace-pre-line">{msg.content}</p>
                            </div>
                            <span className="text-[9px] text-slate-400 mt-1 font-mono tracking-wider">{msg.timestamp}</span>
                          </div>
                        );
                      })}

                      {chatLoading && (
                        <div className="self-start flex items-center gap-2 text-slate-400 text-xs italic">
                          <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                          <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                          <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                          <span>Dr. Chileshe is tailoring responses...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Question Suggestion pills to trigger chat quickly */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">Common clinical inquiries:</p>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setChatInput("I missed my pill this morning. Should I take it now or wait?");
                          playAudioChime("info");
                        }}
                        className="text-[10px] bg-slate-100 hover:bg-slate-200 transition text-slate-700 px-2 py-1 rounded cursor-pointer"
                      >
                        "Missed pill"
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setChatInput("I'm feeling moderate nausea on my starting week 2 of ART. Is this fine?");
                          playAudioChime("info");
                        }}
                        className="text-[10px] bg-slate-100 hover:bg-slate-200 transition text-slate-700 px-2 py-1 rounded cursor-pointer"
                      >
                        "Fatigue & Side effects"
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setChatInput("I am pregnant. Can I safely continue my regimen without issues for baby?");
                          playAudioChime("info");
                        }}
                        className="text-[10px] bg-slate-100 hover:bg-slate-200 transition text-slate-700 px-2 py-1 rounded cursor-pointer"
                      >
                        "Pregnancy care"
                      </button>
                    </div>

                    {/* Input form */}
                    <form onSubmit={handleSendDoctorChat} className="mt-3 flex gap-2">
                      <input
                        type="text"
                        placeholder={`Message on-duty doctor anonymously...`}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium"
                      />
                      <button
                        type="submit"
                        disabled={chatLoading || !chatInput.trim()}
                        className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>

                </div>

              </div>
            </div>
          </div>
        )}

      </main>

      {/* Corporate design footer */}
      <footer className="bg-slate-900 text-slate-400 px-4 md:px-8 py-3.5 border-t border-slate-800 text-[10px] sm:text-xs flex flex-col md:flex-row justify-between items-center gap-4 shrink-0" id="app-footer">
        <div className="flex gap-4 sm:gap-6 flex-wrap justify-center text-slate-400 font-mono">
          <span>Real-Time Clinical Stock Alerts</span>
          <span className="opacity-40">|</span>
          <span>Stigma-Free Patient Networks</span>
          <span className="opacity-40">|</span>
          <span>AHF Zambia IT Internship Integration Proposals 2026</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-medium font-mono uppercase tracking-widest leading-none">Built for global impact</span>
          <span className="w-px h-3.5 bg-slate-800"></span>
          <span className="bg-white text-slate-900 px-2 py-0.5 rounded text-[10px] font-bold tracking-tight">INTERNSHIP PRESENTATION PROPOSAL</span>
        </div>
      </footer>
      
    </div>
  );
}
