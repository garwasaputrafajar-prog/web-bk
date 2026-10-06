const { useState, useEffect } = React;

const App = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [activeTab, setActiveTab] = useState('Dashboard');
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    
    const [students, setStudents] = useState([]);
    const [graduatedStudents, setGraduatedStudents] = useState([]);
    const [violations, setViolations] = useState([]);
    const [prestasi, setPrestasi] = useState([]);
    const [homeVisits, setHomeVisits] = useState([]);
    const [monitoringHistory, setMonitoringHistory] = useState([]);
    const [scriptUrl, setScriptUrl] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);
    
    // LOGO STATE
    const [logoUrl, setLogoUrl] = useState("https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRbMusPN1fa4M-B-AbV3wflipQpI0MNwGnHXg&s");

    const [notifications, setNotifications] = useState([]);
    const [showInbox, setShowInbox] = useState(false);
    const [selectedStudentDetail, setSelectedStudentDetail] = useState(null);
    
    const [searchGlobal, setSearchGlobal] = useState('');
    const [searchInForm, setSearchInForm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('');
    
    // SURAT PANGGILAN STATE & TEMPLATE
    const [letter, setLetter] = useState({ 
        sId: '', 
        no: '426.11/ /BK-SMK.IPTEK/ /2026', 
        time: '', 
        info: '', 
        type: 'Panggilan Orang Tua', 
        address: '', 
        statement: '', 
        reason: '',
        parentName: '',
        parentJob: '',
        staffName: 'YAYAT SETIAWAN, S.T',
        staffNip: '-',
        staffPosition: 'Guru BK SMK IPTEK SANGGABUANA',
        petugas2: '-',
        date: new Date().toISOString().split('T')[0]
    });
    const [letterTemplate, setLetterTemplate] = useState({
        header: "Pemerintah Kabupaten Karawang",
        subHeader: "SMK IPTEK SANGGABUANA KARAWANG",
        address: "Jl. Raya Karawang No. 45, Kode Pos 37161",
        closing: "Guru BK SMK IPTEK SANGGABUANA"
    });

    useEffect(() => { lucide.createIcons(); }, [isAuthenticated, loginError, activeTab, isSidebarOpen, isModalOpen, students, violations, prestasi, homeVisits, notifications, showInbox, selectedStudentDetail, logoUrl]);

    useEffect(() => {
        const handleStorageChange = () => {
            const pendingReport = localStorage.getItem('newReport');
            if (pendingReport) {
                const data = JSON.parse(pendingReport);
                setNotifications(prev => [{
                    id: Date.now(),
                    msg: `PENGADUAN SISWA: ${data.nama} (${data.kelas}) - ${data.isi}`,
                    read: false
                }, ...prev]);
                localStorage.removeItem('newReport');
                new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play();
            }
        };
        window.addEventListener('storage', handleStorageChange);
        
        // LOAD DATA FROM STORAGE ON MOUNT
        const savedData = localStorage.getItem('bk_panel_db');
        if (savedData) {
            const parsed = JSON.parse(savedData);
            const validSId = new Set((parsed.students || []).map(s => s.id));

            if (parsed.students) setStudents(parsed.students);
            if (parsed.graduatedStudents) setGraduatedStudents(parsed.graduatedStudents);
            
            // Filter orphans (riwayat yang tertinggal dari siswa yang sudah dihapus sebelumnya)
            if (parsed.violations) setViolations(parsed.violations.filter(v => validSId.has(Number(v.sId))));
            if (parsed.prestasi) setPrestasi(parsed.prestasi.filter(p => validSId.has(Number(p.sId))));
            if (parsed.homeVisits) setHomeVisits(parsed.homeVisits.filter(h => validSId.has(Number(h.sId))));
            if (parsed.monitoringHistory) setMonitoringHistory(parsed.monitoringHistory.filter(m => validSId.has(Number(m.sId))));
            
            if (parsed.logoUrl) setLogoUrl(parsed.logoUrl);
            if (parsed.notifications) setNotifications(parsed.notifications);
            if (parsed.scriptUrl) setScriptUrl(parsed.scriptUrl);
        }

        const auth = localStorage.getItem('bk_auth');
        if (auth === 'true') {
            setIsAuthenticated(true);
        }

        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // SAVE DATA TO STORAGE ON EVERY CHANGE
    useEffect(() => {
        const db = {
            students,
            graduatedStudents,
            violations,
            prestasi,
            homeVisits,
            monitoringHistory,
            logoUrl,
            notifications,
            scriptUrl
        };
        localStorage.setItem('bk_panel_db', JSON.stringify(db));
    }, [students, graduatedStudents, violations, prestasi, homeVisits, monitoringHistory, logoUrl, notifications, scriptUrl]);

    const syncToCloud = async () => {
        if (!scriptUrl) return alert("Masukkan URL Google Script terlebih dahulu di Dashboard!");
        setIsSyncing(true);
        try {
            const db = { students, graduatedStudents, violations, prestasi, homeVisits, monitoringHistory, logoUrl, notifications };
            await fetch(scriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(db)
            });
            alert("Berhasil Sinkronisasi ke Cloud!");
        } catch (err) {
            console.error(err);
            alert("Gagal sinkronisasi. Cek URL atau koneksi internet.");
        }
        setIsSyncing(false);
    };

    const fetchFromCloud = async () => {
        if (!scriptUrl) return alert("Masukkan URL Google Script terlebih dahulu di Dashboard!");
        setIsSyncing(true);
        try {
            const res = await fetch(scriptUrl);
            const data = await res.json();
            if (data.students) setStudents(data.students);
            if (data.graduatedStudents) setGraduatedStudents(data.graduatedStudents);
            if (data.violations) setViolations(data.violations);
            if (data.prestasi) setPrestasi(data.prestasi);
            if (data.homeVisits) setHomeVisits(data.homeVisits);
            if (data.monitoringHistory) setMonitoringHistory(data.monitoringHistory);
            if (data.logoUrl) setLogoUrl(data.logoUrl);
            alert("Data berhasil diunduh dari Cloud!");
        } catch (err) {
            console.error(err);
            alert("Gagal mengunduh data. Pastikan URL benar dan Apps Script sudah di-deploy.");
        }
        setIsSyncing(false);
    };

    const getStatus = (pts) => {
        if (pts > 50) return 'BAHAYA';
        if (pts >= 20) return 'WASPADA';
        if (pts > 0) return 'PEMBINAAN';
        return 'AKTIF';
    };

    const deleteStudent = (id) => {
        if(confirm("Apakah Anda yakin ingin menghapus data siswa ini? Semua riwayat pelanggaran juga akan terhapus.")) {
            setStudents(students.filter(s => s.id !== id));
            setViolations(violations.filter(v => v.sId !== id));
            // Juga hapus data lain yang terkait agar tidak menjadi sampah (orphaned data)
            setPrestasi(prestasi.filter(p => Number(p.sId) !== id));
            setHomeVisits(homeVisits.filter(h => Number(h.sId) !== id));
            setMonitoringHistory(monitoringHistory.filter(m => Number(m.sId) !== id));
        }
    };

    const [editStudent, setEditStudent] = useState(null);
    const handleEditStudent = (student) => {
        setEditStudent(student);
        setModalType('student_edit');
        setIsModalOpen(true);
    };

    const handleUpdateStudent = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        setStudents(students.map(s => s.id === editStudent.id ? { 
            ...s, 
            nis: fd.get('nis'), 
            name: fd.get('name'), 
            class: fd.get('class') 
        } : s));
        setIsModalOpen(false);
        setEditStudent(null);
    };

    const handleAddStudent = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const newStudent = { id: Date.now(), nis: fd.get('nis'), name: fd.get('name'), class: fd.get('class'), points: 0, status: 'AKTIF' };
        setStudents([...students, newStudent]);
        setIsModalOpen(false);
    };

    const handleAddViolation = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const sId = parseInt(fd.get('sId'));
        const pts = parseInt(fd.get('pts'));
        const type = fd.get('type');
        const sName = students.find(s => s.id === sId)?.name;

        setViolations([{ id: Date.now(), sId, type, date: fd.get('date'), pts, note: fd.get('note') }, ...violations]);
        setStudents(students.map(s => {
            if(s.id === sId) {
                const newPts = s.points + pts;
                return { ...s, points: newPts, status: getStatus(newPts) };
            }
            return s;
        }));
        setIsModalOpen(false);
        setSearchInForm('');
    };

    const [editViolation, setEditViolation] = useState(null);

    const handleEditViolation = (v) => {
        setEditViolation(v);
        setModalType('violation_edit');
        setIsModalOpen(true);
    };

    const handleUpdateViolation = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const sId = parseInt(fd.get('sId'));
        const pts = parseInt(fd.get('pts'));
        const type = fd.get('type');
        const date = fd.get('date');
        const note = fd.get('note');

        const oldPts = editViolation.pts;
        const oldSId = parseInt(editViolation.sId);

        setViolations(violations.map(v => v.id === editViolation.id ? {
            ...v, sId, type, date, pts, note
        } : v));

        setStudents(students.map(s => {
            if (s.id === oldSId && s.id === sId) {
                const newPts = s.points - oldPts + pts;
                return { ...s, points: newPts, status: getStatus(newPts) };
            } else if (s.id === oldSId) {
                const newPts = s.points - oldPts;
                return { ...s, points: newPts, status: getStatus(newPts) };
            } else if (s.id === sId) {
                const newPts = s.points + pts;
                return { ...s, points: newPts, status: getStatus(newPts) };
            }
            return s;
        }));

        setIsModalOpen(false);
        setEditViolation(null);
    };

    const handleAddPrestasi = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        setPrestasi([{ id: Date.now(), sId: parseInt(fd.get('sId')), rank: fd.get('rank'), event: fd.get('event'), className: fd.get('className'), date: fd.get('date') }, ...prestasi]);
        setIsModalOpen(false);
    };

    const handleAddGraduatedStudent = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        setGraduatedStudents([{ id: Date.now(), nis: fd.get('nis'), name: fd.get('name'), class: fd.get('class'), reason: fd.get('reason'), date: fd.get('date') }, ...graduatedStudents]);
        setIsModalOpen(false);
    };

    const handleAddMonitoring = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        setMonitoringHistory([{ id: Date.now(), sId: parseInt(fd.get('sId')), date: fd.get('date'), note: fd.get('note') }, ...monitoringHistory]);
        setIsModalOpen(false);
    };

    const handleAddHomeVisit = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        setHomeVisits([{ id: Date.now(), sId: parseInt(fd.get('sId')), wali: fd.get('wali'), result: fd.get('result'), date: fd.get('date') }, ...homeVisits]);
        setIsModalOpen(false);
    };

    const handleImportExcel = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                const newStudents = data.map(item => ({
                    id: Date.now() + Math.random(),
                    nis: item.NIS || item.nis || item.Nis || '',
                    name: item.Nama || item.nama || item.Name || item.name || '',
                    class: item.Kelas || item.kelas || item.Class || item.class || '',
                    points: 0,
                    status: 'AKTIF'
                })).filter(s => s.nis && s.name);

                if (newStudents.length > 0) {
                    setStudents(prev => [...prev, ...newStudents]);
                    alert(`${newStudents.length} siswa berhasil diimpor!`);
                } else {
                    alert("Tidak Ada Data valid yang ditemukan. Pastikan header kolom adalah NIS, Nama, dan Kelas.");
                }
            } catch (err) {
                console.error(err);
                alert("Gagal membaca file. Pastikan format file benar.");
            }
        };
        reader.readAsBinaryString(file);
    };

    const SidebarItem = ({ id, icon, label }) => (
        <button onClick={() => setActiveTab(id)} className={`w-full flex items-center gap-3 p-3 rounded-xl transition ${activeTab === id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
            <i data-lucide={icon} className="w-5 h-5"></i>
            {isSidebarOpen && <span className="text-sm font-semibold">{label}</span>}
        </button>
    );

    const handleLogin = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const user = fd.get('username');
        const pass = fd.get('password');
        
        if (user === 'gurubk' && pass === 'admin123') {
            setIsAuthenticated(true);
            localStorage.setItem('bk_auth', 'true');
            setLoginError('');
        } else {
            setLoginError('Username atau password salah. Akses khusus Guru BK.');
        }
    };

    const handleLogout = () => {
        if(confirm("Apakah Anda yakin ingin keluar?")) {
            setIsAuthenticated(false);
            localStorage.removeItem('bk_auth');
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-900 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600 rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-pulse duration-[10s]"></div>
                    <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-600 rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-pulse duration-[12s]"></div>
                </div>
                
                <div className="bg-slate-900/80 backdrop-blur-2xl p-10 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-slate-700 w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="text-center mb-8">
                        <div className="bg-white p-3 rounded-2xl inline-block mb-6 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-300">
                            <img src={logoUrl} alt="Logo" className="w-16 h-16 object-contain" />
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight">PORTAL GURU BK</h1>
                        <p className="text-xs text-blue-400 mt-2 font-bold tracking-widest uppercase">SMK IPTEK SANGGABUANA</p>
                    </div>
                    
                    {loginError && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-2xl text-xs mb-6 font-bold flex items-center gap-3 animate-in shake">
                            <i data-lucide="alert-triangle" className="w-5 h-5 flex-shrink-0"></i>
                            {loginError}
                        </div>
                    )}
                    
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Username</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                                    <i data-lucide="user" className="w-5 h-5"></i>
                                </div>
                                <input name="username" type="text" className="w-full bg-slate-800/50 border border-slate-700 text-white placeholder-slate-600 p-4 pl-12 rounded-2xl outline-none focus:border-blue-500 focus:bg-slate-800 focus:ring-4 focus:ring-blue-500/20 transition-all font-medium text-sm" required placeholder="Masukkan username" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                                    <i data-lucide="lock" className="w-5 h-5"></i>
                                </div>
                                <input name="password" type="password" className="w-full bg-slate-800/50 border border-slate-700 text-white placeholder-slate-600 p-4 pl-12 rounded-2xl outline-none focus:border-blue-500 focus:bg-slate-800 focus:ring-4 focus:ring-blue-500/20 transition-all font-medium text-sm" required placeholder="••••••••" />
                            </div>
                        </div>
                        
                        <div className="pt-2">
                            <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] hover:-translate-y-1 flex items-center justify-center gap-3">
                                Masuk Aplikasi <i data-lucide="arrow-right" className="w-4 h-4"></i>
                            </button>
                        </div>
                    </form>
                    
                    <div className="mt-8 text-center pt-6 border-t border-slate-800">
                        <p className="text-[10px] text-slate-500 font-medium">© {new Date().getFullYear()} Sistem Informasi Bimbingan Konseling.<br/>Hanya untuk akses internal.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden">
            {/* SIDEBAR */}
            <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all duration-300 no-print`}>
                <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                    <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain bg-white rounded-full p-1" />
                    {isSidebarOpen && <span className="font-bold text-lg tracking-tight uppercase">BK PANEL</span>}
                </div>
                <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-100px)] custom-scroll">
                    <SidebarItem id="Dashboard" icon="layout-dashboard" label="Dashboard" />
                    <SidebarItem id="Pantauan Siswa" icon="alert-circle" label="Pantauan" />
                    <SidebarItem id="Data Siswa" icon="users" label="Data Siswa" />
                    <SidebarItem id="Siswa Keluar" icon="user-minus" label="Siswa Keluar" />
                    <SidebarItem id="Pelanggaran" icon="clipboard-list" label="Pelanggaran" />
                    <SidebarItem id="Surat & Dokumen" icon="mail" label="Surat & Dokumen" />
                    <SidebarItem id="Riwayat Pantauan" icon="history" label="Riwayat Pantauan" />
                    <SidebarItem id="Prestasi" icon="award" label="Prestasi" />
                    <SidebarItem id="Home Visit" icon="home" label="Home Visit" />
                    <SidebarItem id="Laporan" icon="pie-chart" label="Laporan" />
                </nav>
            </aside>

            <main className="flex-1 flex flex-col overflow-hidden bg-slate-50">
                <header className="h-16 bg-white border-b flex items-center justify-between px-8 no-print relative">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg"><i data-lucide="menu"></i></button>
                        <h2 className="font-bold text-slate-600 uppercase text-xs tracking-widest">{activeTab}</h2>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <button onClick={() => setShowInbox(!showInbox)} className="p-2 hover:bg-slate-100 rounded-full relative">
                                <i data-lucide="bell" className={`w-5 h-5 ${notifications.some(n => !n.read) ? 'text-blue-600 bell-bounce' : 'text-slate-400'}`}></i>
                                {notifications.some(n => !n.read) && (
                                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full font-bold">
                                        {notifications.filter(n => !n.read).length}
                                    </span>
                                )}
                            </button>
                            {showInbox && (
                                <div className="absolute right-0 mt-2 w-72 bg-white border shadow-2xl rounded-2xl z-50 overflow-hidden">
                                    <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                                        <h3 className="text-xs font-black uppercase text-slate-500">Pesan Masuk</h3>
                                        <div className="flex gap-3">
                                            <button onClick={() => setNotifications(notifications.map(n => ({...n, read: true})))} className="text-[10px] text-blue-600 font-bold">Tandai Dibaca</button>
                                            <button onClick={() => confirm("Hapus semua riwayat notifikasi?") && setNotifications([])} className="text-[10px] text-red-500 font-bold">Hapus Semua</button>
                                        </div>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto custom-scroll">
                                        {notifications.length === 0 ? <p className="p-4 text-center text-xs text-slate-400">Tidak ada pesan.</p> : notifications.map(n => (
                                            <div key={n.id} className={`p-4 border-b text-[11px] leading-relaxed ${!n.read ? 'bg-blue-50' : 'text-slate-500'}`}>{n.msg}</div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right"><p className="text-[10px] font-bold text-slate-400 uppercase">SMK IPTEK SANGGABUANA</p></div>
                            <img src={logoUrl} className="w-8 h-8 rounded-full bg-slate-100 p-1 object-contain" />
                            <div className="w-px h-8 bg-slate-200 mx-1"></div>
                            <button onClick={handleLogout} className="p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition shadow-sm" title="Keluar">
                                <i data-lucide="log-out" className="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 custom-scroll">
                    {/* DASHBOARD SECTION DENGAN EDIT LOGO */}
                    {activeTab === 'Dashboard' && (
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="bg-blue-100 p-3 rounded-full text-blue-600"><i data-lucide="cloud"></i></div>
                                    <div>
                                        <h2 className="font-bold text-lg">Cloud Database Sync</h2>
                                        <p className="text-xs text-slate-400">Hubungkan ke Google Sheets untuk backup data permanen.</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full md:w-auto">
                                    <input 
                                        type="text" 
                                        placeholder="Paste Apps Script URL..." 
                                        className="text-xs border p-2 rounded-xl flex-1 md:w-80 outline-none focus:ring-2 focus:ring-blue-500"
                                        value={scriptUrl}
                                        onChange={(e) => setScriptUrl(e.target.value)}
                                    />
                                    <button onClick={fetchFromCloud} disabled={isSyncing} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-200">Unduh</button>
                                    <button onClick={syncToCloud} disabled={isSyncing} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 flex items-center gap-2">
                                        {isSyncing ? '...' : <><i data-lucide="refresh-cw" className="w-3 h-3"></i> Sync</>}
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="flex items-center gap-4">
                                    <img src={logoUrl} className="w-16 h-16 object-contain p-2 border rounded-full bg-slate-50" />
                                    <div>
                                        <h2 className="font-bold text-lg">Konfigurasi Instansi</h2>
                                        <p className="text-xs text-slate-400">Sesuaikan identitas visual sekolah Anda.</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full md:w-auto">
                                    <input 
                                        type="text" 
                                        placeholder="Tempel URL Logo Baru..." 
                                        className="text-xs border p-2 rounded-xl flex-1 md:w-64 outline-none focus:ring-2 focus:ring-blue-500"
                                        onBlur={(e) => e.target.value && setLogoUrl(e.target.value)}
                                    />
                                    <button className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold">Ganti Logo</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="bg-white p-6 rounded-2xl border shadow-sm"><p className="text-slate-400 text-xs font-bold uppercase">Total Siswa</p><h3 className="text-3xl font-black">{students.length}</h3></div>
                                <div className="bg-white p-6 rounded-2xl border shadow-sm border-l-4 border-red-500"><p className="text-slate-400 text-xs font-bold uppercase">Pelanggaran</p><h3 className="text-3xl font-black text-red-600">{violations.length}</h3></div>
                                <div className="bg-white p-6 rounded-2xl border shadow-sm border-l-4 border-green-500"><p className="text-slate-400 text-xs font-bold uppercase">Prestasi</p><h3 className="text-3xl font-black text-green-600">{prestasi.length}</h3></div>
                                <div className="bg-white p-6 rounded-2xl border shadow-sm border-l-4 border-blue-500"><p className="text-slate-400 text-xs font-bold uppercase">Home Visit</p><h3 className="text-3xl font-black text-blue-600">{homeVisits.length}</h3></div>
                            </div>
                            
                            <div className="bg-white p-6 rounded-2xl border shadow-sm">
                                <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-sm"><i data-lucide="history" className="w-4 h-4 text-blue-500"></i> Aktivitas Terbaru</h4>
                                <div className="space-y-3">
                                    {violations.length === 0 ? <p className="text-xs text-slate-400 italic">Belum ada data terbaru.</p> : violations.slice(0,3).map(v => (
                                        <div key={v.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            <span className="text-xs font-bold">{students.find(s=>s.id==v.sId)?.name} <span className="font-normal text-slate-400 ml-2">Melakukan {v.type}</span></span>
                                            <span className="text-[10px] font-black text-red-500">+{v.pts} POIN</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PANTAUAN SECTION DENGAN DIAGRAM */}
                    {activeTab === 'Pantauan Siswa' && (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* DIAGRAM BATANG */}
                                <div className="bg-white p-6 rounded-3xl border shadow-sm">
                                    <h3 className="font-bold text-sm mb-6 flex items-center gap-2"><i data-lucide="bar-chart-2" className="text-blue-500"></i> Statistik Pelanggaran Berkala</h3>
                                    <div className="flex items-end justify-between h-48 px-4 border-b">
                                        <div className="flex flex-col items-center gap-2 w-1/4">
                                            <div className="bg-red-400 w-full rounded-t-xl transition-all duration-1000" style={{height: '40%'}}></div>
                                            <span className="text-[10px] font-bold">Mingguan</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-2 w-1/4">
                                            <div className="bg-amber-400 w-full rounded-t-xl transition-all duration-1000" style={{height: '75%'}}></div>
                                            <span className="text-[10px] font-bold">Bulanan</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-2 w-1/4">
                                            <div className="bg-blue-400 w-full rounded-t-xl transition-all duration-1000" style={{height: '90%'}}></div>
                                            <span className="text-[10px] font-bold">Tahunan</span>
                                        </div>
                                    </div>
                                </div>
                                {/* DIAGRAM LINGKARAN */}
                                <div className="bg-white p-6 rounded-3xl border shadow-sm flex flex-col md:flex-row items-center gap-8">
                                    <div className="pie-chart shadow-xl"></div>
                                    <div className="space-y-3">
                                        <h3 className="font-bold text-sm">Persentase Kasus</h3>
                                        <div className="flex items-center gap-3 text-[11px]"><div className="w-3 h-3 bg-red-500 rounded-full"></div> <span>BAHAYA (100%)</span></div>
                                        <div className="flex items-center gap-3 text-[11px]"><div className="w-3 h-3 bg-amber-500 rounded-full"></div> <span>WASPADA (50%)</span></div>
                                        <div className="flex items-center gap-3 text-[11px]"><div className="w-3 h-3 bg-blue-500 rounded-full"></div> <span>PEMBINAAN (30%)</span></div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* LIST PANTAUAN EXIST (TIDAK BERUBAH) */}
                            <div className="bg-white p-6 rounded-3xl border shadow-sm">
                                <h3 className="font-bold text-sm mb-4">Daftar Pantauan Prioritas</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {students.filter(s => s.points > 0).sort((a,b)=> b.points - a.points).map(s => (
                                        <div key={s.id} className="p-4 border rounded-2xl flex justify-between items-center hover:bg-slate-50 transition">
                                            <div>
                                                <p className="text-xs font-bold">{s.name}</p>
                                                <p className="text-[10px] text-slate-400">Kelas {s.class} • {s.points} Poin</p>
                                            </div>
                                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black ${s.status === 'BAHAYA' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'}`}>{s.status}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Data Siswa' && (
                        <div className="bg-white rounded-2xl border shadow-sm">
                            <div className="p-4 border-b flex justify-between bg-slate-50/50">
                                <input type="text" placeholder="Cari siswa..." className="border px-4 py-2 rounded-xl text-sm w-64 outline-none focus:ring-2 focus:ring-blue-500" onChange={e => setSearchGlobal(e.target.value)} />
                                <div className="flex gap-2">
                                    <label className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-2 hover:bg-emerald-700 transition shadow-sm">
                                        <i data-lucide="file-up" className="w-4 h-4"></i> Import Excel
                                        <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleImportExcel} />
                                    </label>
                                    <button onClick={() => {setModalType('student'); setIsModalOpen(true)}} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition">+ Siswa</button>
                                </div>
                            </div>
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b">
                                    <tr><th className="p-4">NIS</th><th className="p-4">Nama</th><th className="p-4">Kelas</th><th className="p-4">Poin</th><th className="p-4">Status</th><th className="p-4">Aksi</th></tr>
                                </thead>
                                <tbody className="divide-y text-sm">
                                    {students.length === 0 ? <tr><td colSpan="6" className="p-8 text-center text-slate-400 italic">Belum ada data siswa.</td></tr> : students.filter(s => s.name.toLowerCase().includes(searchGlobal.toLowerCase())).map(s => (
                                        <tr key={s.id} className="hover:bg-blue-50/50 transition">
                                            <td className="p-4 font-mono text-xs">{s.nis}</td>
                                            <td className="p-4 font-bold">{s.name}</td>
                                            <td className="p-4">{s.class}</td>
                                            <td className="p-4 font-black text-blue-600">{s.points}</td>
                                            <td className="p-4"><span className={`px-2 py-1 rounded-lg text-[10px] font-black ${s.status === 'BAHAYA' ? 'bg-red-100 text-red-600' : s.status === 'WASPADA' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>{s.status}</span></td>
                                            <td className="p-4 flex gap-2">
                                                <button onClick={() => setSelectedStudentDetail(s)} className="text-blue-500 hover:bg-blue-100 p-1 rounded" title="Lihat Detail"><i data-lucide="eye" className="w-4 h-4"></i></button>
                                                <button onClick={() => handleEditStudent(s)} className="text-amber-500 hover:bg-amber-100 p-1 rounded" title="Edit Data"><i data-lucide="edit" className="w-4 h-4"></i></button>
                                                <button onClick={() => deleteStudent(s.id)} className="text-red-400 hover:text-red-600 p-1"><i data-lucide="trash-2" className="w-4 h-4"></i></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {selectedStudentDetail && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
                                <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                                    <h3 className="font-bold">Detail Pelanggaran: {selectedStudentDetail.name}</h3>
                                    <button onClick={() => setSelectedStudentDetail(null)}><i data-lucide="x"></i></button>
                                </div>
                                <div className="p-6 h-96 overflow-y-auto custom-scroll">
                                    <div className="space-y-3">
                                        {violations.filter(v => v.sId === selectedStudentDetail.id).length === 0 ? <p className="text-center text-slate-400 text-sm py-10 italic">Belum ada catatan pelanggaran.</p> : 
                                            violations.filter(v => v.sId === selectedStudentDetail.id).map(v => (
                                                <div key={v.id} className="p-3 bg-slate-50 rounded-xl border flex justify-between items-center">
                                                    <div>
                                                        <p className="text-xs font-bold uppercase">{v.type}</p>
                                                        <p className="text-[10px] text-slate-500">{v.date}</p>
                                                    </div>
                                                    <span className="text-red-600 font-black text-sm">+{v.pts}</span>
                                                </div>
                                            ))
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SISWA KELUAR SECTION */}
                    {activeTab === 'Siswa Keluar' && (
                        <div className="bg-white rounded-2xl border shadow-sm">
                            <div className="p-4 border-b flex justify-between bg-slate-50/50">
                                <h3 className="font-bold text-sm">Data Siswa Keluar</h3>
                                <button onClick={() => {setModalType('graduated'); setIsModalOpen(true)}} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold">+ Input Siswa Keluar</button>
                            </div>
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b">
                                    <tr><th className="p-4">NIS</th><th className="p-4">Nama</th><th className="p-4">Kelas</th><th className="p-4">Alasan</th><th className="p-4">Tanggal</th></tr>
                                </thead>
                                <tbody className="divide-y text-sm">
                                    {graduatedStudents.length === 0 ? <tr><td colSpan="5" className="p-8 text-center text-slate-400 italic">Belum ada data siswa keluar.</td></tr> : graduatedStudents.map(s => (
                                        <tr key={s.id}>
                                            <td className="p-4 font-mono text-xs">{s.nis}</td>
                                            <td className="p-4 font-bold">{s.name}</td>
                                            <td className="p-4">{s.class}</td>
                                            <td className="p-4 text-xs">{s.reason}</td>
                                            <td className="p-4 text-xs">{s.date}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* RIWAYAT PANTAUAN SECTION */}
                    {activeTab === 'Riwayat Pantauan' && (
                        <div className="bg-white rounded-2xl border shadow-sm">
                            <div className="p-4 border-b flex justify-between bg-slate-50/50">
                                <h3 className="font-bold text-sm">Log Pantauan Siswa</h3>
                                <button onClick={() => {setModalType('monitoring'); setIsModalOpen(true)}} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold">+ Tambah Pantauan</button>
                            </div>
                            <div className="p-4 space-y-4">
                                {monitoringHistory.length === 0 ? <p className="text-center text-slate-400 text-sm py-10 italic">Belum ada riwayat pantauan.</p> : monitoringHistory.map(m => (
                                    <div key={m.id} className="p-4 border rounded-2xl bg-slate-50 flex gap-4">
                                        <div className="bg-blue-600 text-white p-3 rounded-xl h-fit"><i data-lucide="eye" className="w-5 h-5"></i></div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-sm">{students.find(s=>s.id == m.sId)?.name || 'Siswa'}</h4>
                                                <span className="text-[10px] font-bold text-slate-400">{m.date}</span>
                                            </div>
                                            <p className="text-xs text-slate-600 leading-relaxed">{m.note}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SURAT & DOKUMEN SECTION */}
                    {activeTab === 'Surat & Dokumen' && (
                        <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-120px)]">
                            <div className="w-full lg:w-1/3 flex flex-col gap-6 no-print overflow-y-auto custom-scroll pr-2 pb-10">
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative">
                                    <h3 className="font-black mb-6 text-sm flex items-center gap-3">
                                        <div className="bg-slate-900 text-white p-2 rounded-xl"><i data-lucide="edit-3" className="w-4 h-4"></i></div>
                                        Form Pemilihan Surat
                                    </h3>
                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Jenis Surat</label>
                                            <select className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white transition-colors" value={letter.type} onChange={e => setLetter({...letter, type: e.target.value})}>
                                                {['Panggilan Orang Tua', 'Laporan Kunjungan Rumah', 'Surat Pernyataan Siswa', 'Surat Pengunduran Diri'].map(t => (
                                                    <option key={t} value={t}>{t}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Siswa Terkait</label>
                                            <select className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white transition-colors" value={letter.sId} onChange={e => setLetter({...letter, sId: e.target.value})}>
                                                <option value="">-- Pilih Siswa --</option>
                                                {students.map(s => <option key={s.id} value={s.id}>{s.name} (Kelas {s.class})</option>)}
                                            </select>
                                        </div>
                                        
                                        {letter.type !== 'Surat Pengunduran Diri' && (
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nomor Surat</label>
                                                <input type="text" placeholder="045/BK/2026" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white transition-colors" value={letter.no} onChange={e => setLetter({...letter, no: e.target.value})} />
                                            </div>
                                        )}
                                        
                                        {letter.type === 'Panggilan Orang Tua' && (
                                            <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Waktu Pertemuan</label>
                                                    <input type="datetime-local" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white transition-colors" onChange={e => setLetter({...letter, time: e.target.value})} />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Keperluan / Masalah</label>
                                                    <textarea placeholder="Contoh: Membicarakan absensi siswa yang kurang..." className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white transition-colors custom-scroll" rows="3" onChange={e => setLetter({...letter, info: e.target.value})}></textarea>
                                                </div>
                                            </div>
                                        )}

                                        {letter.type === 'Laporan Kunjungan Rumah' && (
                                            <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nama Orang Tua</label>
                                                    <input type="text" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white transition-colors" placeholder="Nama lengkap orang tua..." value={letter.parentName} onChange={e => setLetter({...letter, parentName: e.target.value})} />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Alamat Kunjungan</label>
                                                    <textarea className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white transition-colors custom-scroll" rows="2" placeholder="Alamat lengkap..." value={letter.address} onChange={e => setLetter({...letter, address: e.target.value})}></textarea>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Petugas 2 (Rekan)</label>
                                                    <input type="text" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white transition-colors" placeholder="Nama Petugas 2..." value={letter.petugas2} onChange={e => setLetter({...letter, petugas2: e.target.value})} />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Hasil Kunjungan</label>
                                                    <textarea className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white transition-colors custom-scroll" rows="4" placeholder="Uraikan hasil kesepakatan secara rinci..." onChange={e => setLetter({...letter, info: e.target.value})}></textarea>
                                                </div>
                                            </div>
                                        )}

                                        {letter.type === 'Surat Pernyataan Siswa' && (
                                            <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nama Orang Tua/Wali</label>
                                                    <input type="text" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white transition-colors" placeholder="Nama orang tua..." value={letter.parentName} onChange={e => setLetter({...letter, parentName: e.target.value})} />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Alamat Rumah</label>
                                                    <textarea className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white transition-colors custom-scroll" rows="2" placeholder="Alamat rumah..." value={letter.address} onChange={e => setLetter({...letter, address: e.target.value})}></textarea>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Pernyataan Kesalahan</label>
                                                    <textarea className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white transition-colors custom-scroll" rows="4" placeholder="Tuliskan dengan jelas kesalahan yang diakui siswa..." onChange={e => setLetter({...letter, statement: e.target.value})}></textarea>
                                                </div>
                                            </div>
                                        )}

                                        {letter.type === 'Surat Pengunduran Diri' && (
                                            <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nama Orang Tua</label>
                                                    <input type="text" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white transition-colors" placeholder="Nama orang tua..." value={letter.parentName} onChange={e => setLetter({...letter, parentName: e.target.value})} />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Pekerjaan</label>
                                                    <input type="text" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white transition-colors" placeholder="Pekerjaan..." value={letter.parentJob} onChange={e => setLetter({...letter, parentJob: e.target.value})} />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Alamat</label>
                                                    <textarea className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white transition-colors custom-scroll" rows="2" placeholder="Alamat lengkap..." value={letter.address} onChange={e => setLetter({...letter, address: e.target.value})}></textarea>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Alasan Pengunduran Diri</label>
                                                    <textarea className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white transition-colors custom-scroll" rows="4" placeholder="Dikarenakan pindah domisili..." onChange={e => setLetter({...letter, reason: e.target.value})}></textarea>
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="pt-4 border-t border-slate-100">
                                            <button onClick={() => window.print()} className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-1 transition-all">
                                                <i data-lucide="printer" className="w-5 h-5"></i> Cetak Dokumen A4
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* DOKUMEN PREVIEW/PRINT */}
                            <div className="w-full lg:w-2/3 h-full overflow-y-auto custom-scroll flex justify-center pb-10 print-wrapper">
                                <div className="bg-white border shadow-2xl print-only text-sm min-h-[297mm] w-[210mm] origin-top scale-[0.6] sm:scale-[0.8] lg:scale-100 transition-transform duration-500 p-[20mm]" id="printable" style={{boxSizing: 'border-box'}}>
                                    
                                    {/* KOP SURAT UMUM */}
                                    {letter.type !== 'Surat Pengunduran Diri' && (
                                        <div className="flex items-center gap-4 border-b-4 border-double border-black pb-2 mb-6">
                                            <img src={logoUrl} className="w-24 h-24 object-contain" />
                                            <div className="text-center flex-1">
                                                <h4 className="text-[14px] font-bold uppercase leading-tight">Yayasan Pelita Ilmu Sanggabuana</h4>
                                                <h2 className="text-[22px] font-black uppercase tracking-tight leading-tight">SMK IPTEK SANGGABUANA</h2>
                                                <p className="text-[12px] font-bold uppercase leading-tight">Kelompok Teknologi dan Bisnis</p>
                                                <p className="text-[14px] font-bold uppercase leading-tight border-y border-black inline-block px-4 my-1">Terakreditasi B</p>
                                                <p className="text-[10px] font-bold">NSS : 402022108001 NPSN : 20265214</p>
                                                <p className="text-[9px] italic">Jl. Raya Pangkalan - Loji, Ds. Cintaasih Kec. Pangkalan Kab. Karawang 41362</p>
                                                <p className="text-[9px]">website : www.smkipteksanggabuana.sch.id email : smkipteksanggabuanapangkalan@gmail.com Telp : 0267642500</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* KONTEN SURAT BERDASARKAN TYPE */}
                                    <div className="text-[12px] leading-relaxed font-serif text-black h-full flex flex-col">
                                        {letter.type === 'Panggilan Orang Tua' && (
                                            <div className="space-y-4 flex-1">
                                                <div className="flex justify-between items-start">
                                                    <table className="w-1/2">
                                                        <tbody>
                                                            <tr><td className="w-20">Nomor</td><td>: {letter.no}</td></tr>
                                                            <tr><td>Sifat</td><td>: <strong>Penting</strong></td></tr>
                                                            <tr><td>Lampiran</td><td>: -</td></tr>
                                                            <tr><td>Perihal</td><td>: <strong>Undangan Orang Tua/ Wali</strong></td></tr>
                                                        </tbody>
                                                    </table>
                                                    <div className="text-left w-1/3">
                                                        <p>Kepada,</p>
                                                        <p>Yth. Orang Tua/ Wali Peserta Didik</p>
                                                        <p className="border-b border-black w-full min-h-[1em] mb-1"><strong>{students.find(s=>s.id == letter.sId)?.name || '................................'}</strong></p>
                                                        <p>di,-</p>
                                                        <p className="ml-8 font-bold">Tempat</p>
                                                    </div>
                                                </div>

                                                <div className="mt-8 space-y-4 text-justify">
                                                    <p>Dengan Hormat,</p>
                                                    <p>Sehubungan dengan permasalahan putra/putri Bapak/Ibu/Saudara yang perlu diselesaikan bersama mengenai <strong>{letter.info || '................................................................'}</strong>, dengan ini kami mengharapkan kehadiran Saudara/saudari pada:</p>
                                                    <div className="pl-12 py-2">
                                                        <table className="w-full">
                                                            <tbody>
                                                                <tr><td className="w-40 py-1">Hari dan Tanggal</td><td>: {letter.time ? new Date(letter.time).toLocaleDateString('id-ID', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'}) : '................................'}</td></tr>
                                                                <tr><td className="py-1">Waktu</td><td>: {letter.time ? new Date(letter.time).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'}) : '................................'} WIB</td></tr>
                                                                <tr><td className="py-1">Tempat</td><td>: Ruang BK / Guru SMK IPTEK SANGGABUANA</td></tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    <p>Mengingat pentingnya hal tersebut, kami mengharapkan kehadiran Bapak/Ibu/Saudara tepat pada waktunya.</p>
                                                    <p>Demikian surat panggilan ini kami sampaikan, atas perhatian dan kerjasama yang baik dari Bapak/Ibu/Saudara kami ucapkan terimakasih.</p>
                                                </div>

                                                <div className="grid grid-cols-2 pt-20 mt-auto">
                                                    <div className="text-center space-y-24">
                                                        <p>Mengetahui <br/> Kepala SMK IPTEK SANGGABUANA</p>
                                                        <p className="font-bold underline">OBAY SOBARI, S.Pd., M.Pd</p>
                                                    </div>
                                                    <div className="text-center space-y-24">
                                                        <p>Pangkalan, {letter.date ? new Date(letter.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'}) : '................................'} <br/> Guru BK</p>
                                                        <div className="inline-block">
                                                            <p className="font-bold underline">{letter.staffName}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {letter.type === 'Laporan Kunjungan Rumah' && (
                                            <div className="space-y-4 flex-1">
                                                <h3 className="text-center font-bold text-lg underline uppercase mb-8">LAPORAN KUNJUNGAN RUMAH</h3>
                                                <p>Yang bertanda tangan dibawah ini :</p>
                                                <div className="pl-10 space-y-1 my-3">
                                                    <div className="flex"><span className="w-40">Nama</span><span>: <strong>{letter.staffName}</strong></span></div>
                                                    <div className="flex"><span className="w-40">NIP</span><span>: {letter.staffNip || '-'}</span></div>
                                                    <div className="flex"><span className="w-40">Jabatan</span><span>: {letter.staffPosition}</span></div>
                                                </div>
                                                <p>Telah Melaksanakan tugas kunjungan rumah bersama :</p>
                                                <div className="pl-10 space-y-1 my-3">
                                                    <div className="flex"><span className="w-40">Nama Petugas 2</span><span>: <strong>{letter.petugas2 || '................................................................'}</strong></span></div>
                                                </div>
                                                <p>Pada hari <strong>{letter.date ? new Date(letter.date).toLocaleDateString('id-ID', {weekday: 'long'}) : '........'}</strong> tanggal <strong>{letter.date ? new Date(letter.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'}) : '................'}</strong> untuk mengunjungi rumah :</p>
                                                <div className="pl-10 space-y-2 my-3">
                                                    <div className="flex"><span className="w-40">Nama Siswa</span><span>: <strong>{students.find(s=>s.id == letter.sId)?.name || '................................'}</strong></span></div>
                                                    <div className="flex"><span className="w-40">Kelas</span><span>: {students.find(s=>s.id == letter.sId)?.class || '................................'}</span></div>
                                                    <div className="flex"><span className="w-40">NIS</span><span>: {students.find(s=>s.id == letter.sId)?.nis || '................................'}</span></div>
                                                    <div className="flex"><span className="w-40">Nama Orang Tua</span><span>: <strong>{letter.parentName || '................................................................'}</strong></span></div>
                                                    <div className="flex"><span className="w-40">Alamat Rumah</span><span className="flex-1">: {letter.address || '................................................................'}</span></div>
                                                </div>
                                                <div className="mt-6 flex-1">
                                                    <p className="font-bold mb-2">Dengan Hasil Kesepakatan / Pembinaan :</p>
                                                    <div className="border border-black p-4 min-h-[150px] whitespace-pre-wrap rounded-md">
                                                        {letter.info || '................................................................................................................\n................................................................................................................\n................................................................................................................'}
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 pt-16 mt-8">
                                                    <div className="text-center space-y-20">
                                                        <p>Petugas II</p>
                                                        <p className="font-bold underline">{letter.petugas2 !== '-' && letter.petugas2 ? letter.petugas2 : '( ................................ )'}</p>
                                                    </div>
                                                    <div className="text-center space-y-20">
                                                        <p>Pangkalan, {letter.date ? new Date(letter.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'}) : '................................'} <br/> Petugas I</p>
                                                        <p className="font-bold underline">{letter.staffName}</p>
                                                    </div>
                                                    <div className="col-span-2 text-center mt-12 space-y-20">
                                                        <p>Mengetahui / Menyetujui <br/> Orang Tua/ Wali Peserta Didik</p>
                                                        <p className="font-bold underline">{letter.parentName || '( ................................ )'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {letter.type === 'Surat Pernyataan Siswa' && (
                                            <div className="space-y-4 flex-1">
                                                <h3 className="text-center font-bold text-lg underline uppercase mb-8">SURAT PERNYATAAN SISWA</h3>
                                                <p>Yang bertanda tangan dibawah ini :</p>
                                                <div className="pl-10 space-y-2 my-4">
                                                    <div className="flex"><span className="w-40">Nama</span><span>: <strong>{students.find(s=>s.id == letter.sId)?.name || '................................'}</strong></span></div>
                                                    <div className="flex"><span className="w-40">Kelas</span><span>: {students.find(s=>s.id == letter.sId)?.class || '................................'}</span></div>
                                                    <div className="flex"><span className="w-40">Alamat</span><span className="flex-1">: {letter.address || '................................................................'}</span></div>
                                                </div>
                                                <p className="indent-10">Dengan sadar mengakui telah melanggar tata tertib sekolah, yaitu:</p>
                                                <div className="pl-10 my-2">
                                                    <div className="border border-black p-3 min-h-[80px] whitespace-pre-wrap italic bg-gray-50/50">
                                                        {letter.statement || '1. ................................................................\n2. ................................................................\n3. ................................................................'}
                                                    </div>
                                                </div>
                                                <p className="text-justify indent-10">Dengan ini saya berjanji akan bersungguh-sungguh dan tidak akan mengulangi melanggar tata tertib sekolah atau perbuatan yang merugikan diri sendiri, orang tua dan sekolah. Saya bersedia menerima hukuman pendidikan selama waktu yang sudah ditentukan:</p>
                                                <ol className="list-decimal pl-12 space-y-1 text-[11px] my-4 font-semibold">
                                                    <li>Seragam Lengkap dan Rambut Rapih;</li>
                                                    <li>Absensi Kehadiran tidak ada alpa ataupun bolos/izin/sakit (menyerahkan surat keterangan sakit dari Dokter atau PUSKESMAS);</li>
                                                    <li>Batas maksimal ketidakhadiran adalah 3 kali dalam 1 semester;</li>
                                                    <li>Lapor Kedatangan Ke Sekolah Pada Guru Piket Jam 07.00 dan Ketika Pulang Jam 12.00;</li>
                                                    <li>Tidak Ada di Warung Setelah Pulang Sekolah;</li>
                                                    <li>Tidak Memegang HP saat jam pelajaran berlangsung;</li>
                                                    <li>Bersedia mengikuti Kegiatan Pembinaan dari Kodim/ Polsek;</li>
                                                    <li>Bertanggung jawab mematuhi seluruh peraturan sekolah yang berlaku;</li>
                                                </ol>
                                                <p className="text-justify">Jika saya mengulangi perbuatan tersebut diatas, maka saya siap dikenakan sanksi sebagai berikut: <strong>DIKELUARKAN ATAU DIPINDAHKAN DARI SMK IPTEK SANGGABUANA.</strong></p>
                                                <p className="text-justify">Demikian surat perjanjian ini saya buat dan tidak ada paksaan dari pihak manapun dan dibuat dalam keadaan sadar serta di tanda tangani di hadapan orang tua dan pihak sekolah.</p>
                                                
                                                <div className="flex justify-end pt-6">
                                                    <div className="text-center w-64">
                                                        <p>Pangkalan, {letter.date ? new Date(letter.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'}) : '................................'}</p>
                                                        <p>Yang membuat pernyataan</p>
                                                        <div className="border-2 border-slate-300 border-dashed w-20 h-10 mx-auto my-4 flex items-center justify-center text-[8px] text-slate-400 bg-slate-50">Materai<br/>10000</div>
                                                        <p className="font-bold underline">{students.find(s=>s.id == letter.sId)?.name || '( ........................................ )'}</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 pt-6">
                                                    <div className="space-y-2">
                                                        <p>Penanggung Jawab Keluarga :</p>
                                                        <ol className="list-decimal pl-5 space-y-1">
                                                            <li>Pihak Orang tua <span className="font-bold">{letter.parentName || '...........................'}</span></li>
                                                            <li>................................................................</li>
                                                        </ol>
                                                    </div>
                                                    <div className="text-center space-y-20">
                                                        <p>Guru BK</p>
                                                        <p className="font-bold underline">{letter.staffName}</p>
                                                    </div>
                                                </div>

                                                <div className="text-center space-y-20 mt-8">
                                                    <p>Mengetahui, <br/> Kepala SMK IPTEK SANGGABUANA</p>
                                                    <p className="font-bold underline">OBAY SOBARI, S.Pd., M.Pd</p>
                                                </div>
                                            </div>
                                        )}

                                        {letter.type === 'Surat Pengunduran Diri' && (
                                            <div className="space-y-4 px-8 pt-12 flex-1">
                                                <h3 className="text-center font-black text-xl uppercase mb-12 underline tracking-wider">SURAT PENGUNDURAN DIRI</h3>
                                                <div className="flex justify-end mb-8">
                                                    <div className="w-1/2">
                                                        <p>Pangkalan, {letter.date ? new Date(letter.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'}) : '................................'}</p>
                                                    </div>
                                                </div>
                                                <p>Kepada Yth :</p>
                                                <div className="pl-6 space-y-1 font-bold">
                                                    <p>Kepala SMK IPTEK SANGGABUANA</p>
                                                    <p>Jln. Raya Pangkalan Loji Desa Cintaasih</p>
                                                    <p>Kec. Pangkalan Kab. Karawang</p>
                                                    <p>Di</p>
                                                    <p className="pl-10">Tempat</p>
                                                </div>
                                                <p className="mt-8">Dengan Hormat,</p>
                                                <p>Yang bertanda tangan di bawah ini, saya Orang Tua/Wali Murid :</p>
                                                <div className="pl-10 space-y-2 my-4">
                                                    <div className="flex"><span className="w-40">Nama</span><span>: <strong>{letter.parentName || '................................................................'}</strong></span></div>
                                                    <div className="flex"><span className="w-40">Pekerjaan</span><span>: {letter.parentJob || '................................................................'}</span></div>
                                                    <div className="flex"><span className="w-40">Alamat</span><span className="flex-1">: {letter.address || '................................................................'}</span></div>
                                                    <div className="flex mt-6"><span className="w-40">Nama Siswa</span><span>: <strong>{students.find(s=>s.id == letter.sId)?.name || '................................'}</strong></span></div>
                                                    <div className="flex"><span className="w-40">Kelas</span><span>: {students.find(s=>s.id == letter.sId)?.class || '................................'}</span></div>
                                                    <div className="flex"><span className="w-40">Nomor Induk / NIS</span><span>: {students.find(s=>s.id == letter.sId)?.nis || '................................'}</span></div>
                                                </div>
                                                <p className="mt-6 text-justify">Mengajukan permohonan pengunduran diri anak saya tersebut di atas dari status sebagai siswa/i SMK IPTEK SANGGABUANA dikarenakan :</p>
                                                <div className="pl-10 my-4">
                                                    <div className="border-b border-black w-full min-h-[30px] font-bold text-lg flex items-end pb-1 uppercase italic">
                                                        {letter.reason || '................................................................................................................'}
                                                    </div>
                                                </div>
                                                <p className="mt-6 text-justify indent-10">Demikian surat pernyataan ini kami buat dengan sebenar-benarnya dalam keadaan sadar tanpa ada paksaan dari pihak manapun, agar dapat dipergunakan sebagaimana mestinya.</p>
                                                <p className="text-justify indent-10">Atas perhatian dan kerja sama yang baik dari pihak sekolah, kami mengucapkan banyak terima kasih.</p>
                                                
                                                <div className="grid grid-cols-2 pt-24">
                                                    <div className="text-center space-y-28">
                                                        <p>Mengetahui,<br/> Kepala SMK IPTEK SANGGABUANA</p>
                                                        <p className="font-bold underline">OBAY SOBARI, S.Pd., M.Pd</p>
                                                    </div>
                                                    <div className="text-center space-y-2">
                                                        <p>Hormat Saya,<br/> Orang Tua/Wali Murid</p>
                                                        <div className="h-20 flex items-center justify-center">
                                                            <div className="border-2 border-slate-300 border-dashed w-20 h-10 flex items-center justify-center text-[8px] text-slate-400 bg-slate-50 rotate-[-10deg]">Materai<br/>10000</div>
                                                        </div>
                                                        <p className="font-bold underline inline-block min-w-[200px]">{letter.parentName || '( ........................................ )'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* MODULE LAIN (TIDAK BERUBAH) */}
                    {activeTab === 'Pelanggaran' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center"><h3 className="font-bold">Buku Kasus</h3><button onClick={()=>{setModalType('violation'); setIsModalOpen(true)}} className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold">+ Input Kasus</button></div>
                            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b"><tr><th className="p-4">Tgl</th><th className="p-4">Siswa</th><th className="p-4">Jenis</th><th className="p-4">Poin</th><th className="p-4">Aksi</th></tr></thead>
                                    <tbody className="divide-y text-sm">
                                        {violations.length === 0 ? <tr><td colSpan="5" className="p-8 text-center text-slate-400 italic">Belum ada riwayat kasus.</td></tr> : violations.map(v => (
                                            <tr key={v.id}><td className="p-4 text-xs">{v.date}</td><td className="p-4 font-bold">{students.find(s=>s.id==v.sId)?.name}</td><td className="p-4 uppercase">{v.type}</td><td className="p-4 font-black text-red-600">+{v.pts}</td>
                                                <td className="p-4">
                                                    <button onClick={() => handleEditViolation(v)} className="text-amber-500 hover:bg-amber-100 p-1 rounded" title="Edit Data"><i data-lucide="edit" className="w-4 h-4"></i></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                     {activeTab === 'Prestasi' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center"><h3 className="font-bold">Daftar Prestasi</h3><button onClick={()=>{setModalType('prestasi'); setIsModalOpen(true)}} className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold">+ Tambah</button></div>
                            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b"><tr><th className="p-4">Siswa</th><th className="p-4">Kelas</th><th className="p-4">Waktu</th><th className="p-4">Peringkat</th><th className="p-4">Lomba</th></tr></thead>
                                    <tbody className="divide-y text-sm">
                                        {prestasi.map(p => (
                                            <tr key={p.id}><td className="p-4 font-bold">{students.find(s=>s.id==p.sId)?.name}</td><td className="p-4">{p.className}</td><td className="p-4 text-xs">{p.date}</td><td className="p-4">{p.rank}</td><td className="p-4">{p.event}</td></tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Home Visit' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center"><h3 className="font-bold">Riwayat Home Visit</h3><button onClick={()=>{setModalType('homevisit'); setIsModalOpen(true)}} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold">+ Tambah</button></div>
                            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b"><tr><th className="p-4">Tgl</th><th className="p-4">Siswa</th><th className="p-4">Hasil</th></tr></thead>
                                    <tbody className="divide-y text-sm">
                                        {homeVisits.map(h => (
                                            <tr key={h.id}><td className="p-4 text-xs">{h.date}</td><td className="p-4 font-bold">{students.find(s=>s.id==h.sId)?.name}</td><td className="p-4 italic text-xs">{h.result}</td></tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                </div>
            </main>

            {/* MODAL FORM (TIDAK BERUBAH) */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
                            <h3 className="font-black text-xs uppercase text-slate-400">Form {modalType}</h3>
                            <button onClick={() => {setIsModalOpen(false); setSearchInForm('');}} className="p-2 hover:bg-slate-200 rounded-full"><i data-lucide="x" className="w-5 h-5"></i></button>
                        </div>
                        <div className="p-8">
                            {modalType === 'student' && (
                                <form onSubmit={handleAddStudent} className="space-y-4">
                                    <input name="nis" placeholder="NIS" className="w-full border-2 p-3 rounded-2xl text-sm" required />
                                    <input name="name" placeholder="Nama Lengkap" className="w-full border-2 p-3 rounded-2xl text-sm" required />
                                    <input name="class" placeholder="Kelas" className="w-full border-2 p-3 rounded-2xl text-sm" required />
                                    <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-xl">Simpan Siswa</button>
                                </form>
                            )}
                            {modalType === 'student_edit' && (
                                <form onSubmit={handleUpdateStudent} className="space-y-4">
                                    <input name="nis" placeholder="NIS" defaultValue={editStudent?.nis} className="w-full border-2 p-3 rounded-2xl text-sm" required />
                                    <input name="name" placeholder="Nama Lengkap" defaultValue={editStudent?.name} className="w-full border-2 p-3 rounded-2xl text-sm" required />
                                    <input name="class" placeholder="Kelas" defaultValue={editStudent?.class} className="w-full border-2 p-3 rounded-2xl text-sm" required />
                                    <button className="w-full bg-amber-600 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-xl">Update Data</button>
                                </form>
                            )}
                            {modalType === 'graduated' && (
                                <form onSubmit={handleAddGraduatedStudent} className="space-y-4">
                                    <input name="nis" placeholder="NIS" className="w-full border-2 p-3 rounded-2xl text-sm" required />
                                    <input name="name" placeholder="Nama Siswa" className="w-full border-2 p-3 rounded-2xl text-sm" required />
                                    <input name="class" placeholder="Kelas Terakhir" className="w-full border-2 p-3 rounded-2xl text-sm" required />
                                    <input name="reason" placeholder="Alasan Keluar (Lulus/Pindah/Dikeluarkan)" className="w-full border-2 p-3 rounded-2xl text-sm" required />
                                    <input name="date" type="date" className="w-full border-2 p-3 rounded-2xl text-sm" required />
                                    <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-xl">Simpan Data</button>
                                </form>
                            )}
                            {modalType === 'monitoring' && (
                                <form onSubmit={handleAddMonitoring} className="space-y-4">
                                    <select name="sId" className="w-full border-2 p-3 rounded-2xl text-sm" required>
                                        <option value="">-- Pilih Siswa --</option>
                                        {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    <input name="date" type="date" className="w-full border-2 p-3 rounded-2xl text-sm" required />
                                    <textarea name="note" placeholder="Hasil pantauan hari ini..." className="w-full border-2 p-3 rounded-2xl text-sm" rows="4" required></textarea>
                                    <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-xl">Simpan Pantauan</button>
                                </form>
                            )}
                            {modalType === 'violation' && (
                                <form onSubmit={handleAddViolation} className="space-y-4">
                                    <input type="text" placeholder="Cari nama siswa..." className="w-full border p-2 rounded-lg text-xs" onChange={e => setSearchInForm(e.target.value)} />
                                    <select name="sId" className="w-full border-2 p-3 rounded-2xl text-sm" required>
                                        {students.filter(s => s.name.toLowerCase().includes(searchInForm.toLowerCase())).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    <input name="type" placeholder="Jenis Pelanggaran" className="w-full border-2 p-3 rounded-2xl text-sm" required />
                                    <input name="pts" type="number" placeholder="Poin" className="w-full border-2 p-3 rounded-2xl text-sm" required />
                                    <input name="date" type="date" className="w-full border-2 p-3 rounded-2xl text-sm" required />
                                    <textarea name="note" placeholder="Catatan Tambahan" className="w-full border-2 p-3 rounded-2xl text-sm"></textarea>
                                    <button className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-xl">Input Kasus</button>
                                </form>
                            )}
                            {modalType === 'violation_edit' && (
                                <form onSubmit={handleUpdateViolation} className="space-y-4">
                                    <select name="sId" className="w-full border-2 p-3 rounded-2xl text-sm" defaultValue={editViolation?.sId} required>
                                        {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    <input name="type" placeholder="Jenis Pelanggaran" defaultValue={editViolation?.type} className="w-full border-2 p-3 rounded-2xl text-sm" required />
                                    <input name="pts" type="number" placeholder="Poin" defaultValue={editViolation?.pts} className="w-full border-2 p-3 rounded-2xl text-sm" required />
                                    <input name="date" type="date" defaultValue={editViolation?.date} className="w-full border-2 p-3 rounded-2xl text-sm" required />
                                    <textarea name="note" placeholder="Catatan Tambahan" defaultValue={editViolation?.note} className="w-full border-2 p-3 rounded-2xl text-sm"></textarea>
                                    <button className="w-full bg-amber-600 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-xl">Update Kasus</button>
                                </form>
                            )}
                            {modalType === 'prestasi' && (
                                <form onSubmit={handleAddPrestasi} className="space-y-4">
                                    <select name="sId" className="w-full border-2 p-3 rounded-2xl text-sm" required>
                                        {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    <input name="className" placeholder="Nama Kelas" className="w-full border-2 p-3 rounded-2xl text-sm" required />
                                    <input name="date" type="datetime-local" className="w-full border-2 p-3 rounded-2xl text-sm" required />
                                    <input name="rank" placeholder="Juara Ke (1, 2, 3...)" className="w-full border-2 p-3 rounded-2xl text-sm" required />
                                    <input name="event" placeholder="Nama Lomba" className="w-full border-2 p-3 rounded-2xl text-sm" required />
                                    <button className="w-full bg-green-600 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-xl">Simpan Prestasi</button>
                                </form>
                            )}
                            {modalType === 'homevisit' && (
                                <form onSubmit={handleAddHomeVisit} className="space-y-4">
                                    <select name="sId" className="w-full border-2 p-3 rounded-2xl text-sm" required>
                                        {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    <input name="wali" placeholder="Nama Orang Tua/Wali" className="w-full border-2 p-3 rounded-2xl text-sm" required />
                                    <input name="date" type="date" className="w-full border-2 p-3 rounded-2xl text-sm" required />
                                    <textarea name="result" placeholder="Hasil Kesepakatan" className="w-full border-2 p-3 rounded-2xl text-sm" rows="4"></textarea>
                                    <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-xl">Simpan Laporan</button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);