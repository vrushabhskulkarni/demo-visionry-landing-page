import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Camera as CameraIcon, 
  Hand, 
  ArrowDown, 
  ArrowUp, 
  ShieldAlert, 
  Activity, 
  Cpu, 
  Zap, 
  Globe, 
  Layers, 
  ChevronDown, 
  MousePointer2, 
  Power, 
  PowerOff,
  CircleDot,
  X,
  ChevronLeft,
  ChevronRight,
  Send,
  Info,
  Eye,
  Lock,
  Unlock,
  MoveRight,
  ShieldCheck,
  MousePointerClick,
  Monitor
} from 'lucide-react';

type GestureState = 'IDLE' | 'DOWN' | 'UP' | 'HALT' | 'SWIPE';

const PINCH_THRESHOLD = 0.04; 
const SMOOTHING_FACTOR = 0.12; 
const GESTURE_CONFIDENCE = 0.88; 
const SWIPE_DISTANCE_THRESHOLD = 0.12;

// Replace with your actual Formspree form ID
const FORMSPREE_FORM_ID = 'https://formflowapi.thefortune.club/api/submit/10218471-9f90-4ff6-b579-711279903e51';

const VisionaryApp: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const carouselSectionRef = useRef<HTMLElement>(null);
  
  const [gesture, setGesture] = useState<GestureState>('IDLE');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isVisionEnabled, setIsVisionEnabled] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isPinching, setIsPinching] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isClicking, setIsClicking] = useState(false);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isHaltFlashing, setIsHaltFlashing] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isScrollLocked, setIsScrollLocked] = useState(false);
  const [isInCarouselZone, setIsInCarouselZone] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  const scrollVelocity = useRef(0);
  const lastGesture = useRef<GestureState>('IDLE');
  const lastPinchState = useRef<boolean>(false);
  const isScrollLockedRef = useRef<boolean>(false);
  const smoothedPos = useRef({ x: 0, y: 0 });
  const cameraRef = useRef<any>(null);
  const lastFistToggleTime = useRef<number>(0);
  
  const swipeStartX = useRef<number | null>(null);
  const lastSwipeTime = useRef<number>(0);

  const showWaitlistRef = useRef(false);
  const isInCarouselZoneRef = useRef(false);
  const isVisionEnabledRef = useRef(false);

  useEffect(() => { showWaitlistRef.current = showWaitlist; }, [showWaitlist]);
  useEffect(() => { isInCarouselZoneRef.current = isInCarouselZone; }, [isInCarouselZone]);
  useEffect(() => { isVisionEnabledRef.current = isVisionEnabled; }, [isVisionEnabled]);

  useEffect(() => {
    if (showAuthModal || showWaitlist) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [showAuthModal, showWaitlist]);

  const carouselItems = [
    { title: "Spatial Gaming", desc: "No controllers. No limits. Your body is the joystick.", color: "from-cyan-500" },
    { title: "Aura Healthcare", desc: "Sterile, touch-less diagnostic interfaces for modern surgery.", color: "from-magenta-500" },
    { title: "Ghost Design", desc: "3D CAD manipulation in mid-air with sub-millimeter precision.", color: "from-blue-500" },
    { title: "Vortex Retail", desc: "Browse virtual catalogs with natural browsing gestures.", color: "from-purple-500" }
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsInCarouselZone(entry.isIntersecting),
      { threshold: 0.3 }
    );
    if (carouselSectionRef.current) observer.observe(carouselSectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let rafId: number;
    const scrollLoop = () => {
      if (Math.abs(scrollVelocity.current) > 0.1) {
        window.scrollBy(0, scrollVelocity.current);
        scrollVelocity.current *= 0.94;
      } else {
        scrollVelocity.current = 0;
      }
      rafId = requestAnimationFrame(scrollLoop);
    };
    rafId = requestAnimationFrame(scrollLoop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch(`${FORMSPREE_FORM_ID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ name: '', phone: '', email: '' });
        setTimeout(() => {
          setShowWaitlist(false);
          setSubmitStatus('idle');
        }, 2000);
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerClick = (x: number, y: number) => {
    const element = document.elementFromPoint(x, y);
    if (element) {
      const clickEvent = new MouseEvent('click', {
        view: window, bubbles: true, cancelable: true, clientX: x, clientY: y
      });
      element.dispatchEvent(clickEvent);
      setIsClicking(true);
      setTimeout(() => setIsClicking(false), 200);
    }
  };

  const nextCarousel = useCallback(() => {
    setCarouselIndex((prev) => (prev + 1) % carouselItems.length);
  }, [carouselItems.length]);

  const prevCarousel = useCallback(() => {
    setCarouselIndex((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);
  }, [carouselItems.length]);

  const processHandResults = useCallback((results: any) => {
    if (!isVisionEnabledRef.current || showWaitlistRef.current) {
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      return;
    }

    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      if (lastGesture.current !== 'IDLE') {
        setGesture('IDLE');
        lastGesture.current = 'IDLE';
      }
      setIsPinching(false);
      lastPinchState.current = false;
      swipeStartX.current = null;
      return;
    }

    const landmarks = results.multiHandLandmarks[0];
    const handedness = results.multiHandedness[0].label; 
    
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const targetX = (1 - thumbTip.x) * window.innerWidth;
    const targetY = thumbTip.y * window.innerHeight;

    smoothedPos.current.x += (targetX - smoothedPos.current.x) * SMOOTHING_FACTOR;
    smoothedPos.current.y += (targetY - smoothedPos.current.y) * SMOOTHING_FACTOR;
    setCursorPos({ x: smoothedPos.current.x, y: smoothedPos.current.y });

    const pinchDist = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) + 
      Math.pow(thumbTip.y - indexTip.y, 2)
    );

    const pinchingNow = pinchDist < PINCH_THRESHOLD;

    if (pinchingNow && !lastPinchState.current) {
      triggerClick(smoothedPos.current.x, smoothedPos.current.y);
    }

    setIsPinching(pinchingNow);
    lastPinchState.current = pinchingNow;

    const isFist = [8, 12, 16, 20].every(tipIdx => {
      const pipJoint = tipIdx - 2;
      return landmarks[tipIdx].y > landmarks[pipJoint].y + 0.05; 
    });

    const isHandOpen = [8, 12, 16, 20].every(tipIdx => {
      const pipJoint = tipIdx - 2;
      return landmarks[tipIdx].y < landmarks[pipJoint].y - 0.05;
    });

    const indexUp = landmarks[8].y < landmarks[6].y - 0.05;
    const middleUp = landmarks[12].y < landmarks[10].y - 0.05;
    const ringUp = landmarks[16].y < landmarks[14].y - 0.05;
    const pinkyFolded = landmarks[20].y > landmarks[18].y + 0.05;
    const isThreeFingers = indexUp && middleUp && ringUp && pinkyFolded;

    const pinkyTip = landmarks[20];
    const indexBase = landmarks[5];
    const wrist = landmarks[0];
    const v1 = { x: indexBase.x - wrist.x, y: indexBase.y - wrist.y };
    const v2 = { x: pinkyTip.x - wrist.x, y: pinkyTip.y - wrist.y };
    const crossProductZ = v1.x * v2.y - v1.y * v2.x;
    const isPalmFacing = handedness === 'Right' ? crossProductZ < 0 : crossProductZ > 0;

    if (isFist) {
      if (lastGesture.current !== 'HALT') {
        const now = performance.now();
        if (now - lastFistToggleTime.current > 800) {
           isScrollLockedRef.current = !isScrollLockedRef.current;
           setIsScrollLocked(isScrollLockedRef.current);
           lastFistToggleTime.current = now;
        }
        setGesture('HALT');
        lastGesture.current = 'HALT';
        scrollVelocity.current = 0; 
        setIsHaltFlashing(true);
        setTimeout(() => setIsHaltFlashing(false), 400);
      }
      swipeStartX.current = null;
    } 
    else if (isThreeFingers && isInCarouselZoneRef.current) {
      const currentHandX = indexTip.x;
      const now = performance.now();

      if (swipeStartX.current === null) {
        swipeStartX.current = currentHandX;
      } else {
        const deltaX = currentHandX - swipeStartX.current;
        if (Math.abs(deltaX) > SWIPE_DISTANCE_THRESHOLD && now - lastSwipeTime.current > 800) {
          if (deltaX < 0) {
            nextCarousel();
          } else {
            prevCarousel();
          }
          setGesture('SWIPE');
          lastGesture.current = 'SWIPE';
          lastSwipeTime.current = now;
          swipeStartX.current = null;
        }
      }
    }
    else {
      swipeStartX.current = null;
      const newGesture = isPalmFacing ? 'UP' : 'DOWN';
      if (lastGesture.current !== newGesture) {
        setGesture(newGesture);
        lastGesture.current = newGesture;
      }

      if (!pinchingNow && !isScrollLockedRef.current && isHandOpen) {
        if (newGesture === 'UP') {
          scrollVelocity.current = Math.max(scrollVelocity.current - 1.8, -30);
        } else if (newGesture === 'DOWN') {
          scrollVelocity.current = Math.min(scrollVelocity.current + 1.8, 30);
        }
      } else {
        scrollVelocity.current *= 0.8;
      }
    }

    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      const currentColor = pinchingNow ? '#00f2ff' : (isFist ? '#ff3030' : (isThreeFingers ? '#a855f7' : (lastGesture.current === 'UP' ? '#00f2ff' : '#ff00ea')));
      if (window.drawConnectors) window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, { color: currentColor, lineWidth: 2 });
      if (window.drawLandmarks) window.drawLandmarks(ctx, landmarks, { color: currentColor, radius: 2 });
    }
  }, [nextCarousel, prevCarousel]);

  useEffect(() => {
    let hands: any = null;
    let camera: any = null;
    let isActive = true;

    const setupMediaPipe = async () => {
      if (!window.Hands || !isVisionEnabled) return;
      try {
        hands = new window.Hands({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });
        hands.setOptions({
          maxNumHands: 1, 
          modelComplexity: 1, 
          minDetectionConfidence: GESTURE_CONFIDENCE, 
          minTrackingConfidence: GESTURE_CONFIDENCE,
        });
        hands.onResults((results: any) => {
          if (isActive) processHandResults(results);
        });
        if (videoRef.current) {
          camera = new window.Camera(videoRef.current, {
            onFrame: async () => {
              if (isActive && videoRef.current && isVisionEnabledRef.current && hands) {
                try { await hands.send({ image: videoRef.current }); } catch (e) { }
              }
            },
            width: 640, height: 480,
          });
          await camera.start();
          if (isActive) setIsCameraReady(true);
        }
      } catch (err) { }
    };
    setupMediaPipe();
    return () => {
      isActive = false;
      setIsCameraReady(false);
      if (camera) camera.stop();
      if (hands) try { hands.close(); } catch (e) { }
    };
  }, [isVisionEnabled, processHandResults]);

  const handleToggleVision = () => {
    if (!isAuthorized) {
      setShowAuthModal(true);
    } else {
      setIsVisionEnabled(!isVisionEnabled);
    }
  };

  const handleAuthorize = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setIsAuthorized(true);
      setIsVisionEnabled(true);
      setShowAuthModal(false);
    } catch (err) { }
  };

  return (
    <div className="relative w-full overflow-x-hidden">
      {showAuthModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl">
          <div className="relative w-full max-w-4xl bg-[#0c0c0c] border border-white/10 rounded-[40px] p-8 md:p-14 shadow-2xl flex flex-col animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto scrollbar-hide">
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-8 right-8 text-[10px] font-black tracking-widest text-white/40 hover:text-white transition-colors uppercase z-10"
            >
              CLOSE [X]
            </button>
            
            <header className="mb-10">
              <h1 className="text-5xl md:text-7xl font-black mb-4 uppercase tracking-tighter" style={{ fontFamily: 'monospace' }}>MANUAL_INITIALIZATION</h1>
              <p className="text-white/40 text-base md:text-lg max-w-2xl font-light leading-relaxed">
                Prepare your environment. Ensure adequate lighting and a clear camera view for the optical engine to calibrate.
              </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              {[
                { emoji: '🖐️', title: 'PALM FACING', desc: 'SCROLL DOWN', color: 'text-cyan-400' },
                { emoji: '🤚', title: 'PALM AWAY', desc: 'SCROLL UP', color: 'text-magenta-400' },
                { emoji: '✊', title: 'CLOSED FIST', desc: 'HALT SCROLL', color: 'text-red-500' }
              ].map((item, i) => (
                <div key={i} className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl flex flex-col items-center text-center group hover:bg-white/[0.04] transition-all">
                  <span className="text-4xl mb-4 grayscale group-hover:grayscale-0 transition-all transform group-hover:scale-110">{item.emoji}</span>
                  <h3 className={`text-[10px] font-black tracking-[0.2em] mb-1 uppercase ${item.color}`}>{item.title}</h3>
                  <p className="text-[9px] font-bold tracking-[0.1em] text-white/30 uppercase">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 opacity-60">
                <div className="bg-white/[0.01] border border-white/5 p-5 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center"><CircleDot className="w-5 h-5 text-cyan-400" /></div>
                    <div>
                        <h4 className="text-[9px] font-black uppercase tracking-widest text-white/50 mb-1">Pinch Action</h4>
                        <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">CURSOR CLICK & DRAG</p>
                    </div>
                </div>
                <div className="bg-white/[0.01] border border-white/5 p-5 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center"><MoveRight className="w-5 h-5 text-purple-400" /></div>
                    <div>
                        <h4 className="text-[9px] font-black uppercase tracking-widest text-white/50 mb-1">3-Finger Swipe</h4>
                        <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">NEXT MODULE IN CAROUSEL</p>
                    </div>
                </div>
            </div>

            <footer className="flex flex-col md:flex-row items-center justify-between gap-6 border-t border-white/5 pt-10">
              <div className="flex items-start gap-4 max-w-sm">
                <ShieldCheck className="w-5 h-5 text-white/20 mt-0.5" />
                <p className="text-[9px] font-bold italic text-white/20 leading-relaxed uppercase tracking-widest">
                  BY ACTIVATING GESTURE CONTROL, YOU GRANT VISIONRY TEMPORARY CAMERA ACCESS. NO IMAGE DATA IS STORED OR TRANSMITTED OUTSIDE THE PROCESSING ENGINE.
                </p>
              </div>
              <button 
                onClick={handleAuthorize}
                className="w-full md:w-auto px-10 py-5 bg-white text-black font-black uppercase tracking-[0.2em] text-xs hover:bg-cyan-400 transition-all hover:scale-105 active:scale-95 shadow-2xl rounded-sm"
              >
                AUTHORIZE & INITIALIZE
              </button>
            </footer>
          </div>
        </div>
      )}

      {showWaitlist && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl">
          <div className="relative glass border-white/10 w-full max-w-md p-10 rounded-[40px] shadow-2xl animate-in fade-in zoom-in duration-300">
            <button onClick={() => setShowWaitlist(false)} className="absolute top-6 right-6 p-2 glass rounded-full hover:bg-white/10 transition-all hover:scale-110 active:scale-90 z-20">
              <X className="w-5 h-5" />
            </button>
            
            <div className="w-14 h-14 bg-cyan-500 rounded-2xl flex items-center justify-center mb-6 shadow-2xl relative z-10">
              <Cpu className="w-7 h-7 text-black" />
            </div>
            
            <h2 className="text-4xl font-black mb-2 uppercase tracking-tighter relative z-10">Enter Void</h2>
            <p className="text-white/40 text-sm mb-8 relative z-10">Join the neural network. Secure your access.</p>
            
            {submitStatus === 'success' ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-2xl font-black mb-2 text-cyan-400">LINK ESTABLISHED</h3>
                <p className="text-white/60 text-sm">You're in the system. Check your neural identifier.</p>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-4 relative z-10">
                <div>
                  <label htmlFor="name" className="block text-[9px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">
                    Neural Identity
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                    placeholder="Enter your name"
                    className="w-full px-6 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 outline-none transition-all font-light text-lg placeholder:text-white/20"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-[9px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">
                    Signal Channel
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleFormChange}
                    required
                    placeholder="Enter your phone number"
                    className="w-full px-6 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 outline-none transition-all font-light text-lg placeholder:text-white/20"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-[9px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">
                    Neural Identifier
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    required
                    placeholder="Enter your email address"
                    className="w-full px-6 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 outline-none transition-all font-light text-lg placeholder:text-white/20"
                  />
                </div>

                {submitStatus === 'error' && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                    <p className="text-red-400 text-sm font-bold">CONNECTION FAILED. TRY AGAIN.</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-xl bg-cyan-500 text-black font-black uppercase tracking-widest hover:bg-cyan-400 transition-all flex items-center justify-center gap-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'ESTABLISHING LINK...' : 'JOIN'}
                  {!isSubmitting && <Send className="w-4 h-4" />}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <div className={`relative w-full min-h-[500vh] bg-[#050505] selection:bg-cyan-500 selection:text-white transition-all duration-700 ${!isVisionEnabled ? 'grayscale-[0.5]' : ''}`}>
        
        <header className={`fixed top-0 left-0 w-full z-[1000] px-8 py-4 flex items-center justify-between transition-all duration-500 border-b border-white/5 ${scrolled ? 'bg-black/95 backdrop-blur-2xl shadow-2xl' : 'bg-black/40 backdrop-blur-md'}`}>
          <div className="flex items-center gap-4">
            <div className="group relative">
              <div className="absolute inset-0 bg-cyan-500 rounded-xl blur-lg opacity-40 group-hover:opacity-100 transition-opacity" />
              <div className="relative w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95">
                <Zap className="w-5 h-5 text-black" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tighter uppercase text-glow leading-none">Visionary</span>
              <span className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40 leading-none mt-1">Spatial OS</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <nav className="hidden lg:flex items-center gap-6">
              {['Genesis', 'Deck', 'Hub', 'Nodes'].map(link => (
                <a key={link} href="#" className="text-[9px] font-black uppercase tracking-[0.2em] opacity-30 hover:opacity-100 transition-opacity">{link}</a>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowWaitlist(true)} className="px-5 py-2 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-cyan-400 transition-all hover:scale-105 active:scale-95 shadow-xl">
                Access
              </button>
              <button 
                onClick={handleToggleVision} 
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-500 glass border ${isVisionEnabled ? 'border-cyan-500/50' : 'border-white/10 opacity-60'}`}
              >
                {isVisionEnabled ? <Power className="w-3.5 h-3.5 text-cyan-400" /> : <PowerOff className="w-3.5 h-3.5" />}
                <span className="text-[9px] font-bold uppercase tracking-widest hidden sm:block">
                  {isVisionEnabled ? 'Enabled' : 'Enable Gesture'}
                </span>
              </button>
            </div>
          </div>
        </header>

        {isVisionEnabled && !showWaitlist && (isPinching || isClicking) && (
          <div className="fixed z-[1500] pointer-events-none transition-transform duration-75 ease-out" style={{ left: cursorPos.x, top: cursorPos.y, transform: 'translate(-50%, -50%)' }}>
            <div className="relative">
              <div className={`absolute inset-0 w-12 h-12 bg-white rounded-full transition-all duration-300 ${isClicking ? 'opacity-40 scale-150' : 'opacity-0 scale-0'}`} />
              <div className={`absolute inset-0 w-8 h-8 bg-cyan-500 rounded-full blur-lg opacity-50 transition-all ${isClicking ? 'scale-125' : 'animate-pulse'}`} />
              <div className={`w-4 h-4 bg-white rounded-full border-2 transition-all duration-150 ${isClicking ? 'scale-75 border-magenta-500' : 'border-cyan-400 shadow-[0_0_20px_rgba(0,242,255,1)]'}`} />
            </div>
          </div>
        )}

        <div className="fixed bottom-12 right-12 z-50 flex flex-col gap-4 items-end pointer-events-none">
          {isVisionEnabled && !showWaitlist && (
            <div className={`relative w-48 h-36 rounded-[28px] overflow-hidden glass shadow-2xl border-2 transition-all duration-700 ${isPinching ? 'border-cyan-500 scale-105' : 'border-white/10'}`}>
              {!isCameraReady && <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90"><Activity className="w-6 h-6 text-cyan-400 animate-pulse mb-2" /></div>}
              <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-20" playsInline />
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" width={640} height={480} />
              <div className="absolute top-4 left-4 flex items-center gap-2">
                 <div className={`w-1.5 h-1.5 rounded-full ${isCameraReady ? 'bg-cyan-500 shadow-[0_0_10px_#00f2ff]' : 'bg-red-500'} animate-pulse`} />
                 <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40">LINK_LIVE</span>
              </div>
            </div>
          )}

          <div className={`p-4 rounded-[28px] glass transition-all duration-700 border-2 min-w-[220px] shadow-2xl relative overflow-hidden pointer-events-auto ${
            !isVisionEnabled || showWaitlist ? 'opacity-0 translate-y-20' :
            isPinching ? 'border-cyan-500/60' :
            gesture === 'HALT' ? 'border-red-500/60 scale-105' : 'border-white/10'
          }`}>
            {isScrollLocked && <div className="absolute top-2 right-2 animate-pulse bg-red-500/20 px-1.5 py-0.5 rounded border border-red-500/30"><Lock className="w-3 h-3 text-red-500" /></div>}
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl transition-all duration-500 ${
                isPinching ? 'bg-cyan-500 text-black shadow-lg' :
                isScrollLocked ? 'bg-red-500/20 text-red-500 border border-red-500/40' :
                gesture === 'UP' ? 'bg-cyan-500/20 text-cyan-400' : 
                gesture === 'DOWN' ? 'bg-magenta-500/20 text-magenta-400' : 
                gesture === 'SWIPE' ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-white/20'
              }`}>
                 {isPinching ? <CircleDot className="w-5 h-5" /> : 
                  gesture === 'HALT' ? <ShieldAlert className="w-5 h-5" /> : 
                  gesture === 'SWIPE' ? <MoveRight className="w-5 h-5 animate-pulse" /> :
                  isScrollLocked ? <Lock className="w-5 h-5" /> :
                  gesture === 'UP' ? <ArrowUp className="w-5 h-5 animate-bounce" /> : 
                  gesture === 'DOWN' ? <ArrowDown className="w-5 h-5 animate-bounce" /> : <Hand className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.3em] mb-1">NEURAL_STATUS</p>
                <h3 className="text-lg font-black text-white tracking-tight uppercase leading-none">
                  {isClicking ? 'Executed' : isPinching ? 'Pinching' : gesture === 'SWIPE' ? 'Swiped' : isScrollLocked ? 'Locked' : gesture === 'UP' ? 'Nav Up' : gesture === 'DOWN' ? 'Nav Down' : 'Sensing'}
                </h3>
              </div>
            </div>
          </div>
        </div>

        <main className="relative z-10 w-full pt-20">
          <section className="h-screen flex flex-col items-center justify-center px-8 text-center max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-8 bg-cyan-500/10 px-6 py-2 rounded-full border border-cyan-500/20">
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span></span>
              <span className="text-xs font-black text-cyan-400 uppercase tracking-[0.3em]">Neural Interface Active</span>
            </div>
            <h1 className="text-[10rem] md:text-[14rem] font-black mb-6 leading-[0.75] tracking-tighter uppercase" style={{ fontFamily: 'monospace' }}>VISIONRY</h1>
            <p className="text-xs font-bold uppercase tracking-[0.8em] text-white/40 mb-20">UNLOCK THE MOST INSTINCTIVE INTERFACE</p>
            
            <div className="relative w-full max-w-4xl aspect-video rounded-[60px] overflow-hidden border border-white/5 group shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
               <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
               <img 
                 src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop" 
                 alt="Retro Tech Inspiration" 
                 className="w-full h-full object-cover grayscale opacity-50 group-hover:opacity-70 transition-opacity duration-1000"
               />
               <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20">
                 <div className="flex flex-col items-center animate-bounce text-white/20">
                    <ChevronDown className="w-10 h-10" />
                 </div>
               </div>
            </div>
          </section>

          <section ref={carouselSectionRef} className="py-32 bg-white/[0.01] border-y border-white/5 relative">
            <div className="px-8 md:px-20 lg:px-40 mb-20 flex items-end justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4"><Layers className={`w-4 h-4 ${isScrollLocked ? 'text-red-500' : 'text-cyan-500'}`} /><h2 className={`text-[10px] font-black uppercase tracking-[0.5em] ${isScrollLocked ? 'text-red-500' : 'text-cyan-500'}`}>{isScrollLocked ? 'Nav Locked' : 'Spatial Modules'}</h2></div>
                <h2 className="text-6xl font-black uppercase tracking-tighter">Vortex Deck</h2>
              </div>
              <div className="flex gap-4">
                <button onClick={prevCarousel} className="p-5 glass rounded-2xl hover:bg-white/10 transition-all active:scale-90 border-white/10"><ChevronLeft className="w-8 h-8" /></button>
                <button onClick={nextCarousel} className="p-5 glass rounded-2xl hover:bg-white/10 transition-all active:scale-90 border-white/10"><ChevronRight className="w-8 h-8" /></button>
              </div>
            </div>

            <div className="relative h-[500px] overflow-hidden">
              <div className="flex transition-transform duration-1000 ease-[cubic-bezier(0.19,1,0.22,1)]" style={{ transform: `translateX(calc(-${carouselIndex * 50}% + 25%))` }}>
                {carouselItems.map((item, i) => (
                  <div key={i} className={`min-w-[50%] px-6 transition-all duration-1000 ${carouselIndex === i ? 'scale-100 opacity-100' : 'scale-90 opacity-20 blur-xl'}`}>
                    <div className={`h-[500px] rounded-[50px] p-12 relative overflow-hidden glass border-white/10 flex flex-col justify-end group transition-colors duration-700 ${carouselIndex === i ? 'bg-white/[0.04] border-white/20' : ''}`}>
                      <div className={`absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-to-br ${item.color} to-transparent opacity-10 blur-[100px]`} />
                      <div className="relative z-10">
                        <h3 className="text-5xl font-black mb-4 uppercase tracking-tighter leading-none">{item.title}</h3>
                        <p className="text-white/50 text-xl max-w-md font-light leading-relaxed mb-8">{item.desc}</p>
                        <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.4em] opacity-40 group-hover:opacity-100 group-hover:text-cyan-400 transition-all">3-Finger Swipe to cycle <MoveRight className="w-4 h-4" /></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="min-h-screen py-32 px-8 md:px-20 lg:px-40 flex flex-col items-center">
            <div className="glass p-16 rounded-[60px] w-full max-w-6xl flex flex-col items-center text-center border-white/5 shadow-2xl">
              <h2 className="text-6xl font-black mb-16 uppercase tracking-tighter text-glow">The Hub</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <button key={i} className="aspect-square glass rounded-3xl overflow-hidden group transition-all duration-500 relative active:scale-95 border-white/10 hover:border-cyan-500/30">
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-full h-full flex flex-col items-center justify-center pointer-events-none z-10">
                      <Cpu className={`w-10 h-10 mb-4 transition-all duration-500 ${isPinching ? 'text-cyan-400 scale-110' : 'text-white/5 group-hover:text-cyan-400'}`} />
                      <span className="text-[9px] font-black uppercase tracking-[0.5em] opacity-40">NODE_0{i}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <footer className="h-screen flex flex-col items-center justify-center text-center px-8 md:px-20 lg:px-40 relative">
            <h2 className="text-8xl md:text-[14rem] font-black mb-4 opacity-5 tracking-tighter">VISIONARY.AI</h2>
            <div className="w-32 h-1 bg-gradient-to-r from-cyan-500 via-white to-magenta-500 mb-12 rounded-full" />
            <button onClick={() => setShowWaitlist(true)} className="group relative px-16 py-8 glass rounded-[36px] overflow-hidden border-white/10 transition-all hover:scale-105 active:scale-95 shadow-2xl border-2 hover:border-cyan-500/50">
              <span className="text-3xl font-black uppercase tracking-widest relative z-10 text-glow">Waitlist Form</span>
            </button>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default VisionaryApp;