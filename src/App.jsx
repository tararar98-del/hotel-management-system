import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import imageCompression from 'browser-image-compression';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot
} from 'firebase/firestore';
import { 
  Plus, 
  CheckCircle, 
  Clock, 
  Camera, 
  User, 
  Users, 
  Calendar, 
  Layers, 
  Settings, 
  TrendingUp, 
  Briefcase, 
  Check, 
  X, 
  RefreshCw, 
  ChevronRight, 
  Info, 
  Trash2, 
  UserPlus,
  Sliders,
  Sparkle
} from 'lucide-react';


// ดึงโลโก้แบรนด์ Wanaburee จากโฟลเดอร์หลักผ่านพาร์ทตรง เพื่อป้องกันปัญหาระบบ Esbuild ค้นหาไฟล์ไม่เจอ

// --- INITIALIZE FIREBASE (RULE 1 & 3) ---
const firebaseConfig = {
  apiKey: "AIzaSyCEabTp9lUzzEGRFS5gYhmxJe7rI4X68xg",
  authDomain: "hotelmanagementsystem-2deb7.firebaseapp.com",
  projectId: "hotelmanagementsystem-2deb7",
  storageBucket: "hotelmanagementsystem-2deb7.firebasestorage.app",
  messagingSenderId: "311348062013",
  appId: "1:311348062013:web:98f75457c486d8a6c10754",
  measurementId: "G-M50L75X5PL"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'hotel_app'; // เชื่อมโยงเข้ากับ Document ID 'hotel_app' ที่สร้างขึ้นบน Firestore ของคุณ

// รายชื่อเริ่มต้นของพนักงานสำหรับบันทึกสำรองลงทะเบียน
const INITIAL_STAFF = ["Joe", "Simz", "Aim", "Arm", "Ron"];
const DEFAULT_ASSIGNERS = ["Head", "Supervisor", "Duty Manager"];

export default function App() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [staffList, setStaffList] = useState(INITIAL_STAFF);
  const [cloudinaryConfig, setCloudinaryConfig] = useState({
  cloudName: 'dmip5j5u6',
  uploadPreset: 'hotel_upload'
});
  
  // สถานะควบคุมการตกแต่งหน้าจอ
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'tasks' | 'staff-mgmt' | 'settings'
  const [selectedRole, setSelectedRole] = useState('Supervisor'); // 'Supervisor' | 'Staff'
  const [selectedStaffUser, setSelectedStaffUser] = useState('Joe');
  const [logoError, setLogoError] = useState(false);
  
  // สถานะโมดอลควบคุม
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [viewingTaskDetails, setViewingTaskDetails] = useState(null);
  const [afterImageFile, setAfterImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [notification, setNotification] = useState(null);

  // ข้อมูลแบบฟอร์มเพิ่มงานใหม่
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('Joe');
  const [customAssignee, setCustomAssignee] = useState('');
  const [newTaskAssigner, setNewTaskAssigner] = useState('Head');
  const [newTaskBeforeUrl, setNewTaskBeforeUrl] = useState('');
  const [beforeImageFile, setBeforeImageFile] = useState(null);
  const [editDates, setEditDates] = useState({});
  
  // สไลเดอร์พรีวิวภาพถ่าย ก่อน-หลัง
  const [sliderPosition, setSliderPosition] = useState(50);
  const [newStaffInputName, setNewStaffInputName] = useState('');

  // ข้อมูลตัวอย่างสำหรับใช้ใน Dashboard ทันทีที่มีการเปิดแอป
  const mockTasks = [
    {
      id: "mock-1",
      taskName: "กวาดใบไม้และทำความสะอาดสวนหน้าล็อบบี้",
      assignee: "Joe",
      assigner: "Head",
      date: "2026-06-02",
      timestamp: "2/6/2026, 17:27:22",
      beforePhoto: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600",
      afterPhoto: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=600",
      status: "เสร็จแล้ว",
      completedAt: "2/6/2026, 17:30:40"
    },
    {
      id: "mock-2",
      taskName: "เรียงและจัดหมวดหมู่เอกสารฟร้อนท์ต้อนรับ",
      assignee: "Simz, Aim",
      assigner: "Head",
      date: "2026-06-02",
      timestamp: "2/6/2026, 20:48:56",
      beforePhoto: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=600",
      afterPhoto: "",
      status: "ค้าง",
      completedAt: ""
    }
  ];

  // ทำการฝัง Google Font 'Prompt' และกฎ CSS พื้นฐานเพื่อให้หน้าเว็บสวยทันทีแม้ไม่มี CSS ภายนอก
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    // ตั้งค่าฟอนต์เริ่มต้นให้กับร่างกายของหน้าเว็บ
    document.body.style.fontFamily = "'Prompt', sans-serif";
  }, []);

  // --- 1. FIREBASE AUTHENTICATION (RULE 3) ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Auth Failed:", err);
        showToast("เชื่อมต่อข้อมูลไม่สำเร็จ กรุณาตรวจสอบการตั้งค่าอินเทอร์เน็ต", "error");
      }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  // --- 2. FIRESTORE REAL-TIME SYNCHRONIZATION (RULE 1 & 2) ---
  useEffect(() => {
    if (!user) return;

    // Strict Path: /artifacts/{appId}/public/data/tasks
    const tasksCollection = collection(db, 'artifacts', appId, 'public', 'data', 'tasks');
    const unsubTasks = onSnapshot(tasksCollection, 
      (snapshot) => {
        if (snapshot.empty) {
          // ใส่ข้อมูลจำลองเป็นโครงตั้งต้นให้ Dashboard ทันที
          mockTasks.forEach(async (mTask) => {
            const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'tasks', mTask.id);
            await setDoc(docRef, mTask);
          });
        } else {
          const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          // เรียงประทับเวลาล่าสุดไว้ด้านบนด้วย JavaScript Memory
          loaded.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setTasks(loaded);
        }
      },
      (error) => {
        console.error("Firestore Loading Tasks Error:", error);
      }
    );

    // Strict Path: /artifacts/{appId}/public/data/staffs
    const staffCollection = collection(db, 'artifacts', appId, 'public', 'data', 'staffs');
    const unsubStaff = onSnapshot(staffCollection, 
      (snapshot) => {
        if (snapshot.empty) {
          INITIAL_STAFF.forEach(async (name) => {
            const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'staffs', name);
            await setDoc(docRef, { name });
          });
        } else {
          setStaffList(snapshot.docs.map(doc => doc.data().name));
        }
      },
      (error) => {
        console.error("Firestore Loading Staff Error:", error);
      }
    );

    return () => {
      unsubTasks();
      unsubStaff();
    };
  }, [user]);

  // ฟังก์ชันแจ้งเตือนสไตล์ลักชัวรี่
  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // --- อัปโหลดภาพไปยังคลาวด์ของ Cloudinary พร้อมการจับข้อผิดพลาด 404 ---
