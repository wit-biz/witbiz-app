"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Bot, Sparkles, Loader2, Trash2, Plus, MessageSquare, ChevronLeft, FolderOpen, Zap, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getFirestore, collection, query, where, orderBy, limit, getDocs, getDoc, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const DONNA_IMAGE = "https://firebasestorage.googleapis.com/v0/b/wit-biz-07943714-b10c8.firebasestorage.app/o/assets%2FDonna.png?alt=media&token=fca9a5aa-2bb0-47dc-b695-e8624c3a35ce";

// Animated background component
function FuturisticBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(132,204,22,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(132,204,22,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      
      {/* Floating particles */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-lime-500/30 rounded-full animate-pulse" style={{animationDelay: '0s', animationDuration: '3s'}} />
      <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-green-500/40 rounded-full animate-pulse" style={{animationDelay: '1s', animationDuration: '4s'}} />
      <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-lime-400/50 rounded-full animate-pulse" style={{animationDelay: '2s', animationDuration: '2.5s'}} />
      <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-emerald-500/30 rounded-full animate-pulse" style={{animationDelay: '0.5s', animationDuration: '3.5s'}} />
      
      {/* Gradient orbs */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-lime-500/10 rounded-full blur-3xl animate-pulse" style={{animationDuration: '4s'}} />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-green-500/10 rounded-full blur-3xl animate-pulse" style={{animationDuration: '5s', animationDelay: '1s'}} />
      
      {/* Scanning line */}
      <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-lime-500/50 to-transparent animate-scan" />
    </div>
  );
}

// Typing indicator component
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-2">
      <div className="w-2 h-2 bg-lime-500 rounded-full animate-bounce" style={{animationDelay: '0ms', animationDuration: '600ms'}} />
      <div className="w-2 h-2 bg-lime-500 rounded-full animate-bounce" style={{animationDelay: '150ms', animationDuration: '600ms'}} />
      <div className="w-2 h-2 bg-lime-500 rounded-full animate-bounce" style={{animationDelay: '300ms', animationDuration: '600ms'}} />
    </div>
  );
}

