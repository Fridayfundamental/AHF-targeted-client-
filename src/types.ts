export interface Clinic {
  id: string;
  name: string;
  location: string;
  supplies: {
    artkits: number;
    condoms: number;
    testKits: number;
  };
  minThresholds: {
    artkits: number;
    condoms: number;
    testKits: number;
  };
}

export interface SmsReminder {
  id: string;
  patientName: string;
  phoneNumber: string;
  type: string;
  clinic: string;
  message: string;
  scheduledDate: string;
  status: "Queued" | "Sent";
  sentTime: string | null;
}

export interface FieldLog {
  id: string;
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  reached: number;
  tested: number;
  reactive: number;
  condoms: number;
  date: string;
  team: string;
}

export interface Reply {
  id: string;
  author: string;
  avatar: string;
  isVerified: boolean;
  role: string;
  content: string;
  timestamp: string;
}

export interface ForumPost {
  id: string;
  category: string;
  title: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
  likes: number;
  replies: Reply[];
}

export interface ChatMessage {
  id: string;
  sender: "patient" | "doctor";
  content: string;
  timestamp: string;
}

export interface HiringProfile {
  name: string;
  email: string;
  strength: string;
  background: string;
}