const uploadImageToCloudinary = async (file) => {
  // หากไม่มี Config ให้ใช้โหมดจำลองตามเดิม
  if (!cloudinaryConfig.cloudName || !cloudinaryConfig.uploadPreset) {
    return new Promise((resolve) => {
      setIsUploading(true);
      setTimeout(() => {
        setIsUploading(false);
        const urls = [
          "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=600",
          "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=600",
          "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=600"
        ];
        const randomUrl = urls[Math.floor(Math.random() * urls.length)] + `?sig=${Date.now()}`;
        resolve(randomUrl);
        showToast("ส่งผลงานเรียบร้อยแล้ว", "success");
      }, 1000);
    });
  }

  setIsUploading(true);

  // --- ส่วนบีบอัดภาพ ---
  let fileToUpload = file;
  try {
    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1000,
      useWebWorker: true,
    };
    fileToUpload = await imageCompression(file, options);
  } catch (err) {
    console.error("Compression failed, using original:", err);
  }

  const formData = new FormData();
  formData.append('file', fileToUpload); // ส่งไฟล์ที่บีบอัดแล้ว
  formData.append('upload_preset', cloudinaryConfig.uploadPreset);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) throw new Error("Upload failed");

    const data = await res.json();
    setIsUploading(false);
    return data.secure_url;
  } catch (err) {
    setIsUploading(false);
    console.error("Upload Error:", err);
    showToast("อัปโหลดไม่สำเร็จ", "error");
    return null;
  }
};

  // บันทึกค่าคอนฟิก Cloudinary ลงใน LocalStorage ของอุปกรณ์
  const saveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('cloudinary_cloud_name', cloudinaryConfig.cloudName);
    localStorage.setItem('cloudinary_upload_preset', cloudinaryConfig.uploadPreset);
    showToast("บันทึกช่องทางเชื่อมต่อ Cloudinary แล้ว!", "success");
  };

  // 1. ปรับปรุงการสร้างงานให้เหลือภาพเดียว
const handleCreateTask = async (e) => {
  e.preventDefault();
  if (!newTaskTitle.trim()) {
    showToast("กรุณาระบุชื่องาน", "error");
    return;
  }

  setIsUploading(true);
  let beforeUrl = "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=600";

  // บันทึกรูปเดียวเท่านั้น
  if (beforeImageFile) {
    const uploadedUrl = await uploadImageToCloudinary(beforeImageFile);
    if (uploadedUrl) beforeUrl = uploadedUrl;
  }

  const now = new Date();
  const payload = {
    taskName: newTaskTitle,
    assignee: newTaskAssignee === 'other' ? customAssignee : newTaskAssignee,
    assigner: newTaskAssigner,
    date: now.toISOString().split('T')[0],
    timestamp: now.toLocaleString('th-TH', { hour12: false }),
    beforePhoto: beforeUrl,
    afterPhoto: "", 
    status: "ค้าง", // เริ่มต้นเป็นค้าง
    completedAt: ""
  };

  try {
    const tasksCol = collection(db, 'artifacts', appId, 'public', 'data', 'tasks');
    await addDoc(tasksCol, payload);
    
    // รีเซ็ตค่า
    setNewTaskTitle('');
    setBeforeImageFile(null);
    setShowAssignModal(false);
    setIsUploading(false);
    showToast("สร้างงานสำเร็จ!", "success");
  } catch (err) {
    setIsUploading(false);
    showToast("เกิดข้อผิดพลาด", "error");
  }
};