// Voice waveform animation component
function VoiceWaveform({ variant = 'user', isActive = true }: { variant?: 'user' | 'donna'; isActive?: boolean }) {
  const barCount = 5;
  const baseColor = variant === 'user' ? 'bg-lime-500' : 'bg-purple-500';
  const glowColor = variant === 'user' ? 'shadow-lime-500/50' : 'shadow-purple-500/50';
  
  return (
    <div className={cn(
      "flex items-center justify-center gap-1 h-8 px-3 rounded-full",
      variant === 'user' ? 'bg-lime-500/10' : 'bg-purple-500/10'
    )}>
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-1 rounded-full transition-all",
            baseColor,
            isActive && `shadow-sm ${glowColor}`
          )}
          style={{
            height: isActive ? undefined : '8px',
            animation: isActive ? `voiceBar 0.5s ease-in-out infinite` : 'none',
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes voiceBar {
          0%, 100% { height: 8px; }
          50% { height: ${Math.random() * 16 + 16}px; }
        }
      `}</style>
    </div>
  );
}

// Enhanced voice waveform with more dynamic bars
// User = purple, Donna = green (lime)
function VoiceWaveformEnhanced({ variant = 'user' }: { variant?: 'user' | 'donna' }) {
  const bars = [
    { delay: 0, minH: 4, maxH: 20 },
    { delay: 0.1, minH: 6, maxH: 28 },
    { delay: 0.15, minH: 8, maxH: 32 },
    { delay: 0.2, minH: 6, maxH: 28 },
    { delay: 0.25, minH: 4, maxH: 20 },
  ];
  
  // Donna = green (lime), User = purple
  const colorClass = variant === 'donna' ? 'bg-lime-400' : 'bg-purple-400';
  const bgClass = variant === 'donna' ? 'bg-lime-950/30' : 'bg-purple-950/30';
  const borderClass = variant === 'donna' ? 'border-lime-500/30' : 'border-purple-500/30';
  
  return (
    <div className={cn(
      "flex items-center justify-center gap-[3px] h-10 px-4 rounded-full border",
      bgClass,
      borderClass
    )}>
      {bars.map((bar, i) => (
        <div
          key={i}
          className={cn("w-1 rounded-full", colorClass)}
          style={{
            animation: `waveBar${variant} 0.6s ease-in-out infinite`,
            animationDelay: `${bar.delay}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes waveBaruser {
          0%, 100% { height: 6px; opacity: 0.6; }
          25% { height: 24px; opacity: 1; }
          50% { height: 12px; opacity: 0.8; }
          75% { height: 28px; opacity: 1; }
        }
        @keyframes waveBardonna {
          0%, 100% { height: 8px; opacity: 0.6; }
          20% { height: 20px; opacity: 1; }
          40% { height: 32px; opacity: 1; }
          60% { height: 16px; opacity: 0.9; }
          80% { height: 26px; opacity: 1; }
        }
      `}</style>
    </div>
  );
}

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export function VertexAIChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [typingText, setTypingText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Voice states
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false); // Donna is speaking
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [conversationMode, setConversationMode] = useState(false); // Continuous conversation mode
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const conversationModeRef = useRef(false); // Ref to access in callbacks
  const pendingInputRef = useRef<string>(''); // Store input for auto-submit

  // Sync conversation mode ref with state
  useEffect(() => {
    conversationModeRef.current = conversationMode;
  }, [conversationMode]);

  // Initialize speech recognition and synthesis
  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'es-MX';
      
      recognition.onresult = (event: any) => {
        const results = Array.from(event.results);
        const transcript = results
          .map((result: any) => result[0].transcript)
          .join('');
        setInput(transcript);
        pendingInputRef.current = transcript;
        
        // Check if this is a final result (user stopped speaking)
        const isFinal = results.some((result: any) => result.isFinal);
        if (isFinal && conversationModeRef.current && transcript.trim()) {
          // Auto-submit after a short delay to allow for natural pauses
          setTimeout(() => {
            if (pendingInputRef.current.trim()) {
              // Trigger form submit programmatically
              const form = document.querySelector('form[data-voice-form]') as HTMLFormElement;
              if (form) {
                form.requestSubmit();
              }
            }
          }, 500);
        }
      };
      
      recognition.onend = () => {
        setIsListening(false);
        // In conversation mode, always restart listening unless Donna is speaking
        if (conversationModeRef.current) {
          setTimeout(() => {
            if (conversationModeRef.current && recognitionRef.current && !synthRef.current?.speaking) {
              try {
                recognitionRef.current.start();
                setIsListening(true);
              } catch (e) {
                // Already started or other error, try again shortly
                setTimeout(() => {
                  if (conversationModeRef.current && recognitionRef.current) {
                    try {
                      recognitionRef.current.start();
                      setIsListening(true);
                    } catch (e2) {
                      console.error('Failed to restart recognition:', e2);
                    }
                  }
                }, 500);
              }
            }
          }, 300);
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        // If in conversation mode and it's not a fatal error, try to restart
        if (conversationModeRef.current && event.error !== 'not-allowed') {
          setTimeout(() => {
            if (conversationModeRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
                setIsListening(true);
              } catch (e) {
                console.error('Failed to restart recognition:', e);
              }
            }
          }, 1000);
        }
      };
      
      recognitionRef.current = recognition;
    }
    
    // Initialize speech synthesis and load voices
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      
      // Load voices (they load async in Chrome)
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          setAvailableVoices(voices);
          console.log('Voces disponibles:', voices.filter(v => v.lang.startsWith('es')).map(v => v.name));
        }
      };
      
      // Try loading immediately
      loadVoices();
      
      // Also listen for voiceschanged event (Chrome loads voices async)
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Load conversations from Firestore
  useEffect(() => {
    loadConversations();
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Auto-focus textarea after loading
  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isLoading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  // Toggle conversation mode (continuous voice chat)
  const toggleConversationMode = () => {
    if (!recognitionRef.current) return;
    
    if (conversationMode) {
      // Turn off conversation mode
      setConversationMode(false);
      recognitionRef.current.stop();
      setIsListening(false);
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    } else {
      // Turn on conversation mode
      setConversationMode(true);
      setVoiceEnabled(true); // Ensure voice is enabled
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      setInput('');
      pendingInputRef.current = '';
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setIsListening(false);
        setConversationMode(false);
      }
    }
  };

  // Start listening (used after Donna finishes speaking)
  const startListening = () => {
    if (!recognitionRef.current || !conversationModeRef.current) return;
    
    setInput('');
    pendingInputRef.current = '';
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setIsListening(false);
    }
  };

  // Speak text using speech synthesis
  const speakText = (text: string) => {
    if (!synthRef.current || !voiceEnabled) return;
    
    // Cancel any ongoing speech
    synthRef.current.cancel();
    
    // Clean text for speech (remove markdown, emojis, special chars, etc.)
    const cleanText = text
      .replace(/[*_`#\[\](){}]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/:\w+:/g, '')
      .replace(/[✅❌🎤📍🔊🔇⭐💡📋🗓️]/g, '')
      .trim()
      .substring(0, 500); // Limit length for performance
    
    if (!cleanText) return;
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-MX';
    utterance.rate = 1.0;
    utterance.pitch = 1.05;
    utterance.volume = 1.0;
    
    // Get voices fresh from synthesis (more reliable than state)
    const allVoices = synthRef.current.getVoices();
    const spanishVoices = allVoices.filter(v => v.lang.startsWith('es'));
    
    // Prefer Spanish female voices - be more specific to avoid male voices
    const femaleVoiceNames = ['paulina', 'monica', 'sabina', 'helena', 'female', 'mujer', 'francisca', 'angelica', 'lupe'];
    const maleVoiceNames = ['jorge', 'diego', 'male', 'hombre', 'carlos', 'juan'];
    
    // First try to find an explicit female voice
    let preferredVoice = spanishVoices.find(v => {
      const name = v.name.toLowerCase();
      return femaleVoiceNames.some(fn => name.includes(fn));
    });
    
    // If no explicit female, exclude male voices and pick first remaining
    if (!preferredVoice) {
      preferredVoice = spanishVoices.find(v => {
        const name = v.name.toLowerCase();
        return !maleVoiceNames.some(mn => name.includes(mn));
      });
    }
    
    // Last resort: any Spanish voice
    if (!preferredVoice) {
      preferredVoice = spanishVoices[0];
    }
    
    console.log('🔊 Using voice:', preferredVoice?.name || 'default');
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    // When Donna starts speaking
    utterance.onstart = () => {
      setIsSpeaking(true);
    };
    
    // Handle errors
    utterance.onerror = (e) => {
      console.error('Error de síntesis de voz:', e);
      setIsSpeaking(false);
      // If in conversation mode, still try to restart listening
      if (conversationModeRef.current) {
        setTimeout(() => startListening(), 500);
      }
    };
    
    // When Donna finishes speaking, restart listening in conversation mode
    utterance.onend = () => {
      setIsSpeaking(false);
      if (conversationModeRef.current) {
        setTimeout(() => startListening(), 300);
      }
    };
    
    synthRef.current.speak(utterance);
  };

  // Cleanup old conversations (older than 1 month) - runs on the 1st of each month
  const cleanupOldConversations = async (userId: string) => {
    const today = new Date();
    const isFirstOfMonth = today.getDate() === 1;
    
    // Check localStorage to see if cleanup was already done this month
    const lastCleanup = localStorage.getItem(`chat_cleanup_${userId}`);
    const lastCleanupDate = lastCleanup ? new Date(lastCleanup) : null;
    const alreadyCleanedThisMonth = lastCleanupDate && 
      lastCleanupDate.getMonth() === today.getMonth() && 
      lastCleanupDate.getFullYear() === today.getFullYear();
    
    if (!isFirstOfMonth || alreadyCleanedThisMonth) return;
    
    console.log("🧹 Running monthly conversation cleanup...");
    
    try {
      const db = getFirestore();
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      const oldConvsQuery = query(
        collection(db, "chatConversations"),
        where("userId", "==", userId),
        where("updatedAt", "<", Timestamp.fromDate(oneMonthAgo))
      );
      
      const oldSnapshot = await getDocs(oldConvsQuery);
      const deletePromises = oldSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      console.log(`✅ Deleted ${oldSnapshot.size} old conversations`);
      
      // Mark cleanup as done for this month
      localStorage.setItem(`chat_cleanup_${userId}`, today.toISOString());
    } catch (error) {
      console.error("Error cleaning up old conversations:", error);
    }
  };

  const loadConversations = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const db = getFirestore();
      
      // Run cleanup on the 1st of each month
      await cleanupOldConversations(user.uid);
      
      const q = query(
        collection(db, "chatConversations"),
        where("userId", "==", user.uid),
        limit(50)
      );
      
      const snapshot = await getDocs(q);
      const convs: Conversation[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || "Sin titulo",
          messages: (data.messages || []).map((m: any) => ({
            ...m,
            timestamp: m.timestamp?.toDate ? m.timestamp.toDate() : new Date(m.timestamp),
          })),
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
        };
      });
      
      // Sort locally instead of in query
      convs.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      setConversations(convs);
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoadingConversations(false);
    }
  };

  const createNewConversation = async (): Promise<Conversation | null> => {
    // Clear UI
    setMessages([]);
    setShowSidebar(false);
    setInput('');
    
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        console.error("No authenticated user found");
        return null;
      }

      const db = getFirestore();
      const newConv = {
        userId: user.uid,
        title: "Nueva conversacion",
        messages: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(db, "chatConversations"), newConv);
      
      const conv: Conversation = {
        id: docRef.id,
        title: "Nueva conversacion",
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setConversations(prev => [conv, ...prev]);
      setCurrentConversation(conv);
      return conv;
    } catch (error) {
      console.error("Error creating conversation:", error);
      const tempConv: Conversation = {
        id: `temp-${Date.now()}`,
        title: "Nueva conversacion",
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setConversations(prev => [tempConv, ...prev]);
      setCurrentConversation(tempConv);
      return tempConv;
    }
  };

  const selectConversation = async (conv: Conversation) => {
    console.log("📂 Selecting conversation:", conv.id, conv.title);
    setShowSidebar(false);
    
    // Always reload from Firestore to get fresh messages
    try {
      const db = getFirestore();
      const docSnap = await getDoc(doc(db, "chatConversations", conv.id));
      console.log("📄 Document exists:", docSnap.exists());
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log("📋 Raw data:", { title: data.title, messagesCount: data.messages?.length || 0 });
        
        const loadedMessages: Message[] = (data.messages || []).map((m: any) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
          timestamp: m.timestamp?.toDate ? m.timestamp.toDate() : 
                    m.timestamp?.seconds ? new Date(m.timestamp.seconds * 1000) : 
                    new Date(m.timestamp),
        }));
        
        console.log("✅ Loaded messages:", loadedMessages.length);
        
        const updatedConv = { 
          ...conv, 
          messages: loadedMessages,
          title: data.title || conv.title 
        };
        setCurrentConversation(updatedConv);
        setMessages(loadedMessages);
        // Update local state
        setConversations(prev => prev.map(c => c.id === conv.id ? updatedConv : c));
      } else {
        console.warn("⚠️ Document not found");
        setCurrentConversation(conv);
        setMessages([]);
      }
    } catch (error) {
      console.error("❌ Error loading conversation:", error);
      setCurrentConversation(conv);
      setMessages(conv.messages || []);
    }
  };

  const deleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("🗑️ Deleting conversation:", convId);
    
    try {
      // Skip temp conversations - just remove from state
      if (!convId.startsWith('temp-')) {
        const db = getFirestore();
        await deleteDoc(doc(db, "chatConversations", convId));
        console.log("✅ Deleted from Firestore");
      }
      
      setConversations(prev => prev.filter(c => c.id !== convId));
      
      if (currentConversation?.id === convId) {
        setCurrentConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error("❌ Error deleting conversation:", error);
    }
  };

  const saveMessages = async (newMessages: Message[], convId?: string) => {
    const targetId = convId || currentConversation?.id;
    if (!targetId || targetId.startsWith('temp-')) return;
    
    // Simply copy first user message as title
    const firstUserMsg = newMessages.find(m => m.role === 'user');
    const title = firstUserMsg?.content.slice(0, 40) || "Chat";
    
    const db = getFirestore();
    const messagesForFirestore = newMessages.map(m => ({
      role: m.role,
      content: m.content,
      timestamp: Timestamp.fromDate(m.timestamp instanceof Date ? m.timestamp : new Date()),
    }));
    
    // Update Firestore
    await updateDoc(doc(db, "chatConversations", targetId), {
      messages: messagesForFirestore,
      title,
      updatedAt: serverTimestamp(),
    });
    
    // Update sidebar immediately
    setConversations(prev => prev.map(c => 
      c.id === targetId ? { ...c, title } : c
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Clear pending input ref to avoid double-submit in conversation mode
    pendingInputRef.current = '';

    // Create new conversation if none selected and wait for it
    let activeConversation = currentConversation;
    if (!activeConversation) {
      activeConversation = await createNewConversation();
      if (!activeConversation) {
        console.error("Failed to create conversation");
        return;
      }
    }
    
    // Store the conversation ID to use in callbacks (avoid stale closure)
    const conversationId = activeConversation.id;
    const userText = input.trim();
    
    // UPDATE TITLE IMMEDIATELY with user's first message
    const newTitle = userText.slice(0, 40);
    setConversations(prev => prev.map(c => 
      c.id === conversationId ? { ...c, title: newTitle } : c
    ));
    
    // Also update in Firestore immediately
    const db = getFirestore();
    updateDoc(doc(db, "chatConversations", conversationId), { 
      title: newTitle,
      updatedAt: serverTimestamp() 
    }).catch(err => console.error("Title update error:", err));

    const userMessage: Message = {
      role: "user",
      content: userText,
      timestamp: new Date(),
    };

    const currentInput = userText;
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("No auth");
      
      const token = await user.getIdToken();
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ 
          message: currentInput,
          history: history.slice(-10),
        }),
      });

      const data = await response.json();
      
      const aiMessage: Message = {
        role: "assistant",
        content: data.response || "Error al procesar.",
        timestamp: new Date(),
      };

      // Typing animation effect
      setIsTyping(true);
      const fullText = aiMessage.content;
      let currentIndex = 0;
      
      const typingInterval = setInterval(() => {
        if (currentIndex <= fullText.length) {
          setTypingText(fullText.slice(0, currentIndex));
          currentIndex += 2; // Speed up typing
        } else {
          clearInterval(typingInterval);
          setIsTyping(false);
          setTypingText("");
          const updatedMessages = [...newMessages, aiMessage];
          setMessages(updatedMessages);
          // Pass conversation ID explicitly to avoid stale closure
          saveMessages(updatedMessages, conversationId);
          // Speak the response if voice is enabled
          speakText(fullText);
        }
      }, 15);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMsg: Message = {
        role: "assistant",
        content: "Error de conexion. Intenta de nuevo.",
        timestamp: new Date(),
      };
      const updatedMessages = [...newMessages, errorMsg];
      setMessages(updatedMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex gap-3">
      {/* Sidebar for conversations - Left Panel */}
      {showSidebar && (
        <div className="w-56 flex-shrink-0 bg-card rounded-xl border border-border p-3 shadow-lg flex flex-col max-h-[500px]">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-medium text-primary flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Chats
            </div>
            <Button 
              type="button"
              variant="ghost" 
              size="icon"
              onClick={() => createNewConversation()} 
              className="h-6 w-6 text-primary hover:text-primary hover:bg-primary/10"
              title="Nueva conversación"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1">
            {loadingConversations ? (
              <div className="text-center py-4"><Loader2 className="h-4 w-4 animate-spin mx-auto" /></div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-4 text-xs text-muted-foreground">No hay chats</div>
            ) : (
              conversations.map(conv => (
                <div 
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-muted/50 group",
                    currentConversation?.id === conv.id && "bg-lime-500/10 border border-lime-500/20"
                  )}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <MessageSquare className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs truncate">{conv.title}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5 opacity-0 group-hover:opacity-100"
                    onClick={(e) => deleteConversation(conv.id, e)}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 min-w-0">
        {/* Header - Futuristic Style */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowSidebar(!showSidebar)} 
              className={cn(
                "text-primary hover:text-primary hover:bg-primary/10 border border-border",
                showSidebar && "bg-primary/10"
              )}
            >
              <FolderOpen className="h-4 w-4 mr-1" />
              Chats
            </Button>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full border border-primary/30 shadow-lg">
              <div className="relative">
                <img 
                  src={DONNA_IMAGE} 
                  alt="Donna" 
                  className="h-5 w-5 rounded-full object-cover ring-2 ring-primary/50"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full border-2 border-background animate-pulse" />
              </div>
              <span className="font-semibold text-sm text-primary">Donna</span>
              <Zap className="h-3 w-3 text-primary animate-pulse" />
            </div>
          </div>
          <Button 
            type="button"
            variant="ghost" 
            size="sm" 
            onClick={() => createNewConversation()} 
            className="text-primary hover:text-primary hover:bg-primary/10 border border-border"
          >
            <Plus className="h-4 w-4 mr-1" />
            Nuevo
          </Button>
        </div>

      {/* Messages Container - Futuristic */}
      <div className="relative bg-card rounded-xl border border-border shadow-xl overflow-hidden">
        <FuturisticBackground />
        <div ref={scrollRef} className="relative h-96 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center space-y-4">
                {/* Donna Avatar with glow effect */}
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-pulse" />
                  <img 
                    src={DONNA_IMAGE} 
                    alt="Donna" 
                    className="relative h-24 w-24 mx-auto rounded-full object-cover shadow-2xl ring-4 ring-primary/30"
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full border-3 border-background flex items-center justify-center">
                    <Zap className="h-3 w-3 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-lg font-bold text-primary">
                    Hola! Soy Donna
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Tu asistente virtual con IA</p>
                  <p className="text-xs text-primary/60 mt-0.5">Puedo responder cualquier pregunta de WitBiz</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-primary/10 hover:bg-primary/20 rounded-lg border border-primary/20 cursor-pointer transition-all hover:scale-105 text-primary/80">"¿Cuánto dinero hay?"</div>
                  <div className="p-2.5 bg-primary/10 hover:bg-primary/20 rounded-lg border border-primary/20 cursor-pointer transition-all hover:scale-105 text-primary/80">"Crea tarea..."</div>
                  <div className="p-2.5 bg-primary/10 hover:bg-primary/20 rounded-lg border border-primary/20 cursor-pointer transition-all hover:scale-105 text-primary/80">"¿Cuántos clientes?"</div>
                  <div className="p-2.5 bg-primary/10 hover:bg-primary/20 rounded-lg border border-primary/20 cursor-pointer transition-all hover:scale-105 text-primary/80">"Mis tareas"</div>
                </div>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={index} className={cn("flex gap-3 animate-in slide-in-from-bottom-2 duration-300", message.role === "user" ? "justify-end" : "justify-start")}>
                {message.role === "assistant" && (
                  <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 border border-primary/30 shadow-sm">
                    <img src={DONNA_IMAGE} alt="Donna" className="h-7 w-7 rounded-full object-cover" />
                  </div>
                )}
                <div className={cn("max-w-[80%]", message.role === "user" ? "items-end" : "items-start")}>
                  <div className={cn(
                    "rounded-2xl px-4 py-2.5 backdrop-blur-sm",
                    message.role === "user" 
                      ? "bg-primary text-primary-foreground shadow-lg" 
                      : "bg-muted border border-border shadow-sm"
                  )}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  <p className="text-xs text-muted-foreground px-1 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))
          )}
          
          {/* Loading indicator */}
          {isLoading && !isTyping && (
            <div className="flex gap-3 justify-start animate-in slide-in-from-bottom-2 duration-300">
              <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center border border-primary/30 shadow-sm">
                <Zap className="h-4 w-4 text-primary animate-pulse" />
              </div>
              <div className="bg-muted border border-border rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <TypingIndicator />
                  <p className="text-sm text-muted-foreground">Donna está pensando...</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Typing animation */}
          {isTyping && (
            <div className="flex gap-3 justify-start animate-in slide-in-from-bottom-2 duration-300">
              <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center border border-primary/30 shadow-sm">
                <img src={DONNA_IMAGE} alt="Donna" className="h-7 w-7 rounded-full object-cover" />
              </div>
              <div className="bg-muted border border-border rounded-2xl px-4 py-2.5 shadow-sm max-w-[80%]">
                <p className="text-sm whitespace-pre-wrap">
                  {typingText}
                  <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse" />
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Input - Futuristic with Voice Controls */}
        <div className={cn(
          "border-t border-border bg-card p-3",
          conversationMode && "bg-purple-500/10 border-purple-500/30"
        )}>
          <form onSubmit={handleSubmit} data-voice-form className="flex gap-2 items-end">
            {/* Voice Toggle Button (only when not in conversation mode) */}
            {!conversationMode && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={cn(
                  "h-11 w-11 flex-shrink-0 transition-all",
                  voiceEnabled 
                    ? "text-primary hover:text-primary hover:bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                title={voiceEnabled ? "Desactivar voz de Donna" : "Activar voz de Donna"}
              >
                {voiceEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </Button>
            )}
            
            {/* Conversation Mode Button */}
            {speechSupported && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={toggleConversationMode}
                disabled={isLoading}
                className={cn(
                  "h-11 w-11 flex-shrink-0 transition-all relative",
                  conversationMode 
                    ? "bg-purple-500/30 text-purple-400 hover:bg-purple-500/40 ring-2 ring-purple-500/50" 
                    : isListening
                      ? "bg-red-500/20 text-red-500 hover:bg-red-500/30 animate-pulse"
                      : "text-primary hover:text-primary hover:bg-primary/10"
                )}
                title={conversationMode ? "Terminar conversación de voz" : "Iniciar conversación de voz"}
              >
                {conversationMode ? (
                  <div className="relative">
                    <Mic className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                  </div>
                ) : isListening ? (
                  <MicOff className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </Button>
            )}
            
            {/* Text Input */}
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  conversationMode 
                    ? (isListening ? "🎤 Escuchando..." : "🔊 Donna está hablando...")
                    : "Escribe o habla con Donna..."
                }
                className={cn(
                  "flex-1 min-h-[44px] max-h-[120px] resize-none text-sm bg-background border-border focus:border-primary focus:ring-primary/20",
                  conversationMode && "border-purple-500/30 focus:border-purple-500/50",
                  isListening && "border-red-500/50 focus:border-red-500/70"
                )}
                disabled={isLoading || conversationMode}
                rows={1}
              />
            </div>
            
            {/* Send Button (hidden in conversation mode) */}
            {!conversationMode && (
              <Button 
                type="submit" 
                size="icon" 
                disabled={isLoading || !input.trim()} 
                className="h-11 w-11 bg-primary hover:bg-primary/90 shadow-lg border-0 transition-all hover:scale-105 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            )}
          </form>
          
          {/* Donna Speaking Indicator (when typing text and voice enabled) */}
          {!conversationMode && isSpeaking && (
            <div className="flex items-center justify-center gap-3 mt-3">
              <span className="text-xs text-primary font-medium">Donna</span>
              <VoiceWaveformEnhanced variant="donna" />
              <span className="text-xs text-primary">🔊 Hablando...</span>
            </div>
          )}
          
          {/* Conversation Mode Indicator with Voice Waveforms */}
          {conversationMode && (
            <div className="flex flex-col items-center gap-3 mt-3">
              {/* Voice Waveform Visualization */}
              <div className="flex items-center gap-3">
                {isListening && (
                  <>
                    <span className="text-xs text-purple-400 font-medium">Tú</span>
                    <VoiceWaveformEnhanced variant="user" />
                  </>
                )}
                {isSpeaking && (
                  <>
                    <span className="text-xs text-lime-400 font-medium">Donna</span>
                    <VoiceWaveformEnhanced variant="donna" />
                  </>
                )}
                {!isListening && !isSpeaking && (
                  <span className="text-xs text-muted-foreground">Procesando...</span>
                )}
              </div>
              
              {/* Status text and end button */}
              <div className="flex items-center gap-2 text-xs">
                <span className={cn(
                  isListening ? "text-purple-400" : isSpeaking ? "text-lime-400" : "text-muted-foreground"
                )}>
                  {isListening ? "🎤 Escuchando..." : isSpeaking ? "🔊 Donna hablando..." : "⏳ Procesando..."}
                </span>
                <button 
                  onClick={toggleConversationMode}
                  className="ml-2 text-red-400 hover:text-red-300 underline"
                >
                  Terminar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}