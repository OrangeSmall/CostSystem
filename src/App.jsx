import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  CloudLightning,
  Search,
  ChevronDown
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

// 專屬元件：具備搜尋功能的下拉選單
function SearchableSelect({ value, onChange, options, placeholder = "搜尋或選擇廠商..." }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearch('');
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={wrapperRef} className="relative flex-1">
      <div
        className={`flex items-center justify-between w-full p-3 rounded-xl border border-[#DBCFC3] transition-all cursor-text min-h-[50px] ${isOpen ? 'bg-[#FFFDFB] ring-2 ring-[#7A303F]' : 'bg-[#F5F0EA] hover:bg-[#FFFDFB]'}`}
        onClick={() => setIsOpen(true)}
      >
        {isOpen ? (
          <div className="flex items-center w-full gap-2">
            <Search size={16} className="text-[#8C7A6B] shrink-0" />
            <input
              type="text"
              className="w-full bg-transparent outline-none text-[#4A3B32] placeholder-[#8C7A6B]"
              placeholder="輸入關鍵字搜尋..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (filteredOptions.length > 0) {
                    onChange(filteredOptions[0]);
                    setIsOpen(false);
                    setSearch('');
                  }
                }
              }}
              autoFocus
            />
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <span className="text-[#4A3B32] truncate pr-2">{value || placeholder}</span>
            <ChevronDown size={16} className="text-[#8C7A6B] shrink-0" />
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 max-h-60 overflow-y-auto bg-[#FFFDFB] border border-[#E8DFD5] rounded-xl shadow-xl">
          {filteredOptions.length > 0 ? (
            filteredOptions.map(opt => (
              <div
                key={opt}
                className={`px-4 py-3 hover:bg-[#F5E6E8] cursor-pointer text-[#4A3B32] border-b border-[#F5F0EA] last:border-0 transition-colors ${value === opt ? 'bg-[#F5E6E8] font-bold text-[#7A303F]' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(opt);
                  setIsOpen(false);
                  setSearch('');
                }}
              >
                {opt}
              </div>
            ))
          ) : (
            <div className="px-4 py-4 text-[#8C7A6B] text-center text-sm bg-[#F5F0EA]/30">找不到符合的廠商</div>
          )}
        </div>
      )}
    </div>
  );
}

// 系統主層：負責管理「店鋪清單」與「當前作用的店鋪」
export default function App() {
  const [stores, setStores] = useState(() => {
    const s = localStorage.getItem('purchaseStores');
    if (s) return JSON.parse(s);
    
    // 無痛升級：讀取舊版 Webhook
    const oldUrl = localStorage.getItem('sheetWebhookUrl');
    const defaultUrl = 'https://script.google.com/macros/s/AKfycbzL5ZKrzuWhUgATAdRWNH5oyfzxQAJ-7CXXIWUbspSqn8EUh7WdLdEF8hkkoTP9iyI/exec';
    return [{ id: 'default', name: '預設主店鋪', webhookUrl: oldUrl || defaultUrl }];
  });

  const [activeStoreId, setActiveStoreId] = useState(() => localStorage.getItem('activeStoreId') || 'default');

  const activeStore = stores.find(s => s.id === activeStoreId) || stores[0];

  return (
    <StoreManager
      key={activeStore.id} // 當店鋪切換時，強制重新掛載元件以隔離資料
      store={activeStore}
      stores={stores}
      setStores={(newStores) => {
        setStores(newStores);
        localStorage.setItem('purchaseStores', JSON.stringify(newStores));
      }}
      activeStoreId={activeStoreId}
      setActiveStoreId={(id) => {
        setActiveStoreId(id);
        localStorage.setItem('activeStoreId', id);
      }}
    />
  );
}

// 店鋪管理層：獨立運作單一店鋪的資料與邏輯
function StoreManager({ store, stores, setStores, activeStoreId, setActiveStoreId }) {
  const [activeTab, setActiveTab] = useState('dashboard'); 
  const [showSettings, setShowSettings] = useState(false);
  
  // 歷史紀錄的搜尋狀態
  const [recordSearch, setRecordSearch] = useState('');

  // 狀態管理：使用店鋪 ID 區隔 localStorage
  const [categories, setCategories] = useState(() => {
    const specific = localStorage.getItem(`purchaseCategories_${store.id}`);
    if (specific) return JSON.parse(specific);
    if (store.id === 'default') {
       const old = localStorage.getItem('purchaseCategories');
       if (old) return JSON.parse(old);
    }
    return ['未分類廠商'];
  });

  const [entries, setEntries] = useState(() => {
    const specific = localStorage.getItem(`purchaseEntries_${store.id}`);
    if (specific) return JSON.parse(specific);
    if (store.id === 'default') {
       const old = localStorage.getItem('purchaseEntries');
       if (old) return JSON.parse(old);
    }
    return [];
  });
  
  const [revenues, setRevenues] = useState(() => {
    const specific = localStorage.getItem(`purchaseRevenues_${store.id}`);
    if (specific) return JSON.parse(specific);
    if (store.id === 'default') {
       const old = localStorage.getItem('purchaseRevenues');
       if (old) return JSON.parse(old);
    }
    return [];
  });

  const [weeklyBudget, setWeeklyBudget] = useState(() => {
    const specific = localStorage.getItem(`weeklyBudget_${store.id}`);
    if (specific) return Number(specific);
    if (store.id === 'default') {
       const old = localStorage.getItem('weeklyBudget');
       if (old) return Number(old);
    }
    return 20000;
  });

  // 表單與 UI 狀態
  const [entryType, setEntryType] = useState('cost'); 
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState(categories[0] || '');
  const [amount, setAmount] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [syncToast, setSyncToast] = useState({ show: false, message: '', type: 'success' });

  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState(weeklyBudget);
  const [isBudgetSynced, setIsBudgetSynced] = useState(true);

  const [reportType, setReportType] = useState('weekly'); 
  const [reportViewMode, setReportViewMode] = useState('desktop'); 

  // 設定彈窗的暫存店鋪資料
  const [tempStores, setTempStores] = useState(stores);

  // 切換店鋪時自動下載雲端資料
  useEffect(() => {
    if (store.webhookUrl) {
      handleDownloadFromCloud();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 當資料改變時，自動儲存到對應的瀏覽器 localStorage
  useEffect(() => {
    localStorage.setItem(`purchaseCategories_${store.id}`, JSON.stringify(categories));
    if (!categories.includes(category) && categories.length > 0) {
      setCategory(categories[0]);
    }
  }, [categories, category, store.id]);

  useEffect(() => {
    localStorage.setItem(`purchaseEntries_${store.id}`, JSON.stringify(entries));
  }, [entries, store.id]);

  useEffect(() => {
    localStorage.setItem(`purchaseRevenues_${store.id}`, JSON.stringify(revenues));
  }, [revenues, store.id]);

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

  const handleRemoveCategory = (catToRemove) => {
    if (categories.length <= 1) {
      alert('請至少保留一個廠商分類喔！');
      return;
    }
    if (window.confirm(`確定要刪除「${catToRemove}」嗎？\n(不影響已登錄的歷史紀錄)`)) {
      setCategories(categories.filter(c => c !== catToRemove));
    }
  };

  // 從雲端下載資料
  const handleDownloadFromCloud = async () => {
    if (!store.webhookUrl) return;
    setIsDownloading(true);
    try {
      const response = await fetch(store.webhookUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const json = await response.json();
      let data = [];
      let fetchedBudget = null;

      if (Array.isArray(json)) {
        data = json;
      } else if (json && json.data) {
        data = json.data;
        if (json.budget !== undefined) fetchedBudget = json.budget;
      }

      if (fetchedBudget !== null) {
        setWeeklyBudget(Number(fetchedBudget));
        setTempBudget(Number(fetchedBudget));
        localStorage.setItem(`weeklyBudget_${store.id}`, fetchedBudget.toString());
        setIsBudgetSynced(true);
      }
      
      if (Array.isArray(data)) {
        const newEntries = [];
        const newRevenues = [];
        const catSet = new Set(categories); 

        data.forEach(row => {
          if (row.type === '進貨成本') {
            newEntries.push({ id: row.id || Date.now().toString() + Math.random(), date: row.date, category: row.category, amount: Number(row.amount), isSynced: true });
            catSet.add(row.category); 
          } else if (row.type === '營業收入') {
            newRevenues.push({ id: row.id || Date.now().toString() + Math.random(), date: row.date, category: '每日營收', amount: Number(row.amount), isSynced: true });
          }
        });

        setEntries(newEntries.sort((a,b) => new Date(b.date) - new Date(a.date)));
        setRevenues(newRevenues.sort((a,b) => new Date(b.date) - new Date(a.date)));
        setCategories(Array.from(catSet));
        
        setSyncToast({ show: true, message: `【${store.name}】雲端資料載入成功！`, type: 'success' });
        setTimeout(() => setSyncToast({ show: false, message: '', type: 'success' }), 2000);
      }
    } catch (error) {
      console.error('Download Error:', error);
      setSyncToast({ show: true, message: '載入失敗：請確認網址或權限設定。', type: 'error' });
      setTimeout(() => setSyncToast({ show: false, message: '', type: 'success' }), 5000);
    } finally {
      setIsDownloading(false);
    }
  };

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

  const handleManualSync = async () => {
    if (!store.webhookUrl) {
      setSyncToast({ show: true, message: '請先於 ⚙️ 設定此店鋪的 Webhook 網址！', type: 'error' });
      setTimeout(() => setSyncToast({ show: false, message: '', type: 'success' }), 3000);
      setShowSettings(true);
      return;
    }

    setIsSyncing(true);

    try {
      const payload = {
        action: 'overwrite',
        budget: weeklyBudget,
        data: [
          ...entries.map(e => ({ id: e.id, date: e.date, type: '進貨成本', category: e.category, amount: e.amount })),
          ...revenues.map(r => ({ id: r.id, date: r.date, type: '營業收入', category: '每日營收', amount: r.amount }))
        ]
      };

      const response = await fetch(store.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      setEntries(entries.map(e => ({ ...e, isSynced: true })));
      setRevenues(revenues.map(r => ({ ...r, isSynced: true })));
      setIsBudgetSynced(true);
      
      setSyncToast({ show: true, message: `【${store.name}】已成功同步至雲端！`, type: 'success' });
      setTimeout(() => setSyncToast({ show: false, message: '', type: 'success' }), 3000);
    } catch (error) {
      console.error('Sync Error:', error);
      setSyncToast({ show: true, message: '上傳失敗：請確認網路與權限。', type: 'error' });
      setTimeout(() => setSyncToast({ show: false, message: '', type: 'success' }), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDelete = (id, type) => {
    if (type === 'cost') {
      setEntries(entries.filter(entry => entry.id !== id).map(e => ({...e, isSynced: false})));
    } else {
      setRevenues(revenues.filter(rev => rev.id !== id).map(r => ({...r, isSynced: false})));
    }
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingEntry.date || !editingEntry.amount || isNaN(editingEntry.amount)) return;
    if (editingEntry.recordType === 'cost' && !editingEntry.category) return;
    
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

  const handleSaveBudget = () => {
    const newBudget = Number(tempBudget);
    setWeeklyBudget(newBudget);
    localStorage.setItem(`weeklyBudget_${store.id}`, newBudget.toString());
    setIsEditingBudget(false);
    setIsBudgetSynced(false);
  };

  // 儲存設定 (多店鋪更新)
  const handleSaveSettings = () => {
    setStores(tempStores);
    if (!tempStores.find(s => s.id === activeStoreId)) {
       setActiveStoreId(tempStores[0].id);
    }
    setShowSettings(false);
  };

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
    link.download = `[${store.name}]_進貨營收紀錄_${new Date().toISOString().split('T')[0]}.csv`;
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

  const filteredCombinedRecords = useMemo(() => {
    if (!recordSearch.trim()) return combinedRecords;
    const query = recordSearch.toLowerCase();
    return combinedRecords.filter(entry => {
      const typeStr = entry.recordType === 'cost' ? '進貨支出' : '每日營收';
      return (
        entry.date.includes(query) ||
        entry.category.toLowerCase().includes(query) ||
        entry.amount.toString().includes(query) ||
        typeStr.includes(query)
      );
    });
  }, [combinedRecords, recordSearch]);

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

  const unsyncedCount = entries.filter(e => !e.isSynced).length + revenues.filter(r => !r.isSynced).length + (!isBudgetSynced ? 1 : 0);

  return (
    <div className="min-h-screen bg-[#F5F0EA] text-[#4A3B32] font-sans pb-20 md:pb-0">
      
      {syncToast.show && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 transition-all duration-300 ${syncToast.type === 'success' ? 'bg-[#FFFDFB] border-l-4 border-emerald-500 text-[#4A3B32]' : 'bg-[#FFFDFB] border-l-4 border-red-500 text-[#4A3B32]'}`}>
          {syncToast.type === 'success' ? <CheckCircle2 size={20} className="text-emerald-500" /> : <AlertCircle size={20} className="text-red-500" />}
          <span className="font-bold text-sm whitespace-nowrap">{syncToast.message}</span>
        </div>
      )}

      {/* 頂部包含店鋪切換的導覽列 */}
      <header className="bg-[#FFFDFB] shadow-sm border-b border-[#E8DFD5] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#7A303F]">
            <LayoutDashboard size={24} className="text-[#7A303F] hidden md:block" />
            <h1 className="text-lg md:text-xl font-bold tracking-wide hidden md:block">成本追蹤系統</h1>
            <select
              value={activeStoreId}
              onChange={(e) => setActiveStoreId(e.target.value)}
              className="md:ml-2 bg-[#F5E6E8] text-[#7A303F] font-bold py-1.5 px-3 rounded-lg border-none outline-none cursor-pointer text-sm md:text-base max-w-[150px] md:max-w-xs"
            >
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
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
              title="同步當前店鋪"
            >
              <CloudLightning size={20} className={isSyncing ? 'animate-pulse text-[#A87C63]' : ''} />
              <span className="hidden md:inline">{isSyncing ? '同步中' : '同步'}</span>
              {unsyncedCount > 0 && !isSyncing && (
                <span className="absolute top-1.5 right-1.5 md:right-0 md:-top-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[#FFFDFB]"></span>
              )}
            </button>

            <button 
              onClick={() => {
                setTempStores(stores); // 打開設定時載入最新清單
                setShowSettings(true);
              }}
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
                  <p className="text-xs text-[#8C7A6B] mt-1">結算週期：{currentWeekString}</p>
                </div>
                
                {!isEditingBudget ? (
                  <div className="text-right flex flex-col items-end">
                    <span className="text-sm text-[#8C7A6B] mb-1">預算設定</span>
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
                    <p className="text-sm text-[#8C7A6B] mt-1">目前登錄店鋪：<span className="font-bold text-[#7A303F]">{store.name}</span></p>
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
                    登錄成功！資料已保存在【{store.name}】的本機紀錄。
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
                          <SearchableSelect 
                            value={category}
                            onChange={setCategory}
                            options={categories}
                          />
                          <button 
                            type="button"
                            onClick={() => setIsAddingCategory(true)}
                            className="p-3 bg-[#E8DFD5] text-[#4A3B32] hover:bg-[#DBCFC3] rounded-xl transition-colors font-medium flex items-center whitespace-nowrap h-[50px]"
                          >
                            <Plus size={18} /> 新增
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 h-[50px]">
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
                    共 {filteredCombinedRecords.length} 筆 {recordSearch && '(搜尋結果)'}
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
                    {isSyncing ? '同步中...' : `上傳雲端 ${unsyncedCount > 0 ? `(${unsyncedCount}變更)` : ''}`}
                  </button>
                  <button
                    onClick={exportToCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-[#F5E6E8] text-[#7A303F] hover:bg-[#EAC0C6] border border-[#EAC0C6] rounded-lg text-sm font-bold transition-colors"
                  >
                    <Download size={16} /> 匯出 CSV
                  </button>
                </div>
              </div>

              {/* 搜尋框區塊 */}
              <div className="p-4 bg-[#F5F0EA]/30 border-b border-[#E8DFD5]">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C7A6B]" size={18} />
                  <input
                    type="text"
                    placeholder="搜尋日期、廠商、營收或金額..."
                    value={recordSearch}
                    onChange={(e) => setRecordSearch(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#DBCFC3] bg-[#FFFDFB] focus:ring-2 focus:ring-[#7A303F] outline-none transition-all text-sm text-[#4A3B32] shadow-sm"
                  />
                  {recordSearch && (
                    <button 
                      onClick={() => setRecordSearch('')} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C7A6B] hover:text-[#4A3B32] p-1 rounded-full hover:bg-[#E8DFD5] transition-colors"
                    >
                      <X size={16}/>
                    </button>
                  )}
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
                    {filteredCombinedRecords.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-8 text-center text-[#8C7A6B]">
                          {recordSearch ? '找不到符合的搜尋結果' : '目前尚無紀錄'}
                        </td>
                      </tr>
                    ) : (
                      filteredCombinedRecords.map(entry => (
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
                                title="編輯"
                              >
                                <Pencil size={16} />
                              </button>
                              <button 
                                onClick={() => handleDelete(entry.id, entry.recordType)}
                                className="text-[#8C7A6B] hover:text-red-500 transition-colors p-1"
                                title="刪除"
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
              
              {/* 分店與資料庫設定 */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-[#4A3B32] flex items-center gap-2">
                  <CloudLightning size={16} className="text-[#7A303F]" />
                  分店與連線設定 (多店管理)
                </label>
                <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
                  {tempStores.map(s => (
                    <div key={s.id} className="bg-[#FFFDFB] p-3 rounded-xl border border-[#DBCFC3] relative space-y-2">
                        <div className="flex justify-between items-center">
                          <input
                              value={s.name}
                              onChange={(e) => setTempStores(tempStores.map(ts => ts.id === s.id ? { ...ts, name: e.target.value } : ts))}
                              placeholder="店名 (例如: 四維店)"
                              className="font-bold text-[#4A3B32] bg-transparent border-b border-[#DBCFC3] outline-none focus:border-[#7A303F] w-2/3 pb-1"
                          />
                          <button
                              type="button"
                              onClick={() => {
                                if(tempStores.length <= 1) { alert('請至少保留一個店鋪設定！'); return; }
                                if(window.confirm('確定要刪除這個店鋪設定嗎？\n(這不會刪除雲端資料，但本機會失去連線)')) {
                                  setTempStores(tempStores.filter(ts => ts.id !== s.id));
                                }
                              }}
                              className="text-[#8C7A6B] hover:text-red-500 p-1 rounded transition-colors"
                          >
                              <Trash2 size={16} />
                          </button>
                        </div>
                        <textarea
                          rows="2"
                          value={s.webhookUrl}
                          onChange={(e) => setTempStores(tempStores.map(ts => ts.id === s.id ? { ...ts, webhookUrl: e.target.value } : ts))}
                          placeholder="貼上專屬此店的 Google Apps Script 網址..."
                          className="w-full p-2 rounded-lg border border-[#E8DFD5] bg-[#F5F0EA] focus:bg-[#FFFDFB] focus:ring-1 focus:ring-[#7A303F] outline-none text-xs"
                        />
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTempStores([...tempStores, { id: Date.now().toString(), name: '新分店', webhookUrl: '' }]);
                  }}
                  className="w-full py-2 bg-[#F5E6E8] text-[#7A303F] rounded-xl font-bold hover:bg-[#EAC0C6] transition-colors text-sm flex items-center justify-center gap-1 mt-2"
                >
                  <Plus size={16}/> 新增分店
                </button>
              </div>

              <hr className="border-[#E8DFD5]" />

              {/* 廠商管理區塊 */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-[#4A3B32] flex items-center gap-2">
                  <Tag size={16} className="text-[#7A303F]" />
                  【{store.name}】廠商分類管理
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
                  <SearchableSelect 
                    value={editingEntry.category}
                    onChange={(val) => setEditingEntry({...editingEntry, category: val})}
                    options={categories}
                  />
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
  const [hoverIndex, setHoverIndex] = useState(null);
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
      <div className="min-w-[500px] relative">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto text-xs font-sans overflow-visible">
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
            const y = h - p - (ratio * (h - 2 * p));
            return (
              <g key={ratio}>
                <line x1={p} y1={y} x2={w-p} y2={y} stroke="#E8DFD5" strokeWidth="1" />
                <text x={p-10} y={y+4} textAnchor="end" fill="#8C7A6B">{Math.round(maxVal * ratio).toLocaleString()}</text>
              </g>
            )
          })}

          {/* 垂直對齊輔助線 */}
          {hoverIndex !== null && (
            <line 
              x1={getX(hoverIndex)} y1={p} 
              x2={getX(hoverIndex)} y2={h-p} 
              stroke="#DBCFC3" strokeWidth="2" strokeDasharray="4 4" 
              className="transition-all duration-200"
            />
          )}

          {chartData.length > 1 && (
            <>
              <polyline points={costPoints} fill="none" stroke="#7A303F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points={revPoints} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}
          
          {chartData.map((d, i) => (
            <g key={i}>
              <circle cx={getX(i)} cy={getY(d.totalCost)} r={hoverIndex === i ? "6" : "4"} fill="#7A303F" className="transition-all duration-200" />
              <circle cx={getX(i)} cy={getY(d.totalRevenue)} r={hoverIndex === i ? "6" : "4"} fill="#10b981" className="transition-all duration-200" />
              <text x={getX(i)} y={h - p + 20} textAnchor="middle" fill={hoverIndex === i ? "#4A3B32" : "#8C7A6B"} className={`text-[10px] md:text-xs transition-colors ${hoverIndex === i ? 'font-bold' : ''}`}>
                {d.period.split(' ~ ')[0].substring(5)}
              </text>
            </g>
          ))}

          {/* 隱藏的 Hover 感應區塊 (滑鼠不需精準點擊圓點也能觸發) */}
          {chartData.map((d, i) => {
            const x = getX(i);
            const width = chartData.length > 1 ? (w - 2 * p) / (chartData.length - 1) : 100;
            return (
              <rect
                key={`hit-${i}`}
                x={x - width / 2}
                y={0}
                width={width}
                height={h}
                fill="transparent"
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
                className="cursor-pointer outline-none"
              />
            );
          })}

          {/* Tooltip 資訊浮窗 */}
          {hoverIndex !== null && (() => {
            const d = chartData[hoverIndex];
            // 智慧計算 Tooltip 位置，避免右側或頂部超出版面被裁切
            let ttX = getX(hoverIndex) + 15;
            if (ttX + 160 > w) ttX = getX(hoverIndex) - 175;
            
            let ttY = Math.min(getY(d.totalCost), getY(d.totalRevenue)) - 50;
            if (ttY < 10) ttY = 10;
            if (ttY + 120 > h) ttY = h - 120;

            return (
              <foreignObject x={ttX} y={ttY} width="160" height="130" className="pointer-events-none transition-all duration-200">
                <div className="bg-[#4A3B32]/95 backdrop-blur-md text-[#FFFDFB] p-3 rounded-xl shadow-xl text-sm w-full h-full box-border flex flex-col justify-center border border-[#8C7A6B]/30">
                  <div className="font-bold mb-2 border-b border-[#8C7A6B]/50 pb-1 text-center whitespace-nowrap text-xs">
                    {d.period}
                  </div>
                  <div className="flex justify-between gap-3 mb-1">
                    <span className="text-emerald-400 text-xs">營收</span>
                    <span className="font-semibold text-xs">{formatCurrency(d.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between gap-3 mb-1">
                    <span className="text-rose-400 text-xs">成本</span>
                    <span className="font-semibold text-xs">{formatCurrency(d.totalCost)}</span>
                  </div>
                  <div className="flex justify-between gap-3 mt-1 pt-2 border-t border-[#8C7A6B]/50 font-bold">
                    <span className="text-[#E8DFD5] text-xs">毛利</span>
                    <span className={`text-xs ${d.totalRevenue - d.totalCost >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatCurrency(d.totalRevenue - d.totalCost)}
                    </span>
                  </div>
                </div>
              </foreignObject>
            );
          })()}
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