// 2. ฟังก์ชันเปลี่ยนสถานะ (สำหรับหัวหน้างาน)
const handleAdminUpdateStatus = async (taskId, newStatus) => {
  try {
    const taskDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'tasks', taskId);
    await updateDoc(taskDocRef, { 
      status: newStatus,
      updatedAt: new Date().toLocaleString('th-TH')
    });
    showToast(`เปลี่ยนสถานะเป็น ${newStatus} แล้ว`, "success");
  } catch (err) {
    showToast("ไม่สามารถอัปเดตสถานะได้", "error");
  }
};

  // ลงทะเบียนรายชื่อพนักงานใหม่เข้าระบบ
  const handleAddStaff = async (e) => {
    e.preventDefault();
    const name = newStaffInputName.trim();
    if (!name) return;

    if (staffList.includes(name)) {
      showToast("มีพนักงานชื่อนี้ลงทะเบียนไว้แล้ว", "error");
      return;
    }

    try {
      const staffDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'staffs', name);
      await setDoc(staffDocRef, { name });
      setNewStaffInputName('');
      showToast(`ลงทะเบียนคุณ ${name} สำเร็จและระบบจดจำแล้ว!`, "success");
    } catch (err) {
      console.error(err);
    }
  };

  // ถอดรายชื่อพนักงานออก (ลบรายชื่อแบบเรียลไทม์)
  const handleRemoveStaff = async (name) => {
    if (staffList.length <= 1) {
      showToast("ต้องคงเหลือพนักงานไว้ตรวจรับงานอย่างน้อย 1 คน", "error");
      return;
    }
    if (!window.confirm(`คุณต้องการถอดรายชื่อของ คุณ ${name} ออกจากฐานข้อมูลของรีสอร์ทจริงหรือไม่?`)) return;

    try {
      const staffDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'staffs', name);
      await deleteDoc(staffDocRef);
      showToast("ลบข้อมูลประวัติของพนักงานแล้ว", "success");
    } catch (err) {
      console.error(err);
    }
  };

  // เปลี่ยนสถานะความคืบหน้าของงานตรวจ
  const handleUpdateTaskStatus = async (taskId, newStatus, afterUrl = "") => {
    try {
      const taskDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'tasks', taskId);
      const updates = { status: newStatus };

      if (newStatus === "เสร็จแล้ว") {
        updates.completedAt = new Date().toLocaleString('th-TH', { hour12: false });
        if (afterUrl) updates.afterPhoto = afterUrl;
      }

      await updateDoc(taskDocRef, updates);
      showToast("บันทึกงานเสร็จสมบูรณ์!", "success");

      if (viewingTaskDetails && viewingTaskDetails.id === taskId) {
        setViewingTaskDetails(prev => ({ ...prev, ...updates }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ส่งรูปภาพ After เพื่อรายงานจบงานบริการ
  const handleUploadAfterAndComplete = async (taskId) => {
    if (!afterImageFile) {
      showToast("กรุณาถ่ายรูปรายงานหลังทำงานเสร็จ", "error");
      return;
    }

    setIsUploading(true);
    const afterUrl = await uploadImageToCloudinary(afterImageFile);
    setIsUploading(false);

    if (afterUrl) {
      await handleUpdateTaskStatus(taskId, "เสร็จแล้ว", afterUrl);
      setAfterImageFile(null);
      setViewingTaskDetails(null);
    }
  };

  // ลบรายการงานตรวจออกจากประวัติการทำงาน
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("ยืนยันที่จะถอนงานตรวจรายการนี้ออกหรือไม่?")) return;
    try {
      const taskDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'tasks', taskId);
      await deleteDoc(taskDocRef);
      setViewingTaskDetails(null);
      showToast("ถอดประวัติงานตรวจแล้ว", "success");
    } catch (err) {
      console.error(err);
    }
  };

  // คำนวณสรุปสถิติตัวเลข Dashboard
  const totalTasks = tasks.length;
  const completedTasksCount = tasks.filter(t => t.status === "เสร็จแล้ว").length;
  const pendingTasksCount = tasks.filter(t => t.status === "ค้าง" || t.status === "รอส่งงาน").length;
  const successPercentage = totalTasks > 0 ? ((completedTasksCount / totalTasks) * 100).toFixed(1) : 0;

  // คำนวณประวัติการส่งงานรายพนักงานเพื่อทำคะแนน KPI
  const staffStats = {};
  staffList.forEach(name => {
    staffStats[name] = { total: 0, completed: 0 };
  });

  tasks.forEach(task => {
    const names = task.assignee.split(',').map(n => n.trim());
    names.forEach(name => {
      if (staffStats[name]) {
        staffStats[name].total += 1;
        if (task.status === "เสร็จแล้ว") {
          staffStats[name].completed += 1;
        }
      }
    });
  });

  return (
    <div className="min-h-screen bg-[#070b16] text-slate-100 flex flex-col font-sans pb-16 md:pb-0">
      
      {/* --- การแสดงกล่องแจ้งเตือนพรีเมียม (Toast) --- */}
      {notification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border transition-all duration-300 animate-bounce bg-slate-900 text-white border-amber-500/40">
          <div className={`p-1.5 rounded-xl ${notification.type === 'success' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-455'}`}>
            {notification.type === 'success' ? <Check className="w-5 h-5 stroke-[2.5]" /> : <Info className="w-5 h-5" />}
          </div>
          <span className="text-xs sm:text-sm font-semibold pr-1">{notification.message}</span>
        </div>
      )}

      {/* --- หัวข้อแอปพลิเคชันและโลโก้รีสอร์ทหรูหรา --- */}
      <header className="sticky top-0 bg-[#070b16]/95 backdrop-blur-md border-b border-amber-500/10 py-4.5 px-4 z-40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl">
        <div className="flex items-center gap-3">
          {!logoError ? (
            <div className="h-12 flex items-center">
              <img  
    
                className="h-full w-auto object-contain max-w-[200px]"
                onError={() => setLogoError(true)}
              />
            </div>
          ) : (
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-600 via-yellow-500 to-amber-700 flex items-center justify-center text-slate-955 shadow-lg font-serif font-black text-2xl">
              W
            </div>
          )}
          <div className="text-left">
            <div className="flex items-baseline gap-1">
              <span className="font-serif text-[13px] tracking-[0.2em] text-slate-400 uppercase font-bold">Khao Lak</span>
              <span className="font-serif text-2xl tracking-normal text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 italic font-black pl-1">Wanaburee</span>
              <span className="font-serif text-[10px] text-amber-500/80 tracking-widest font-black uppercase ml-1">Resort</span>
            </div>
            <p className="text-[9px] text-amber-500/50 tracking-[0.25em] font-bold uppercase mt-0.5 flex items-center gap-1">
              <Sparkle className="w-2.5 h-2.5 fill-amber-500/40 animate-pulse" />
              Real-Time Task & Quality Management
            </p>
          </div>
        </div>

        {/* ตัวเลือกเปลี่ยนสิทธิ์พนักงานสำหรับการทดลองเล่น */}
        <div className="flex bg-[#111c30] p-1 rounded-full border border-slate-800 self-end sm:self-center shadow-inner">
          <button 
            onClick={() => { setSelectedRole('Supervisor'); showToast("มุมมอง: หัวหน้างานตรวจ", "success"); }}
            className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 ${selectedRole === 'Supervisor' ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-955 shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>หัวหน้างาน</span>
          </button>
          <button 
            onClick={() => { setSelectedRole('Staff'); showToast(`ล็อกอินพนักงาน: ${selectedStaffUser}`, "success"); }}
            className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 ${selectedRole === 'Staff' ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-955 shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <User className="w-3.5 h-3.5" />
            <span>พนักงาน ({selectedStaffUser})</span>
          </button>
        </div>
      </header>

      {/* --- ตัวแสดงผลหลัก Split Layout สำหรับ Desktop --- */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto md:p-6 gap-6">
        
        {/* แถบด้านข้างสำหรับแท็บเล็ตและคอมพิวเตอร์ */}
        <aside className="hidden md:flex flex-col gap-2 w-64 shrink-0 bg-[#070b16] p-4.5 rounded-3xl border border-slate-850 shadow-xl">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2 text-left">เมนูบริการ</p>
          
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all text-left ${activeTab === 'dashboard' ? 'bg-amber-500/10 text-amber-400 border-l-4 border-amber-500' : 'text-slate-400 hover:bg-slate-900/60 hover:text-white'}`}
          >
            <TrendingUp className="w-4 h-4" />
            แดชบอร์ดสรุปงานวันนี้
          </button>

          <button 
            onClick={() => setActiveTab('tasks')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all text-left ${activeTab === 'tasks' ? 'bg-amber-500/10 text-amber-400 border-l-4 border-amber-500' : 'text-slate-400 hover:bg-slate-900/60 hover:text-white'}`}
          >
            <Layers className="w-4 h-4" />
            รายการตรวจงานทั้งหมด
            <span className="ml-auto bg-[#111c30] text-slate-300 text-[10px] px-2 py-0.5 rounded-full font-black">
              {tasks.length}
            </span>
          </button>

          <button 
            onClick={() => setActiveTab('staff-mgmt')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all text-left ${activeTab === 'staff-mgmt' ? 'bg-amber-500/10 text-amber-400 border-l-4 border-amber-500' : 'text-slate-400 hover:bg-slate-900/60 hover:text-white'}`}
          >
            <Users className="w-4 h-4" />
            พนักงานที่ขึ้นทะเบียน
            <span className="ml-auto bg-[#111c30] text-slate-300 text-[10px] px-2 py-0.5 rounded-full font-black">
              {staffList.length}
            </span>
          </button>

          {selectedRole === 'Supervisor' && (
            <button 
              onClick={() => setShowAssignModal(true)}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-955 hover:opacity-95 shadow-xl shadow-amber-500/10 mt-3"
            >
              <Plus className="w-4 h-4 stroke-[3px]" />
              สั่งงานตรวจงาน
            </button>
          )}

          <div className="mt-auto pt-4 border-t border-slate-900">
            {selectedRole === 'Staff' && (
              <div className="bg-[#111c30] p-3 rounded-2xl border border-slate-800 mb-3 text-left">
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5">คุณกำลังปฏิบัติงาน</label>
                <select 
                  value={selectedStaffUser}
                  onChange={(e) => {
                    setSelectedStaffUser(e.target.value);
                    showToast(`พนักงานล็อกอิน: ${e.target.value}`, "success");
                  }}
                  className="w-full bg-slate-900 border border-slate-850 text-amber-400 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                >
                  {staffList.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            )}
            
            <button 
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-[11px] font-bold transition-all ${activeTab === 'settings' ? 'bg-[#111c30] text-amber-400' : 'text-slate-500 hover:text-white'}`}
            >
              <Settings className="w-3.5 h-3.5" />
              ตั้งค่าคีย์ Cloudinary
            </button>
          </div>
        </aside>

        {/* --- ส่วนหลักสำหรับแสดง Dashboard แผนกความสะอาดตามรูปถ่ายจริง --- */}
        <main className="flex-1 px-4 py-4 md:p-0 flex flex-col gap-6 overflow-x-hidden">
          
          {/* ตัวปรับพนักงานบนมือถือ */}
          {selectedRole === 'Staff' && (
            <div className="md:hidden flex items-center justify-between bg-gradient-to-r from-[#111c30] to-amber-955/20 p-3.5 rounded-2xl border border-amber-500/20 shadow-xl">
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center font-bold text-slate-955 text-lg uppercase shadow-inner">
                  {selectedStaffUser[0]}
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block font-bold">ล็อกอินเข้าทำงานในกะ</span>
                  <span className="text-sm font-extrabold text-amber-300">{selectedStaffUser}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">สลับชื่อ:</span>
                <select 
                  value={selectedStaffUser}
                  onChange={(e) => {
                    setSelectedStaffUser(e.target.value);
                    showToast(`สวมชื่อพนักงาน: ${e.target.value}`, "success");
                  }}
                  className="bg-[#111c30] border border-slate-800 text-amber-400 rounded-xl py-1 px-2.5 text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                >
                  {staffList.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* TAB: DASHBOARD สรุปงานพร้อมกราฟประเมินค่า KPI และการค้างกวาดทำความสะอาด */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fade-in text-left">
              <div>
                <h2 className="text-lg md:text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
                  <TrendingUp className="w-5 h-5 text-amber-500" />
                  รายงานแดชบอร์ดความสะอาดประจำวัน
                </h2>
                <p className="text-xs text-slate-400 font-semibold">สรุปผลงานความสะอาดและการบริการของพนักงานแบบเรียลไทม์</p>
              </div>

              {/* การ์ดสถิติแสดงแบบตัวเลขที่เด่นชัด */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                
                {/* จำนวนงานทั้งหมด */}
                <div className="bg-[#070b16] p-4.5 rounded-2xl border border-slate-800/80 hover:border-slate-700/60 transition duration-300 relative overflow-hidden group">
                  <span className="text-[11px] font-bold text-slate-400 block">งานทั้งหมด</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl md:text-4xl font-black text-white">{totalTasks}</span>
                    <span className="text-xs text-slate-500 font-bold">รายการ</span>
                  </div>
                </div>

                {/* งานเสร็จแล้ว */}
                <div className="bg-[#070b16] p-4.5 rounded-2xl border border-slate-800/80 hover:border-slate-700/60 transition duration-300 relative overflow-hidden group">
                  <span className="text-[11px] font-bold text-slate-400 block">งานเสร็จสิ้น</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl md:text-4xl font-black text-emerald-400">{completedTasksCount}</span>
                    <span className="text-xs text-slate-500 font-bold">รายการ</span>
                  </div>
                </div>

                {/* งานค้าง */}
                <div className="bg-[#070b16] p-4.5 rounded-2xl border border-slate-800/80 hover:border-slate-700/60 transition duration-300 relative overflow-hidden group">
                  <span className="text-[11px] font-bold text-slate-400 block">งานค้าง / รอตรวจสอบ</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl md:text-4xl font-black text-amber-500">{pendingTasksCount}</span>
                    <span className="text-xs text-slate-500 font-bold">รายการ</span>
                  </div>
                </div>

                {/* เปอร์เซ็นต์ความสำเร็จ */}
                <div className="bg-[#070b16] p-4.5 rounded-2xl border border-slate-800/80 hover:border-slate-700/60 transition duration-300 relative overflow-hidden group col-span-2 lg:col-span-1">
                  <span className="text-[11px] font-bold text-slate-400 block">เปอร์เซ็นต์ความสำเร็จ</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">
                      {successPercentage}%
                    </span>
                  </div>
                </div>

              </div>

              {/* สถิติประสิทธิภาพและโดนัทชาร์ต */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* ตารางแสดงระดับคะแนน KPI */}
                <div className="bg-[#070b16] p-5 rounded-3xl border border-slate-800/80 lg:col-span-7 flex flex-col">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">สถิติประสิทธิภาพพนักงาน (KPIs)</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-medium">คำนวณจากงานทั้งหมดที่ระบุชื่อผู้รับผิดชอบ</p>
                    </div>
                    <span className="text-[9px] bg-amber-500/10 text-amber-400 font-black px-2 py-1 rounded-full border border-amber-500/20">อัตโนมัติ</span>
                  </div>

                  <div className="space-y-4 flex-1">
                    {Object.keys(staffStats).length === 0 ? (
                      <div className="text-center py-8 text-slate-500 text-xs">ยังไม่มีรายชื่อพนักงานที่ได้รับงานตรวจในระบบ</div>
                    ) : (
                      Object.entries(staffStats)
                        .sort((a, b) => b[1].total - a[1].total)
                        .map(([name, stats]) => {
                          const rate = stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(0) : 0;
                          return (
                            <div key={name} className="p-3 bg-slate-900/40 rounded-2xl border border-slate-800 hover:border-slate-850 transition duration-200">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-black text-xs uppercase shadow-sm">
                                    {name[0]}
                                  </div>
                                  <span className="text-xs font-black text-slate-200">{name}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-xs font-bold text-slate-400">{stats.completed}/{stats.total} งานเสร็จสิ้น</span>
                                  <span className="text-xs font-black text-amber-400 ml-1">({rate}%)</span>
                                </div>
                              </div>
                              <div className="h-2 w-full bg-[#0d1527] rounded-full overflow-hidden flex">
                                <div 
                                  className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500" 
                                  style={{ width: `${rate}%` }}
                                />
                                <div 
                                  className="h-full bg-slate-900 transition-all duration-500" 
                                  style={{ width: `${100 - rate}%` }}
                                />
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>

                {/* วงล้อสรุปรายเดือน */}
                <div className="bg-[#070b16] p-5 rounded-3xl border border-slate-800/80 lg:col-span-5 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">สถิติตามผลงานรวมรายเดือน</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">มิถุนายน 2026</p>
                  </div>

                  <div className="flex-1 flex flex-col justify-center space-y-5 my-4">
                    <div className="relative flex items-center justify-center py-2">
                      <div className="w-36 h-36 rounded-full border-8 border-slate-900 flex items-center justify-center relative shadow-2xl">
                        <div className="absolute inset-0 rounded-full border-8 border-amber-500 border-t-transparent animate-spin-slow opacity-15" />
                        <div className="text-center">
                          <span className="text-3xl font-black text-white">{successPercentage}%</span>
                          <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">SUCCESS RATE</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 text-center bg-[#0d1527] rounded-2xl p-3 border border-slate-800">
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold">ทั้งหมด</span>
                        <span className="text-sm font-black text-white">{totalTasks}</span>
                      </div>
                      <div className="border-x border-slate-800">
                        <span className="text-[9px] text-slate-400 block font-bold">เสร็จสิ้น</span>
                        <span className="text-sm font-black text-amber-400">{completedTasksCount}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold">ค้างส่ง</span>
                        <span className="text-sm font-black text-rose-450">{pendingTasksCount}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          

          {/* TAB: TASKS - รายการตรวจสอบภาพก่อนทำและหลังทำ */}
{activeTab === 'tasks' && (
  <div className="space-y-4 animate-fade-in text-left">
    {/* ส่วนหัวของแท็บ */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h2 className="text-lg md:text-2xl font-black text-white tracking-wide">
          ประวัติและสถานะตรวจงานประจำวัน
        </h2>
        <p className="text-xs text-slate-400 font-medium">กดที่รายการการ์ดเพื่อเปรียบเทียบรูปถ่าย และเปิดกล้องส่งผลงาน</p>
      </div>
      {selectedRole === 'Supervisor' && (
        <button 
          onClick={() => setShowAssignModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-[#070b16] rounded-xl font-bold text-xs"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3px]" />
          สั่งงานด่วน
        </button>
      )}
    </div>

    {/* รายการการ์ดงาน */}
    {tasks.length === 0 ? (
      <div className="bg-[#070b16] p-12 text-center rounded-3xl border border-slate-800">
        <Briefcase className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-300">ยังไม่มีงานที่สั่งในวันนี้</h3>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tasks.map((task) => {
          const isCompleted = task.status === "เสร็จแล้ว";
          return (
            <div 
              key={task.id}
              onClick={() => {
                setViewingTaskDetails(task);
                setSliderPosition(50);
              }}
              className={`bg-[#070b16] rounded-3xl border transition-all duration-300 cursor-pointer p-4.5 flex flex-col justify-between hover:scale-[1.01] hover:border-slate-700 ${isCompleted ? 'border-emerald-500/20 bg-gradient-to-br from-[#070b16] to-[#041a13]' : 'border-slate-800/80'}`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    {task.timestamp}
                  </span>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${isCompleted ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                    {isCompleted ? "สำเร็จเรียบร้อย" : "รอดำเนินการ"}
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-white line-clamp-2 mb-3 tracking-wide">
                  {task.taskName}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/50 p-2.5 rounded-2xl border border-slate-900/80 mb-4">
                <div>
                  <span className="text-[8px] text-slate-500 block font-bold uppercase">พนักงานผู้รับผิดชอบ</span>
                  <span className="font-extrabold text-amber-400 truncate block">{task.assignee}</span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-500 block font-bold uppercase">ผู้สั่งงาน</span>
                  <span className="font-extrabold text-slate-300 truncate block">{task.assigner}</span>
                </div>
              </div>

              {/* ปุ่มจัดการสำหรับหัวหน้างาน */}
              {selectedRole === 'Supervisor' && (
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleAdminUpdateStatus(task.id, "เสร็จแล้ว"); }}
                    className="bg-emerald-600 text-[10px] text-white px-3 py-1.5 rounded-lg font-bold flex-1"
                  >
                    อนุมัติงาน
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleAdminUpdateStatus(task.id, "ค้าง"); }}
                    className="bg-amber-600 text-[10px] text-white px-3 py-1.5 rounded-lg font-bold flex-1"
                  >
                    สั่งแก้งาน
                  </button> 

                </div>
              )}
            </div>
          );
        })}
      </div>
    )}
  </div>
)}

{/* ปุ่มเปลี่ยนสถานะสำหรับหัวหน้างาน */}
{selectedRole === 'Supervisor' && (
  <div className="flex gap-2 mt-2">
    <button 
      onClick={() => handleAdminUpdateStatus(task.id, "เสร็จแล้ว")}
      className="bg-emerald-600 text-[10px] px-2 py-1 rounded"
    >
      อนุมัติงาน
    </button>
    <button 
      onClick={() => handleAdminUpdateStatus(task.id, "ค้าง")}
      className="bg-amber-600 text-[10px] px-2 py-1 rounded"
    >
      สั่งแก้งาน
    </button>
  </div>
)}



                     {/* ส่วนแสดงภาพเปรียบเทียบในรายละเอียดงาน */}
<div className="mt-4">
  <p className="text-[10px] text-slate-500 font-bold uppercase mb-2 tracking-widest">การเปรียบเทียบภาพถ่าย</p>
  <div className="flex gap-2.5 mb-2">
    {/* กล่องรูป Before */}
    <div className="flex-1 relative aspect-[16/10] bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
      {viewingTaskDetails && (
    <img 
      src={viewingTaskDetails.beforePhoto} 
      className="w-full h-full object-cover" 
      alt="Before" 
    />
  )}
      <div className="absolute top-1.5 left-1.5 bg-slate-950/80 backdrop-blur-sm text-[8px] font-black text-white px-2 py-0.5 rounded uppercase">Before</div>
    </div>
    
    {/* กล่องรูป After */}
    <div className="flex-1 relative aspect-[16/10] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
      {viewingTaskDetails.afterPhoto ? (
        <>
          <img src={viewingTaskDetails.afterPhoto} className="w-full h-full object-cover" alt="After" />
          <div className="absolute top-1.5 left-1.5 bg-emerald-500 text-[8px] font-black text-white px-2 py-0.5 rounded uppercase">After</div>
        </>
      ) : (
        <div className="text-center text-[10px] text-slate-500 flex flex-col items-center gap-1.5 p-2">
          <Camera className="w-5 h-5 opacity-30" />
          <span className="font-bold">รอรูปถ่าย After</span>
        </div>
      )}
    </div>
  </div>
</div>

          {/* TAB: STAFF MANAGEMENT - เพิ่มหรือลบรายชื่อพนักงานกะทำงาน */}
          {activeTab === 'staff-mgmt' && (
            <div className="space-y-4 animate-fade-in max-w-2xl mx-auto w-full text-left">
              <div>
                <h2 className="text-lg md:text-2xl font-black text-white tracking-wide">
                  ระบบทะเบียนประวัติพนักงาน
                </h2>
                <p className="text-xs text-slate-400 font-medium">คุณสามารถเพิ่มพนักงานใหม่เข้าระบบ หรือกดถังขยะสีแดงเพื่อลบชื่อพนักงานออกได้ทันทีแบบเรียลไทม์</p>
              </div>

              <form onSubmit={handleAddStaff} className="bg-[#070b16] p-4 rounded-3xl border border-slate-800/80 flex gap-2.5">
                <input 
                  type="text" 
                  value={newStaffInputName}
                  onChange={(e) => setNewStaffInputName(e.target.value)}
                  placeholder="ระบุชื่อพนักงานใหม่เพื่อขึ้นทะเบียน (เช่น: Joom, Somchai, Bella)"
                  className="flex-1 bg-slate-900/60 border border-slate-800 text-sm text-slate-200 rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-1 focus:ring-amber-500 transition"
                  required
                />
                <button 
                  type="submit"
                  className="px-5 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black rounded-2xl text-xs flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  เพิ่มรายชื่อ
                </button>
              </form>

              <div className="bg-[#070b16] rounded-3xl border border-slate-800/80 overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">พนักงานพร้อมปฏิบัติหน้าที่ขณะนี้ ({staffList.length} คน)</span>
                </div>

                <div className="divide-y divide-slate-900/60">
                  {staffList.map((name, index) => (
                    <div key={index} className="p-4 flex items-center justify-between hover:bg-slate-900/20 transition duration-155">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 font-black flex items-center justify-center uppercase text-sm">
                          {name[0]}
                        </div>
                        <span className="text-sm font-extrabold text-slate-200">{name}</span>
                      </div>
                      
                      <button 
                        onClick={() => handleRemoveStaff(name)}
                        className="p-2 bg-[#111c30] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl border border-slate-800"
                        title="ลบรายชื่อพนักงาน"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: SETTINGS - บันทึก Cloudinary */}
          {activeTab === 'settings' && (
            <div className="bg-[#070b16] p-6 rounded-3xl border border-slate-800 max-w-2xl mx-auto space-y-6 animate-fade-in text-left">
              <div>
                <h2 className="text-lg font-extrabold text-white tracking-wide flex items-center gap-2">
                  <Settings className="w-5 h-5 text-amber-400" />
                  การเชื่อมโยงระบบบันทึกรูป Cloudinary
                </h2>
                <p className="text-xs text-slate-400">เชื่อมโยงคลาวด์เพื่อบันทึกและส่งรายงานรูปภาพสถานที่จริง</p>
              </div>

              <div className="bg-[#0d1527] p-4.5 rounded-2xl border border-slate-850 text-xs leading-relaxed text-slate-300">
                <p className="font-extrabold text-amber-400 mb-1">💡 โหมดจำลองงานพรีเมียม:</p>
                <p>หากเว้นว่างไว้ ระบบจะยังอัปเดตงานแบบเรียลไทม์ได้ และจะเลือกใช้รูปจำลองความละเอียดสูงจากภาพถ่ายโรงแรมจริงของ Unsplash ให้อัตโนมัติเมื่อพนักงานส่งงาน</p>
              </div>

              <form onSubmit={saveSettings} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-355 mb-1.5 uppercase tracking-wider">Cloud Name ของคุณ</label>
                  <input 
                    type="text" 
                    value={cloudinaryConfig.cloudName}
                    onChange={(e) => setCloudinaryConfig(prev => ({ ...prev, cloudName: e.target.value }))}
                    placeholder="ใส่ Cloud Name (เช่น: dxxxxx)"
                    className="w-full bg-[#111c30] border border-slate-800 text-sm text-slate-200 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-355 mb-1.5 uppercase tracking-wider">Unsigned Upload Preset</label>
                  <input 
                    type="text" 
                    value={cloudinaryConfig.uploadPreset}
                    onChange={(e) => setCloudinaryConfig(prev => ({ ...prev, uploadPreset: e.target.value }))}
                    placeholder="ใส่ Upload Preset"
                    className="w-full bg-[#111c30] border border-slate-800 text-sm text-slate-200 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button 
                    type="submit"
                    className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-955 font-black rounded-2xl text-xs tracking-wider transition-all"
                  >
                    บันทึกข้อมูลการตั้งค่า
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setCloudinaryConfig({ cloudName: '', uploadPreset: '' });
                      localStorage.removeItem('cloudinary_cloud_name');
                      localStorage.removeItem('cloudinary_upload_preset');
                      showToast("รีเซ็ตค่าเป็นโหมดส่งภาพพรีเมียมจำลองแล้ว", "info");
                    }}
                    className="px-4 py-3 bg-[#111c30] hover:bg-slate-900 text-slate-400 hover:text-white rounded-2xl text-xs font-bold border border-slate-800"
                  >
                    ล้างค่า
                  </button>
                </div>
              </form>
            </div>
          )}

        </main>
      </div>

      {/* --- ตัวเนวิเกเตอร์หน้าล่างสำหรับมือถือ --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#070b16]/95 backdrop-blur-md border-t border-amber-500/10 flex justify-around py-3 z-45 shadow-2xl">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-amber-400' : 'text-slate-500'}`}>
          <TrendingUp className="w-5 h-5" />
          <span className="text-[9px] font-black">แดชบอร์ด</span>
        </button>
        <button onClick={() => setActiveTab('tasks')} className={`flex flex-col items-center gap-1 ${activeTab === 'tasks' ? 'text-amber-400' : 'text-slate-500'}`}>
          <div className="relative">
            <Layers className="w-5 h-5" />
            <span className="absolute -top-1.5 -right-2 bg-amber-500 text-slate-955 text-[8px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center">
              {tasks.length}
            </span>
          </div>
          <span className="text-[9px] font-black">รายการงาน</span>
        </button>
        <button onClick={() => setActiveTab('staff-mgmt')} className={`flex flex-col items-center gap-1 ${activeTab === 'staff-mgmt' ? 'text-amber-400' : 'text-slate-500'}`}>
          <Users className="w-5 h-5" />
          <span className="text-[9px] font-black">พนักงาน</span>
        </button>
        {selectedRole === 'Supervisor' && (
          <button onClick={() => setShowAssignModal(true)} className="flex flex-col items-center gap-1 text-slate-500">
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span className="text-[9px] font-black">สั่งงาน</span>
          </button>
        )}
        <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 ${activeTab === 'settings' ? 'text-amber-400' : 'text-slate-500'}`}>
          <Settings className="w-5 h-5" />
          <span className="text-[9px] font-black">ตั้งค่า</span>
        </button>
      </nav>

      {/* --- โมดอลการมอบหมายงานตรวจ --- */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-[#070b16]/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0d1527] border border-slate-805 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between p-4.5 bg-[#111c30] border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-white text-sm">สั่งมอบหมายงานบริการใหม่</h3>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-405"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleCreateTask} className="p-5 space-y-4.5 overflow-y-auto flex-1 text-left">
              <div>
                <label className="block text-[11px] font-black text-slate-400 mb-1.5 uppercase">บริเวณห้องที่ต้องการทำความสะอาด / ตรวจงาน</label>
                <input 
                  type="text" 
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="เช่น: ตรวจความสะอาดและกวาดระเบียงห้องวิลล่า 204"
                  className="w-full bg-[#111c30] border border-slate-850 text-slate-200 rounded-2xl p-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-400 mb-1.5 uppercase">พนักงานรับผิดชอบ</label>
                  <select 
                    value={newTaskAssignee}
                    onChange={(e) => {
                      setNewTaskAssignee(e.target.value);
                      if (e.target.value !== 'other') setCustomAssignee('');
                    }}
                    className="w-full bg-[#111c30] border border-slate-850 text-slate-200 rounded-2xl p-3.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    {staffList.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                    <option value="other">✍️ พิมพ์ลงทะเบียนชื่อพนักงานใหม่...</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 mb-1.5 uppercase">ผู้ตรวจงาน</label>
                  <select 
                    value={newTaskAssigner}
                    onChange={(e) => setNewTaskAssigner(e.target.value)}
                    className="w-full bg-[#111c30] border border-slate-800 text-slate-200 rounded-2xl p-3.5 text-xs focus:outline-none"
                  >
                    {DEFAULT_ASSIGNERS.map(as => (
                      <option key={as} value={as}>ผู้ตรวจ: {as}</option>
                    ))}
                  </select>
                </div>
              </div>

              {newTaskAssignee === 'other' && (
                <input 
                  type="text" 
                  value={customAssignee}
                  onChange={(e) => setCustomAssignee(e.target.value)}
                  placeholder="ระบุชื่อจริงพนักงาน"
                  className="w-full bg-[#111c30] border border-slate-850 text-slate-200 rounded-2xl p-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                  required
                />
              )}

              <div>
                <label className="block text-[11px] font-black text-slate-400 mb-1.5 uppercase">ถ่ายภาพห้องประกอบงานมอบหมาย (Before Photo)</label>
                <label className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-[#111c30] border border-dashed border-slate-800 rounded-2xl cursor-pointer text-xs font-bold text-slate-300">
                  <Camera className="w-4.5 h-4.5" />
                  เปิดกล้องถ่ายภาพความสะอาด ก่อนทำ (Before)
                  <input type="file" accept="image/*" onChange={(e) => e.target.files[0] && setBeforeImageFile(e.target.files[0])} className="hidden" />
                </label>
                {beforeImageFile && <p className="text-xs text-amber-400 mt-2">เลือกไฟล์เตรียมอัปโหลด: {beforeImageFile.name}</p>}
              </div>

              <div className="pt-4 flex gap-3 border-t border-slate-900">
                <button type="submit" disabled={isUploading} className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-955 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2">
                  {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[3]" />}
                  บันทึกสั่งงานเข้ากะเรียลไทม์
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- โมดอลตรวจงาน พร้อม Before/After Slider อัจฉริยะ --- */}
      {viewingTaskDetails && (
        <div className="fixed inset-0 bg-[#070b16]/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0d1527] border border-slate-800 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-slide-up">
            
            <div className="flex items-center justify-between p-4.5 bg-[#111c30] border-b border-slate-800/80">
              <div className="text-left">
                <span className="text-[9px] text-slate-500 font-black block uppercase tracking-widest">เปรียบเทียบผลงานก่อนและหลังทำความสะอาด</span>
                <span className="text-xs font-bold text-amber-400">{viewingTaskDetails.timestamp}</span>
              </div>
              <button onClick={() => { setViewingTaskDetails(null); setAfterImageFile(null); }} className="text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-5 space-y-4.5 overflow-y-auto flex-1 text-left">
              <div>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${viewingTaskDetails.status === 'เสร็จแล้ว' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                  {viewingTaskDetails.status === 'เสร็จแล้ว' ? 'เสร็จเรียบร้อย' : 'กำลังดำเนินการ'}
                </span>
                <h2 className="text-base md:text-lg font-black text-white leading-snug mt-1">{viewingTaskDetails.taskName}</h2>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-[#111c30] rounded-2xl border border-slate-800 text-xs">
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase font-black">ผู้รับผิดชอบ</span>
                  <span className="text-amber-400 font-extrabold">{viewingTaskDetails.assignee}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase font-black">ผู้สั่งงานตรวจ</span>
                  <span className="text-slate-300 font-extrabold">{viewingTaskDetails.assigner}</span>
                </div>
              </div>

              {/* สไลเดอร์เปรียบเทียบ Before/After */}
              <div>
                <h4 className="text-xs font-black text-slate-300 mb-2.5 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-amber-500" />
                  เลื่อนเปรียบเทียบความแตกต่าง (Before/After Slider)
                </h4>
                
                {viewingTaskDetails.afterPhoto ? (
                  <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl select-none group">
                    <img src={viewingTaskDetails.afterPhoto} alt="After" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute top-3 right-3 bg-emerald-500 text-[9px] font-black text-white px-2 py-1 rounded-md z-10">AFTER</div>

                    <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${sliderPosition}%` }}>
                      <img src={viewingTaskDetails.beforePhoto} alt="Before" className="absolute inset-0 w-full h-full object-cover max-w-none" style={{ width: '100%', height: '100%' }} />
                      <div className="absolute top-3 left-3 bg-[#111c30] text-[9px] font-black text-slate-300 px-2 py-1 rounded-md z-10">BEFORE</div>
                    </div>

                    <div className="absolute inset-y-0 w-1 bg-amber-500 cursor-ew-resize flex items-center justify-center" style={{ left: `${sliderPosition}%` }}>
                      <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-955 flex items-center justify-center font-bold text-xs shadow-xl ring-4 ring-[#111c30]/50">↔</div>
                    </div>

                    <input type="range" min="0" max="100" value={sliderPosition} onChange={(e) => setSliderPosition(Number(e.target.value))} className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="bg-[#111c30] rounded-2xl overflow-hidden border border-slate-800">
                      <div className="relative aspect-[4/3]">
                        <img src={viewingTaskDetails.beforePhoto} className="w-full h-full object-cover" />
                        <span className="absolute top-2 left-2 bg-slate-950/90 text-[9px] font-black text-slate-300 px-2.5 py-1 rounded">BEFORE</span>
                      </div>
                    </div>
                    <div className="bg-[#111c30] rounded-2xl border border-slate-800 flex items-center justify-center p-6 aspect-[4/3]">
                      <div className="text-center text-slate-500 text-xs font-bold">รอพนักงานส่งรูปงาน After</div>
                    </div>
                  </div>
                )}
              </div>

              {selectedRole === 'Staff' && viewingTaskDetails.status !== "เสร็จแล้ว" && (
                <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/25 space-y-3">
                  <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5"><Camera className="w-4 h-4" />รายงานส่งภาพถ่ายความสะอาดสำเร็จ (After Photo)</h4>
                  <div className="flex flex-col gap-2.5">
                    <label className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#070b16] border border-dashed border-slate-850 rounded-2xl cursor-pointer text-xs text-slate-300 font-bold">
                      <Camera className="w-4.5 h-4.5" />
                      เปิดกล้องมือถือถ่ายรายงานความเรียบร้อย
                      <input type="file" accept="image/*" onChange={(e) => e.target.files[0] && setAfterImageFile(e.target.files[0])} className="hidden" />
                    </label>
                    {afterImageFile && <p className="text-xs text-amber-400 font-bold">รูปพร้อมอัปโหลด: {afterImageFile.name}</p>}
                    <button onClick={() => handleUploadAfterAndComplete(viewingTaskDetails.id)} className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-955 font-black rounded-2xl text-xs flex items-center justify-center gap-2">
                      {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[3]" />}
                      รายงานเสร็จงานเรียบร้อย
                    </button>
                  </div>
                </div>
              )}

              {selectedRole === 'Supervisor' && (
                <div className="space-y-2 pt-3.5 border-t border-slate-900 text-right">
                  <button onClick={() => handleDeleteTask(viewingTaskDetails.id)} className="px-3.5 py-2 text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-450 rounded-xl border border-rose-500/20">ลบข้อมูลงานตรวจนี้ออก</button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}