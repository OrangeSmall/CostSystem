import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar, 
  DollarSign, 
  Plus, 
  Tag, 
  BarChart3, 
  List, 
  LayoutDashboard, 
  TrendingUp, 
  X,
  CheckCircle2,
  Trash2,
  Download,
  AlertCircle,
  Edit2,
  Pencil,
  Monitor,
  Smartphone,
  ArrowDownRight,
  ArrowUpRight,
  Settings,
  CloudLightning
} from 'lucide-react';

// 輔助函數：取得該日期的「自訂週區間」 (週三至下週二)
const getCustomWeekRange = (dateString) => {
  const date = new Date(dateString);
  const day = date.getDay(); 
  const diffToWed = day >= 3 ? day - 3 : day + 4;
  
  const startOfWeek = new Date(date.getTime());
  startOfWeek.setDate(date.getDate() - diffToWed);
  
  const endOfWeek = new Date(startOfWeek.getTime());
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const formatDate = (d) => `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  return `${formatDate(startOfWeek)} ~ ${formatDate(endOfWeek)}`;
};

// 輔助函數：取得該日期的月份
const getMonthString = (dateString) => {
  const date = new Date(dateString);
  return `${date.getFullYear()}年 ${String(date.getMonth() + 1).padStart(2, '0')}月`;
};

// 輔助函數：格式化金額
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 }).format(amount);
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); 
  
  // 狀態管理：加入 localStorage 永久記憶
  const [categories, setCategories] = useState(() => {
    const savedCats = localStorage.getItem('purchaseCategories');
    return savedCats ? JSON.parse(savedCats) : ['未分類廠商'];
  });

  const [entries, setEntries] = useState(() => {
    const savedEntries = localStorage.getItem('purchaseEntries');
    return savedEntries ? JSON.parse(savedEntries) : [];
  });
  
  const [revenues, setRevenues] = useState(() => {
    const savedRevs = localStorage.getItem('purchaseRevenues');
    return savedRevs ? JSON.parse(savedRevs) : [];
  });

  // 表單狀態
  const [entryType, setEntryType] = useState('cost'); 
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState(categories[0] || '');
  const [amount, setAmount] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // 編輯與設定狀態
  const [editingEntry, setEditingEntry] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  
  // 預設綁定您的 Google 試算表網址，同事的裝置一開啟就會自動帶入！
  const DEFAULT_WEBHOOK = 'https://script.google.com/macros/s/AKfycbzL5ZKrzuWhUgATAdRWNH5oyfzxQAJ-7CXXIWUbspSqn8EUh7WdLdEF8hkkoTP9iyI/exec';
  const [webhookUrl, setWebhookUrl] = useState(() => localStorage.getItem('sheetWebhookUrl') || DEFAULT_WEBHOOK);
  const [tempWebhookUrl, setTempWebhookUrl] = useState(webhookUrl);
  
  // 同步狀態
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [syncToast, setSyncToast] = useState({ show: false, message: '', type: 'success' });

  // 預算狀態
  const [weeklyBudget, setWeeklyBudget] = useState(() => {
    const savedBudget = localStorage.getItem('weeklyBudget');
    return savedBudget ? Number(savedBudget) : 20000;
  });
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState(weeklyBudget);

  // 報表檢視狀態
  const [reportType, setReportType] = useState('weekly'); 
  const [reportViewMode, setReportViewMode] = useState('desktop'); 

  // 網頁一載入時，自動從雲端下載最新資料與廠商 (實現團隊跨裝置同步)
  useEffect(() => {
    if (webhookUrl) {
      handleDownloadFromCloud();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 當資料改變時，自動儲存到瀏覽器 localStorage
  useEffect(() => {
    localStorage.setItem('purchaseCategories', JSON.stringify(categories));
    if (!categories.includes(category) && categories.length > 0) {
      setCategory(categories[0]);
    }
  }, [categories, category]);

  useEffect(() => {
    localStorage.setItem('purchaseEntries', JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem('purchaseRevenues', JSON.stringify(revenues));
  }, [revenues]);

  // 處理新增分類
  const handleAddCategory = () => {
    const newCat = newCategoryName.trim();
    if (!newCat) return;

    if (categories.includes(newCat)) {
      alert('這個廠商或分類名稱已經存在囉！');
      return;
    }

    setCategories([...categories, newCat]);
    setCategory(newCat);
    setNewCategoryName('');
    setIsAddingCategory(false);
  };

  // 處理刪除分類
  const handleRemoveCategory = (catToRemove) => {
    if (categories.length <= 1) {
      alert('請至少保留一個廠商分類喔！(如果您想刪除預設，請先新增一個自己的廠商)');
      return;
    }
    const confirmDelete = window.confirm(`確定要刪除「${catToRemove}」嗎？\n(這不會影響過去已經登錄的歷史紀錄)`);
    if (confirmDelete) {
      setCategories(categories.filter(c => c !== catToRemove));
    }
  };

  // 儲存 Webhook 設定
  const handleSaveSettings = (e) => {
    e.preventDefault();
    setWebhookUrl(tempWebhookUrl);
    localStorage.setItem('sheetWebhookUrl', tempWebhookUrl);
    setShowSettings(false);
    // 設定完新網址後自動下載一次
    handleDownloadFromCloud();
  };

  // 從雲端下載資料的專屬功能
  const handleDownloadFromCloud = async () => {
    if (!webhookUrl) return;
    setIsDownloading(true);
    try {
      const response = await fetch(webhookUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      // 確保回傳正確再解析
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        const newEntries = [];
        const newRevenues = [];
        const catSet = new Set(categories); // 保留本機已經有的廠商

        data.forEach(row => {
          if (row.type === '進貨成本') {
            newEntries.push({ id: row.id || Date.now().toString() + Math.random(), date: row.date, category: row.category, amount: Number(row.amount), isSynced: true });
            catSet.add(row.category); // 自動從雲端紀錄中萃取出廠商清單
          } else if (row.type === '營業收入') {
            newRevenues.push({ id: row.id || Date.now().toString() + Math.random(), date: row.date, category: '每日營收', amount: Number(row.amount), isSynced: true });
          }
        });

        // 重新排序並寫入畫面
        setEntries(newEntries.sort((a,b) => new Date(b.date) - new Date(a.date)));
        setRevenues(newRevenues.sort((a,b) => new Date(b.date) - new Date(a.date)));
        setCategories(Array.from(catSet));
        
        setSyncToast({ show: true, message: '成功載入雲端最新資料！', type: 'success' });
        setTimeout(() => setSyncToast({ show: false, message: '', type: 'success' }), 2000);
      }
    } catch (error) {
      console.error('Download Error:', error);
      // 新增友善的錯誤提示，避免因 CORS 或權限被擋而靜默報錯
      setSyncToast({ 
        show: true, 
        message: '載入失敗：請確認 Google 腳本部署權限已設為「所有人」。', 
        type: 'error' 
      });
      setTimeout(() => setSyncToast({ show: false, message: '', type: 'success' }), 5000);
    } finally {
      setIsDownloading(false);
    }
  };

  // 處理表單送出
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!date || !amount || isNaN(amount)) return;
    if (entryType === 'cost' && !category) return;

    const newRecord = {
      id: Date.now().toString(),
      date,
      amount: parseFloat(amount),
      isSynced: false
    };

    if (entryType === 'cost') {
      newRecord.category = category;
      setEntries([newRecord, ...entries].sort((a, b) => new Date(b.date) - new Date(a.date)));
    } else {
      setRevenues([newRecord, ...revenues].sort((a, b) => new Date(b.date) - new Date(a.date)));
    }
    
    setAmount('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  // 手動同步功能 (改為全量覆蓋模式，確保多設備的刪除與修改完美同步)
  const handleManualSync = async () => {
    if (!webhookUrl) {
      setSyncToast({ show: true, message: '請先於右上角 ⚙️ 設定 Google Webhook 網址！', type: 'error' });
      setTimeout(() => setSyncToast({ show: false, message: '', type: 'success' }), 3000);
      setShowSettings(true);
      return;
    }

    setIsSyncing(true);

    try {
      // 將畫面上所有最新的資料打包，傳送給 Google Sheets 進行全量覆蓋
      const payload = {
        action: 'overwrite',
        data: [
          ...entries.map(e => ({ id: e.id, date: e.date, type: '進貨成本', category: e.category, amount: e.amount })),
          ...revenues.map(r => ({ id: r.id, date: r.date, type: '營業收入', category: '每日營收', amount: r.amount }))
        ]
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        // 使用 text/plain 繞過瀏覽器的複雜跨域阻擋機制
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 將所有資料標記為已同步
      setEntries(entries.map(e => ({ ...e, isSynced: true })));
      setRevenues(revenues.map(r => ({ ...r, isSynced: true })));
      
      setSyncToast({ show: true, message: `雲端資料庫已同步至最新狀態！`, type: 'success' });
      setTimeout(() => setSyncToast({ show: false, message: '', type: 'success' }), 3000);
    } catch (error) {
      console.error('Sync Error:', error);
      setSyncToast({ show: true, message: '上傳失敗：請確認網路連線與 Google 腳本權限。', type: 'error' });
      setTimeout(() => setSyncToast({ show: false, message: '', type: 'success' }), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  // 刪除紀錄
  const handleDelete = (id, type) => {
    if (type === 'cost') {
      setEntries(entries.filter(entry => entry.id !== id).map(e => ({...e, isSynced: false})));
    } else {
      setRevenues(revenues.filter(rev => rev.id !== id).map(r => ({...r, isSynced: false})));
    }
  };

  // 儲存編輯紀錄
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingEntry.date || !editingEntry.amount || isNaN(editingEntry.amount)) return;
    if (editingEntry.recordType === 'cost' && !editingEntry.category) return;
    
    // 編輯後將狀態改回「未同步」，確保修改內容會被送到雲端
    if (editingEntry.recordType === 'cost') {
      setEntries(entries.map(entry => 
        entry.id === editingEntry.id ? { ...editingEntry, amount: parseFloat(editingEntry.amount), isSynced: false } : entry
      ).sort((a, b) => new Date(b.date) - new Date(a.date)));
    } else {
      setRevenues(revenues.map(rev => 
        rev.id === editingEntry.id ? { ...editingEntry, amount: parseFloat(editingEntry.amount), isSynced: false } : rev
      ).sort((a, b) => new Date(b.date) - new Date(a.date)));
    }
    
    setEditingEntry(null);
  };

  // 儲存預算
  const handleSaveBudget = () => {
    const newBudget = Number(tempBudget);
    setWeeklyBudget(newBudget);
    localStorage.setItem('weeklyBudget', newBudget.toString());
    setIsEditingBudget(false);
  };

  // 匯出 CSV
  const exportToCSV = () => {
    const BOM = '\uFEFF';
    const headers = ['日期', '週區間(週三起)', '類型', '廠商/分類', '金額'];
    
    const combined = [
      ...entries.map(e => ({ ...e, type: '進貨成本' })),
      ...revenues.map(r => ({ ...r, type: '營業收入', category: '每日營收' }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    if (combined.length === 0) {
      alert("目前尚無任何紀錄可匯出！");
      return;
    }

    const csvRows = combined.map(e => 
      `${e.date},${getCustomWeekRange(e.date)},${e.type},${e.category},${e.amount}`
    );
    
    const csvContent = BOM + [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `進貨與營收紀錄_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const todayString = new Date().toISOString().split('T')[0];
  const currentWeekString = getCustomWeekRange(todayString);
  const currentWeekEntries = entries.filter(entry => getCustomWeekRange(entry.date) === currentWeekString);
  const currentWeekTotal = currentWeekEntries.reduce((sum, entry) => sum + entry.amount, 0);
  
  const remainingAmount = weeklyBudget - currentWeekTotal;
  const remainingRatio = weeklyBudget > 0 ? remainingAmount / weeklyBudget : 0;
  const isLowBudget = remainingRatio < 0.3;
  const isOverBudget = remainingAmount < 0;
  const spentPercentage = weeklyBudget > 0 ? Math.min((currentWeekTotal / weeklyBudget) * 100, 100) : 0;

  const combinedRecords = useMemo(() => {
    const costs = entries.map(e => ({ ...e, recordType: 'cost' }));
    const revs = revenues.map(r => ({ ...r, recordType: 'revenue', category: '每日營收' }));
    return [...costs, ...revs].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [entries, revenues]);

  const reportData = useMemo(() => {
    const data = {};
    entries.forEach(entry => {
      const key = reportType === 'weekly' ? getCustomWeekRange(entry.date) : getMonthString(entry.date);
      if (!data[key]) data[key] = { totalCost: 0, totalRevenue: 0, items: [] };
      data[key].totalCost += entry.amount;
      data[key].items.push({ ...entry, recordType: 'cost' });
    });
    revenues.forEach(rev => {
      const key = reportType === 'weekly' ? getCustomWeekRange(rev.date) : getMonthString(rev.date);
      if (!data[key]) data[key] = { totalCost: 0, totalRevenue: 0, items: [] };
      data[key].totalRevenue += rev.amount;
      data[key].items.push({ ...rev, recordType: 'revenue', category: '每日營收' });
    });
    return Object.entries(data)
      .map(([period, info]) => {
        info.items.sort((a, b) => new Date(b.date) - new Date(a.date));
        return { period, ...info };
      })
      .sort((a, b) => b.period.localeCompare(a.period));
  }, [entries, revenues, reportType]);

  const unsyncedCount = entries.filter(e => !e.isSynced).length + revenues.filter(r => !r.isSynced).length;

  return (
    <div className="min-h-screen bg-[#F5F0EA] text-[#4A3B32] font-sans pb-20 md:pb-0">
      
      {syncToast.show && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 transition-all duration-300 ${syncToast.type === 'success' ? 'bg-[#FFFDFB] border-l-4 border-emerald-500 text-[#4A3B32]' : 'bg-[#FFFDFB] border-l-4 border-red-500 text-[#4A3B32]'}`}>
          {syncToast.type === 'success' ? <CheckCircle2 size={20} className="text-emerald-500" /> : <AlertCircle size={20} className="text-red-500" />}
          <span className="font-bold text-sm">{syncToast.message}</span>
        </div>
      )}

      <header className="bg-[#FFFDFB] shadow-sm border-b border-[#E8DFD5] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#7A303F]">
            <LayoutDashboard size={24} className="text-[#7A303F]" />
            <h1 className="text-xl font-bold tracking-wide">進貨成本追蹤系統</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex gap-1 mr-2">
              <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Plus size={18}/>} label="首頁登錄" />
              <NavButton active={activeTab === 'records'} onClick={() => setActiveTab('records')} icon={<List size={18}/>} label="歷史紀錄" />
              <NavButton active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} icon={<BarChart3 size={18}/>} label="統計報表" />
            </div>
            
            <button 
              onClick={handleManualSync}
              disabled={isSyncing}
              className="flex items-center gap-1 p-2 md:px-3 text-[#8C7A6B] hover:text-[#7A303F] hover:bg-[#F5E6E8] rounded-xl transition-colors font-bold text-sm relative disabled:opacity-50"
              title="手動同步至 Google 試算表"
            >
              <CloudLightning size={20} className={isSyncing ? 'animate-pulse text-[#A87C63]' : ''} />
              <span className="hidden md:inline">{isSyncing ? '同步中' : '同步'}</span>
              {unsyncedCount > 0 && !isSyncing && (
                <span className="absolute top-1.5 right-1.5 md:right-0 md:-top-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[#FFFDFB]"></span>
              )}
            </button>

            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 text-[#8C7A6B] hover:text-[#7A303F] hover:bg-[#F5E6E8] rounded-full transition-colors relative ml-1"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 mt-4">
        
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            <div className="bg-[#FFFDFB] p-6 rounded-2xl shadow-sm border border-[#E8DFD5] relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2 text-[#4A3B32]">
                    <TrendingUp className="text-[#7A303F]" size={20} />
                    本週進貨預算控制
                  </h2>
                  <p className="text-xs text-[#8C7A6B] mt-1">結算週期：{currentWeekString} (每週三歸零)</p>
                </div>
                
                {!isEditingBudget ? (
                  <div className="text-right flex flex-col items-end">
                    <span className="text-sm text-[#8C7A6B] mb-1">本週設定預算</span>
                    <button 
                      onClick={() => setIsEditingBudget(true)}
                      className="flex items-center gap-1 text-lg font-bold text-[#4A3B32] hover:text-[#7A303F] transition-colors bg-[#F5F0EA] px-3 py-1 rounded-lg border border-[#E8DFD5]"
                    >
                      {formatCurrency(weeklyBudget)}
                      <Edit2 size={14} className="text-[#8C7A6B]" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 items-center bg-[#F5F0EA] p-2 rounded-lg border border-[#E8DFD5]">
                    <span className="text-sm text-[#8C7A6B]">預算:</span>
                    <input 
                      type="number" 
                      value={tempBudget}
                      onChange={(e) => setTempBudget(e.target.value)}
                      className="w-24 p-1 rounded border border-[#DBCFC3] outline-none focus:border-[#7A303F]"
                      autoFocus
                    />
                    <button onClick={handleSaveBudget} className="bg-[#7A303F] text-white px-3 py-1 rounded text-sm hover:bg-[#5E2430]">儲存</button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-[#8C7A6B]">
                    目前累計: {formatCurrency(currentWeekTotal)}
                  </span>
                  <span className={`font-bold ${isLowBudget ? 'text-red-600' : 'text-emerald-600'}`}>
                    進貨餘額 ({Math.round(remainingRatio * 100)}%): {formatCurrency(remainingAmount)}
                  </span>
                </div>
                <div className="h-4 w-full bg-[#E8DFD5] rounded-full overflow-hidden border border-[#DBCFC3]">
                  <div 
                    className={`h-full transition-all duration-500 rounded-full ${isLowBudget ? 'bg-red-500' : 'bg-emerald-500'}`}
                    style={{ width: `${spentPercentage}%` }}
                  ></div>
                </div>
                {isOverBudget && (
                  <p className="text-xs text-red-600 flex items-center gap-1 mt-1 font-bold">
                    <AlertCircle size={12} /> 警告：本週進貨已超過預算設定！
                  </p>
                )}
              </div>
            </div>

            <div className="bg-[#FFFDFB] rounded-2xl shadow-sm border border-[#E8DFD5] overflow-hidden">
              <div className="p-6 border-b border-[#E8DFD5] bg-[#F5F0EA]/50">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <Plus className="text-[#7A303F]" size={20} />
                      新增帳務紀錄
                    </h2>
                    <p className="text-sm text-[#8C7A6B] mt-1">請選擇登錄「進貨成本」或「每日營收」。</p>
                  </div>
                  
                  <div className="flex bg-[#E8DFD5]/60 p-1 rounded-xl w-fit">
                    <button
                      type="button"
                      onClick={() => setEntryType('cost')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        entryType === 'cost' ? 'bg-[#FFFDFB] text-[#7A303F] shadow-sm' : 'text-[#8C7A6B] hover:text-[#4A3B32]'
                      }`}
                    >
                      <ArrowDownRight size={16} /> 進貨支出
                    </button>
                    <button
                      type="button"
                      onClick={() => setEntryType('revenue')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        entryType === 'revenue' ? 'bg-[#FFFDFB] text-emerald-600 shadow-sm' : 'text-[#8C7A6B] hover:text-[#4A3B32]'
                      }`}
                    >
                      <ArrowUpRight size={16} /> 每日營收
                    </button>
                  </div>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {showSuccess && (
                  <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg flex items-center gap-2 text-sm font-medium animate-pulse border border-emerald-100">
                    <CheckCircle2 size={18} />
                    登錄成功！資料已安全保存在您的設備中。
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#4A3B32] flex items-center gap-1">
                      <Calendar size={16} className="text-[#8C7A6B]"/> {entryType === 'cost' ? '進貨日期' : '營收日期'}
                    </label>
                    <input 
                      type="date" 
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full p-3 rounded-xl border border-[#DBCFC3] bg-[#F5F0EA] focus:bg-[#FFFDFB] focus:ring-2 focus:ring-[#7A303F] outline-none transition-all"
                    />
                  </div>

                  {entryType === 'cost' && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[#4A3B32] flex items-center gap-1">
                        <Tag size={16} className="text-[#8C7A6B]"/> 廠商 / 分類
                      </label>
                      
                      {!isAddingCategory ? (
                        <div className="flex gap-2">
                          <select 
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="flex-1 p-3 rounded-xl border border-[#DBCFC3] bg-[#F5F0EA] focus:bg-[#FFFDFB] focus:ring-2 focus:ring-[#7A303F] outline-none transition-all appearance-none"
                          >
                            {categories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                          <button 
                            type="button"
                            onClick={() => setIsAddingCategory(true)}
                            className="p-3 bg-[#E8DFD5] text-[#4A3B32] hover:bg-[#DBCFC3] rounded-xl transition-colors font-medium flex items-center whitespace-nowrap"
                          >
                            <Plus size={18} /> 新增
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="輸入新廠商或分類..."
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="flex-1 p-3 rounded-xl border border-[#7A303F] bg-[#F5E6E8]/30 focus:bg-[#FFFDFB] focus:ring-2 focus:ring-[#7A303F] outline-none transition-all"
                            autoFocus
                          />
                          <button 
                            type="button"
                            onClick={handleAddCategory}
                            className="p-3 bg-[#7A303F] text-white hover:bg-[#5E2430] rounded-xl transition-colors font-medium whitespace-nowrap"
                          >
                            確認
                          </button>
                          <button 
                            type="button"
                            onClick={() => setIsAddingCategory(false)}
                            className="p-3 bg-[#E8DFD5] text-[#8C7A6B] hover:bg-[#DBCFC3] rounded-xl transition-colors"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#4A3B32] flex items-center gap-1">
                    <DollarSign size={16} className="text-[#8C7A6B]"/> {entryType === 'cost' ? '進貨金額 (支出)' : '每日營收 (收入)'} (NT$)
                  </label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    step="1"
                    placeholder="例如: 5000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={`w-full p-3 rounded-xl border border-[#DBCFC3] bg-[#F5F0EA] focus:bg-[#FFFDFB] focus:ring-2 transition-all outline-none text-lg font-medium ${
                      entryType === 'cost' ? 'focus:ring-[#7A303F]' : 'focus:ring-emerald-500'
                    }`}
                  />
                </div>

                <button 
                  type="submit"
                  className={`w-full py-4 mt-4 text-white rounded-xl font-bold text-lg shadow-md transition-all active:scale-[0.99] flex justify-center items-center gap-2 ${
                    entryType === 'cost' ? 'bg-[#7A303F] hover:bg-[#5E2430]' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  <Plus size={22} /> {entryType === 'cost' ? '登錄進貨支出' : '登錄營業收入'}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'records' && (
          <div className="bg-[#FFFDFB] rounded-2xl shadow-sm border border-[#E8DFD5] overflow-hidden">
             <div className="p-6 border-b border-[#E8DFD5] bg-[#F5F0EA]/50 flex justify-between items-center flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-bold flex items-center gap-2 text-[#4A3B32]">
                    <List className="text-[#7A303F]" size={20} />
                    歷史帳務明細
                  </h2>
                  <span className="text-sm text-[#8C7A6B] bg-[#FFFDFB] px-3 py-1 rounded-full border border-[#DBCFC3]">
                    共 {combinedRecords.length} 筆
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={handleDownloadFromCloud}
                    disabled={isDownloading}
                    className="flex items-center gap-2 px-4 py-2 bg-[#F5F0EA] text-[#8C7A6B] hover:bg-[#E8DFD5] border border-[#DBCFC3] rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                  >
                    <Download size={16} className={isDownloading ? 'animate-bounce' : ''} /> 
                    {isDownloading ? '載入中...' : '雲端載入最新'}
                  </button>
                  <button
                    onClick={handleManualSync}
                    disabled={isSyncing || unsyncedCount === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CloudLightning size={16} className={isSyncing ? 'animate-bounce' : ''} /> 
                    {isSyncing ? '同步中...' : `上傳雲端 ${unsyncedCount > 0 ? `(${unsyncedCount}筆未同步)` : '(已最新)'}`}
                  </button>
                  <button
                    onClick={exportToCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-[#F5E6E8] text-[#7A303F] hover:bg-[#EAC0C6] border border-[#EAC0C6] rounded-lg text-sm font-bold transition-colors"
                  >
                    <Download size={16} /> 匯出 CSV 手動備份
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F5F0EA] text-[#8C7A6B] text-sm border-b border-[#E8DFD5]">
                      <th className="p-4 font-semibold">日期</th>
                      <th className="p-4 font-semibold">類型 / 項目</th>
                      <th className="p-4 font-semibold text-right">金額</th>
                      <th className="p-4 font-semibold text-center w-20">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {combinedRecords.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-8 text-center text-[#8C7A6B]">目前尚無紀錄</td>
                      </tr>
                    ) : (
                      combinedRecords.map(entry => (
                        <tr key={entry.id} className="border-b border-[#F5F0EA] hover:bg-[#F5F0EA]/80 transition-colors">
                          <td className="p-4 text-[#4A3B32]">{entry.date}</td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                              entry.recordType === 'cost' ? 'bg-[#F5E6E8] text-[#7A303F]' : 'bg-emerald-50 text-emerald-700'
                            }`}>
                              {entry.recordType === 'cost' ? <ArrowDownRight size={14} className="mr-1"/> : <ArrowUpRight size={14} className="mr-1"/>}
                              {entry.category}
                            </span>
                          </td>
                          <td className={`p-4 text-right font-semibold ${
                            entry.recordType === 'cost' ? 'text-[#7A303F]' : 'text-emerald-600'
                          }`}>
                            {entry.recordType === 'cost' ? '-' : '+'}{formatCurrency(entry.amount)}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex justify-center items-center gap-2">
                              <button 
                                onClick={() => setEditingEntry(entry)}
                                className="text-[#8C7A6B] hover:text-[#7A303F] transition-colors p-1"
                              >
                                <Pencil size={16} />
                              </button>
                              <button 
                                onClick={() => handleDelete(entry.id, entry.recordType)}
                                className="text-[#8C7A6B] hover:text-red-500 transition-colors p-1"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-[#FFFDFB] p-4 rounded-2xl shadow-sm border border-[#E8DFD5] flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex bg-[#E8DFD5] p-1 rounded-xl w-full md:w-auto">
                <button
                  onClick={() => setReportType('weekly')}
                  className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                    reportType === 'weekly' ? 'bg-[#FFFDFB] text-[#7A303F] shadow-sm' : 'text-[#8C7A6B] hover:text-[#4A3B32]'
                  }`}
                >
                  每週(三至二)回報
                </button>
                <button
                  onClick={() => setReportType('monthly')}
                  className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                    reportType === 'monthly' ? 'bg-[#FFFDFB] text-[#7A303F] shadow-sm' : 'text-[#8C7A6B] hover:text-[#4A3B32]'
                  }`}
                >
                  每月總額統計
                </button>
              </div>

              <div className="flex bg-[#E8DFD5] p-1 rounded-xl w-full md:w-auto">
                <button
                  onClick={() => setReportViewMode('desktop')}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    reportViewMode === 'desktop' ? 'bg-[#FFFDFB] text-[#4A3B32] shadow-sm' : 'text-[#8C7A6B] hover:text-[#4A3B32]'
                  }`}
                >
                  <Monitor size={16} /> 電腦版
                </button>
                <button
                  onClick={() => setReportViewMode('mobile')}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    reportViewMode === 'mobile' ? 'bg-[#FFFDFB] text-[#4A3B32] shadow-sm' : 'text-[#8C7A6B] hover:text-[#4A3B32]'
                  }`}
                >
                  <Smartphone size={16} /> 手機版
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {reportData.length === 0 ? (
                <div className="bg-[#FFFDFB] p-12 text-center rounded-2xl border border-[#E8DFD5] text-[#8C7A6B] shadow-sm">
                  <BarChart3 size={48} className="mx-auto mb-3 opacity-20" />
                  尚無足夠資料產生報表
                </div>
              ) : (
                <>
                  <SimpleLineChart data={reportData} />
                  
                  {reportViewMode === 'mobile' ? (
                    reportData.map((group, index) => (
                      <div key={group.period} className="bg-[#FFFDFB] rounded-2xl shadow-sm border border-[#E8DFD5] overflow-hidden">
                        <div className="p-4 bg-[#F5F0EA]/50 border-b border-[#E8DFD5] flex justify-between items-center flex-wrap gap-2">
                          <h3 className="font-bold text-[#4A3B32] flex items-center gap-2 text-sm md:text-base w-full">
                            <Calendar size={18} className="text-[#7A303F]"/>
                            {group.period}
                          </h3>
                          <div className="flex justify-between w-full text-sm mt-2">
                            <div className="text-[#8C7A6B]">
                              <span className="block text-xs text-[#8C7A6B]">營收</span>
                              <span className="font-semibold text-emerald-600">{formatCurrency(group.totalRevenue)}</span>
                            </div>
                            <div className="text-[#8C7A6B] text-center">
                              <span className="block text-xs text-[#8C7A6B]">成本</span>
                              <span className="font-semibold text-[#7A303F]">{formatCurrency(group.totalCost)}</span>
                            </div>
                            <div className="text-right">
                              <span className="block text-xs text-[#8C7A6B]">毛利</span>
                              <span className={`font-bold ${group.totalRevenue - group.totalCost >= 0 ? 'text-[#A87C63]' : 'text-red-500'}`}>
                                {formatCurrency(group.totalRevenue - group.totalCost)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="p-0">
                          <table className="w-full text-left text-sm">
                            <tbody>
                              {group.items.map((item, i) => (
                                <tr key={i} className="border-b border-[#F5F0EA] hover:bg-[#F5F0EA]/50">
                                  <td className="py-3 px-4 text-[#8C7A6B] w-24 md:w-32">{item.date.substring(5)}</td>
                                  <td className="py-3 px-2 text-[#4A3B32] truncate max-w-[100px]">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium mr-1 ${item.recordType === 'cost' ? 'bg-[#F5E6E8] text-[#7A303F]' : 'bg-emerald-50 text-emerald-600'}`}>
                                      {item.recordType === 'cost' ? '出' : '入'}
                                    </span>
                                    {item.category}
                                  </td>
                                  <td className={`py-3 px-4 text-right font-medium ${item.recordType === 'cost' ? 'text-[#7A303F]' : 'text-emerald-600'}`}>
                                    {item.recordType === 'cost' ? '-' : '+'}{formatCurrency(item.amount)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-[#FFFDFB] rounded-2xl shadow-sm border border-[#E8DFD5] overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                          <thead>
                            <tr className="bg-[#F5F0EA] text-[#8C7A6B] text-sm border-b border-[#DBCFC3]">
                              <th className="p-4 font-bold w-1/4">統計區間</th>
                              <th className="p-4 font-bold">日期</th>
                              <th className="p-4 font-bold">項目類型</th>
                              <th className="p-4 font-bold text-right">單筆金額</th>
                              <th className="p-4 font-bold text-right w-1/4">區間總計 (營收/成本/毛利)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportData.map((group) => (
                              <React.Fragment key={group.period}>
                                {group.items.map((item, index) => (
                                  <tr key={item.id} className="border-b border-[#F5F0EA] hover:bg-[#F5F0EA]/80 transition-colors text-sm">
                                    {index === 0 && (
                                      <td className="p-4 text-[#4A3B32] font-semibold align-top border-r border-[#E8DFD5] bg-[#F5F0EA]/30" rowSpan={group.items.length}>
                                        <div className="flex items-center gap-2 mb-1">
                                          <Calendar size={16} className="text-[#7A303F]" />
                                          {group.period}
                                        </div>
                                      </td>
                                    )}
                                    <td className="p-4 text-[#8C7A6B]">{item.date}</td>
                                    <td className="p-4 text-[#4A3B32]">
                                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                        item.recordType === 'cost' ? 'bg-[#F5E6E8] text-[#7A303F]' : 'bg-emerald-50 text-emerald-700'
                                      }`}>
                                        {item.recordType === 'cost' ? <ArrowDownRight size={12} className="mr-1"/> : <ArrowUpRight size={12} className="mr-1"/>}
                                        {item.category}
                                      </span>
                                    </td>
                                    <td className={`p-4 text-right ${item.recordType === 'cost' ? 'text-[#7A303F]' : 'text-emerald-600'}`}>
                                      {item.recordType === 'cost' ? '-' : '+'}{formatCurrency(item.amount)}
                                    </td>
                                    {index === 0 && (
                                      <td className="p-4 align-top border-l border-[#E8DFD5] bg-[#F5F0EA]/30" rowSpan={group.items.length}>
                                        <div className="space-y-2 text-right">
                                          <div className="flex justify-between text-xs">
                                            <span className="text-[#8C7A6B]">總營收</span>
                                            <span className="font-semibold text-emerald-600">{formatCurrency(group.totalRevenue)}</span>
                                          </div>
                                          <div className="flex justify-between text-xs">
                                            <span className="text-[#8C7A6B]">總成本</span>
                                            <span className="font-semibold text-[#7A303F]">{formatCurrency(group.totalCost)}</span>
                                          </div>
                                          <div className="pt-2 border-t border-[#DBCFC3] flex justify-between font-bold">
                                            <span className="text-[#4A3B32]">結算毛利</span>
                                            <span className={group.totalRevenue - group.totalCost >= 0 ? 'text-[#A87C63]' : 'text-red-500'}>
                                              {formatCurrency(group.totalRevenue - group.totalCost)}
                                            </span>
                                          </div>
                                        </div>
                                      </td>
                                    )}
                                  </tr>
                                ))}
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {/* 系統設定與廠商管理 Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#FFFDFB] rounded-2xl shadow-xl border border-[#E8DFD5] w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-[#E8DFD5] flex justify-between items-center bg-[#F5F0EA]/50 shrink-0">
              <h3 className="font-bold text-lg flex items-center gap-2 text-[#4A3B32]">
                <Settings size={20} className="text-[#7A303F]" />
                系統設定與管理
              </h3>
              <button onClick={() => setShowSettings(false)} className="text-[#8C7A6B] hover:text-[#4A3B32] p-1 rounded-lg hover:bg-[#E8DFD5] transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              {/* 廠商管理區塊 */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-[#4A3B32] flex items-center gap-2">
                  <Tag size={16} className="text-[#7A303F]" />
                  廠商 / 分類管理
                </label>
                <div className="max-h-48 overflow-y-auto space-y-2 border border-[#DBCFC3] rounded-xl p-2 bg-[#F5F0EA]">
                  {categories.map(cat => (
                    <div key={cat} className="flex justify-between items-center bg-[#FFFDFB] px-3 py-2 rounded-lg border border-[#E8DFD5] shadow-sm">
                      <span className="text-sm text-[#4A3B32] font-medium">{cat}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveCategory(cat)} 
                        className="text-[#8C7A6B] hover:text-red-500 p-1 rounded transition-colors"
                        title="刪除此分類"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[#8C7A6B]">如需刪除預設，請先至首頁新增至少一個您自己的廠商。</p>
              </div>

              <hr className="border-[#E8DFD5]" />

              {/* Webhook 同步設定區塊 */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-[#4A3B32] flex items-center gap-2">
                  <CloudLightning size={16} className="text-[#7A303F]" />
                  Google 試算表同步設定
                </label>
                <textarea 
                  rows="2"
                  placeholder="https://script.google.com/macros/s/..."
                  value={tempWebhookUrl}
                  onChange={(e) => setTempWebhookUrl(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#DBCFC3] bg-[#F5F0EA] focus:bg-[#FFFDFB] focus:ring-2 focus:ring-[#7A303F] outline-none transition-all text-xs"
                />
              </div>
            </div>

            <div className="p-4 border-t border-[#E8DFD5] bg-[#F5F0EA]/50 flex gap-3 shrink-0">
              <button type="button" onClick={() => setShowSettings(false)} className="flex-1 py-3 bg-[#E8DFD5] hover:bg-[#DBCFC3] text-[#4A3B32] rounded-xl font-bold transition-colors">
                關閉
              </button>
              <button onClick={handleSaveSettings} className="flex-1 py-3 bg-[#7A303F] hover:bg-[#5E2430] text-white rounded-xl font-bold shadow-md transition-all">
                儲存設定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 編輯資料 Modal */}
      {editingEntry && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#FFFDFB] rounded-2xl shadow-xl border border-[#E8DFD5] w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-[#E8DFD5] flex justify-between items-center bg-[#F5F0EA]/50">
              <h3 className="font-bold text-lg flex items-center gap-2 text-[#4A3B32]">
                <Pencil size={18} className="text-[#7A303F]" />
                編輯紀錄
              </h3>
              <button onClick={() => setEditingEntry(null)} className="text-[#8C7A6B] hover:text-[#4A3B32] p-1 rounded-lg hover:bg-[#E8DFD5] transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#4A3B32]">日期</label>
                <input 
                  type="date" 
                  required
                  value={editingEntry.date}
                  onChange={(e) => setEditingEntry({...editingEntry, date: e.target.value})}
                  className="w-full p-3 rounded-xl border border-[#DBCFC3] bg-[#F5F0EA] focus:bg-[#FFFDFB] focus:ring-2 focus:ring-[#7A303F] outline-none transition-all"
                />
              </div>
              
              {editingEntry.recordType === 'cost' && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#4A3B32]">廠商 / 分類</label>
                  <select 
                    value={editingEntry.category}
                    onChange={(e) => setEditingEntry({...editingEntry, category: e.target.value})}
                    className="w-full p-3 rounded-xl border border-[#DBCFC3] bg-[#F5F0EA] focus:bg-[#FFFDFB] focus:ring-2 focus:ring-[#7A303F] outline-none transition-all"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#4A3B32]">金額 (NT$)</label>
                <input 
                  type="number" 
                  required
                  min="0"
                  step="1"
                  value={editingEntry.amount}
                  onChange={(e) => setEditingEntry({...editingEntry, amount: e.target.value})}
                  className="w-full p-3 rounded-xl border border-[#DBCFC3] bg-[#F5F0EA] focus:bg-[#FFFDFB] focus:ring-2 focus:ring-[#7A303F] outline-none transition-all text-lg font-medium"
                />
              </div>
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setEditingEntry(null)} className="flex-1 py-3 bg-[#E8DFD5] hover:bg-[#DBCFC3] text-[#4A3B32] rounded-xl font-bold transition-colors">取消</button>
                <button type="submit" className="flex-1 py-3 bg-[#7A303F] hover:bg-[#5E2430] text-white rounded-xl font-bold shadow-md transition-all">儲存修改</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 手機版底部導覽列 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#FFFDFB] border-t border-[#E8DFD5] pb-safe z-10">
        <div className="flex justify-around items-center h-16">
          <MobileNavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Plus size={20}/>} label="登錄" />
          <MobileNavButton active={activeTab === 'records'} onClick={() => setActiveTab('records')} icon={<List size={20}/>} label="紀錄" />
          <MobileNavButton active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} icon={<BarChart3 size={20}/>} label="報表" />
        </div>
      </nav>
    </div>
  );
}

// SVG 折線圖元件
function SimpleLineChart({ data }) {
  const chartData = [...data].reverse();
  if (chartData.length < 1) return null;

  const maxVal = Math.max(...chartData.map(d => Math.max(d.totalCost, d.totalRevenue)), 100) * 1.1; 
  const w = 800, h = 250, p = 40;

  const getX = (i) => p + (i * (w - 2 * p) / Math.max(chartData.length - 1, 1));
  const getY = (val) => h - p - ((val / maxVal) * (h - 2 * p));

  const costPoints = chartData.map((d, i) => `${getX(i)},${getY(d.totalCost)}`).join(' ');
  const revPoints = chartData.map((d, i) => `${getX(i)},${getY(d.totalRevenue)}`).join(' ');

  return (
    <div className="bg-[#FFFDFB] p-5 rounded-2xl shadow-sm border border-[#E8DFD5] overflow-x-auto">
      <div className="flex justify-between items-center mb-6 px-2 min-w-[500px]">
        <h3 className="font-bold text-[#4A3B32] flex items-center gap-2">
          <TrendingUp className="text-[#7A303F]" size={18} /> 收支趨勢折線圖
        </h3>
        <div className="flex gap-4 text-sm font-bold">
          <span className="flex items-center gap-1 text-emerald-600"><div className="w-3 h-3 bg-emerald-500 rounded-full"></div>營收</span>
          <span className="flex items-center gap-1 text-[#7A303F]"><div className="w-3 h-3 bg-[#7A303F] rounded-full"></div>成本</span>
        </div>
      </div>
      <div className="min-w-[500px]">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full text-xs font-sans">
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
            const y = h - p - (ratio * (h - 2 * p));
            return (
              <g key={ratio}>
                <line x1={p} y1={y} x2={w-p} y2={y} stroke="#E8DFD5" strokeWidth="1" />
                <text x={p-10} y={y+4} textAnchor="end" fill="#8C7A6B">{Math.round(maxVal * ratio).toLocaleString()}</text>
              </g>
            )
          })}
          {chartData.length > 1 && (
            <>
              <polyline points={costPoints} fill="none" stroke="#7A303F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points={revPoints} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}
          {chartData.map((d, i) => (
            <g key={i}>
              <circle cx={getX(i)} cy={getY(d.totalCost)} r="4" fill="#7A303F" />
              <circle cx={getX(i)} cy={getY(d.totalRevenue)} r="4" fill="#10b981" />
              <text x={getX(i)} y={h - p + 20} textAnchor="middle" fill="#8C7A6B" className="text-[10px] md:text-xs">
                {d.period.split(' ~ ')[0].substring(5)}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${active ? 'bg-[#F5E6E8] text-[#7A303F]' : 'text-[#8C7A6B] hover:bg-[#F5F0EA] hover:text-[#4A3B32]'}`}>
      {icon} {label}
    </button>
  );
}

function MobileNavButton({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${active ? 'text-[#7A303F]' : 'text-[#8C7A6B] hover:text-[#4A3B32]'}`}>
      {icon} <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
}