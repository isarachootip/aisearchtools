import { useState, useRef, useEffect } from 'react';
import { Camera, Search, ChevronLeft, ScanLine, Info, ShoppingCart, History, Settings, Save, Check, Plus, Trash2, Globe, Database, Scale, CheckSquare, Square } from 'lucide-react';
import './App.css';

function App() {
  const [screen, setScreen] = useState('home'); 
  const [saveStatus, setSaveStatus] = useState('');
  
  const [activeProvider, setActiveProvider] = useState(() => localStorage.getItem('activeProvider') || 'gemini');
  const [apiKeys, setApiKeys] = useState(() => {
    const saved = localStorage.getItem('apiKeys');
    return saved ? JSON.parse(saved) : { gemini: '', openai: '', claude: '' };
  });
  const [newProviderName, setNewProviderName] = useState('');

  const [showSourceConfig, setShowSourceConfig] = useState(false);
  const [searchSources, setSearchSources] = useState({ pim: true, internet: false });
  const [resultsData, setResultsData] = useState([]);
  const [compareTray, setCompareTray] = useState([]);
  const [aiAnalysisStr, setAiAnalysisStr] = useState('');
  
  const [uploadedImagePreview, setUploadedImagePreview] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if ((screen === 'home' || showSourceConfig) && videoRef.current) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
          .then(stream => {
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          })
          .catch(err => console.error("Camera access denied", err));
    }
  }, [screen, showSourceConfig]);

  const saveConfig = () => {
    localStorage.setItem('activeProvider', activeProvider);
    localStorage.setItem('apiKeys', JSON.stringify(apiKeys));
    setSaveStatus('Saved successfully!');
    setTimeout(() => setSaveStatus(''), 2000);
  };

  const handleAddProvider = () => {
    if (!newProviderName.trim()) return;
    const keyN = newProviderName.trim().toLowerCase();
    if (!apiKeys[keyN]) setApiKeys({ ...apiKeys, [keyN]: '' });
    setNewProviderName('');
  };

  const handleRemoveProvider = (pToRemove) => {
    if (pToRemove === 'gemini') return;
    const newK = { ...apiKeys };
    delete newK[pToRemove];
    setApiKeys(newK);
    if (activeProvider === pToRemove) setActiveProvider('gemini');
  };

  const handleCapture = async () => {
    setShowSourceConfig(false);
    setScreen('scanning');
    
    let base64Image = uploadedImagePreview;

    // If no uploaded image, try to grab from camera video
    if (!base64Image && videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth || 480;
        canvas.height = video.videoHeight || 640;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        base64Image = canvas.toDataURL('image/jpeg', 0.5);
    }
    
    try {
        // Use local variable for Vite vs Prod
        const fetchUrl = import.meta.env.DEV ? 'http://localhost:5000/api/v1/search' : '/api/v1/search';

        // Send request to backend API
        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                imageBase64: base64Image || "data:image/jpeg;base64,mock...", // send mock if camera fails
                activeProvider,
                searchSources,
                apiKeys
            })
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            setResultsData(data.results || []);
            setCompareTray([]);
            // Debug string to show if AI actually worked
            if(data.ai_analysis?.brand) {
                setAiAnalysisStr(`AI Found: ${data.ai_analysis.brand} - Keywords: ${data.ai_analysis.keywords.join(', ')}`);
            } else {
                setAiAnalysisStr('No AI match, simulated data shown.');
            }
        }
    } catch (e) {
        console.error("API Fetch Failed", e);
        // Fallback mockup
        setResultsData([
           { id: '1', name: 'Cyberpunk Mock Error', source: 'PIM', price: '฿0', specs: { auth: 'No', bluetooth: 'v0', anc: 'None', battery: '0' }, imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800' }
        ]);
    }

    setScreen('result_list');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearUpload = () => {
    setUploadedImagePreview(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
  };

  const TopNav = ({ title, showBack, rightAction }) => (
    <div className="nav-bar">
      {showBack ? (
        <button className="icon-btn" onClick={() => setScreen('home')}>
           <ChevronLeft color="#00f3ff" />
        </button>
      ) : (
        <button className="icon-btn" onClick={() => setScreen('settings')}>
           <Settings color="#a0a5b5" size={24} />
        </button>
      )}
      <h2 className="neon-text title">{title}</h2>
      <button className="icon-btn" onClick={rightAction}>
        <History color="#a0a5b5" size={20} />
      </button>
    </div>
  );

  const toggleCompare = (product) => {
    if (compareTray.find(p => p.id === product.id)) {
      setCompareTray(compareTray.filter(p => p.id !== product.id));
    } else {
      if (compareTray.length < 3) setCompareTray([...compareTray, product]);
    }
  };

  return (
    <div className="app-container">
      {/* Hidden Canvas and Input for extracting screenshot */}
      <canvas ref={canvasRef} style={{display: 'none'}}></canvas>
      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} style={{display: 'none'}} />
              
      {screen === 'home' && (
        <div className="camera-view">
          <TopNav title="AI LENS" showBack={false} />
          <div className="viewfinder">
            {uploadedImagePreview ? (
                <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={uploadedImagePreview} alt="uploaded" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button onClick={handleClearUpload} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(0,0,0,0.6)', color: 'white', padding: '10px 15px', borderRadius: '8px', border: '1px solid #fff', zIndex: 10 }}>Clear Photo</button>
                </div>
            ) : (
                <>
                    <video ref={videoRef} autoPlay playsInline muted className="camera-video"></video>
                    <div className="frame-marker top-left"></div>
                    <div className="frame-marker top-right"></div>
                    <div className="frame-marker bottom-left"></div>
                    <div className="frame-marker bottom-right"></div>
                    <p className="hint-text">Point camera or Upload image</p>
                </>
            )}
          </div>
          <div className="action-bar glass-panel">
            <button className="upload-btn" onClick={() => fileInputRef.current.click()}>
              <Database color="#a0a5b5" size={20}/>
            </button>
            <button className="shutter-btn" onClick={() => setShowSourceConfig(true)}>
              <div className="shutter-inner"><Camera color="#141826" size={32} /></div>
            </button>
            <button className="gallery-btn" onClick={() => setScreen('settings')}>
              <Settings size={20} color="#a0a5b5" />
            </button>
          </div>

          {showSourceConfig && (
            <div className="config-modal-overlay">
              <div className="config-modal glass-panel">
                 <h3 className="neon-text">Smart Search Setup</h3>
                 <p className="modal-desc">Configure where the AI should extract data from.</p>
                 <div className="source-toggles">
                    <label className={`modal-toggle ${searchSources.pim ? 'active' : ''}`} onClick={() => setSearchSources({...searchSources, pim: !searchSources.pim})}>
                      <Database size={20} /> Local PIM System
                      {searchSources.pim ? <CheckSquare size={20} className="check-icon" /> : <Square size={20} className="check-icon" />}
                    </label>
                    <label className={`modal-toggle ${searchSources.internet ? 'active' : ''}`} onClick={() => setSearchSources({...searchSources, internet: !searchSources.internet})}>
                      <Globe size={20} /> Web / Competitors
                      {searchSources.internet ? <CheckSquare size={20} className="check-icon" /> : <Square size={20} className="check-icon" />}
                    </label>
                 </div>
                 <div className="modal-actions">
                   <button className="cancel-btn" onClick={() => setShowSourceConfig(false)}>Cancel</button>
                   <button className="start-scan-btn neon-box" onClick={handleCapture}>Start Scan</button>
                 </div>
              </div>
            </div>
          )}
        </div>
      )}

      {screen === 'settings' && (
        <div className="settings-view">
          <TopNav title="SYSTEM CONFIG" showBack={true} />
          <div className="settings-container">
            <h3 className="section-title text-gradient">Set Default Provider</h3>
            <div className="provider-options">
              {Object.keys(apiKeys).map(p => (
                <label key={p} className={`radio-label ${activeProvider === p ? 'active' : ''}`}>
                  <input type="radio" value={p} checked={activeProvider === p} onChange={(e) => setActiveProvider(e.target.value)} />
                  <span>{p.toUpperCase()}</span>
                  {activeProvider === p && <Check size={16} color="#00f3ff" />}
                </label>
              ))}
            </div>

            <h3 className="section-title text-gradient mt-20">API Keys Management</h3>
            <div className="api-keys-form">
              {Object.keys(apiKeys).map((pK) => (
                <div className="input-group" key={pK}>
                  <div className="input-header">
                    <label>{pK.toUpperCase()} API KEY</label>
                    {pK !== 'gemini' && (
                       <button className="delete-btn" onClick={() => handleRemoveProvider(pK)}><Trash2 size={14} color="#ec008c" /></button>
                    )}
                  </div>
                  <input type="password" placeholder={`Enter ${pK} key...`} value={apiKeys[pK]} onChange={(e) => setApiKeys({ ...apiKeys, [pK]: e.target.value })} />
                </div>
              ))}
            </div>

            <div className="add-provider-section">
              <input type="text" placeholder="New provider (e.g. huggingface)" value={newProviderName} onChange={(e) => setNewProviderName(e.target.value)} className="add-provider-input" />
              <button className="add-provider-btn" onClick={handleAddProvider}><Plus size={18} /> Add</button>
            </div>

            <button className="save-btn" onClick={saveConfig}><Save size={20} /><span>Save Configuration</span></button>
            {saveStatus && <p className="status-message neon-text">{saveStatus}</p>}
          </div>
        </div>
      )}

      {screen === 'scanning' && (
        <div className="scanning-view">
          <TopNav title="ANALYZING..." showBack={false} />
          <div className="analyze-container glass-panel">
             <div className="scan-animation">
               <ScanLine size={64} color="#00f3ff" className="pulse-icon" />
               <div className="scanner-line"></div>
             </div>
             <p className="neon-text loading-text">Calling Backend & {activeProvider.toUpperCase()} AI...</p>
          </div>
        </div>
      )}

      {screen === 'result_list' && (
        <div className="result-view">
          <TopNav title="DISCOVERED" showBack={true} />
          <div className="results-container">
            <p className="results-meta" style={{color: '#00f3ff', fontWeight: 'bold'}}>{aiAnalysisStr}</p>
            <p className="results-meta">Backend loaded {resultsData.length} matches.</p>
            
            {resultsData.map(product => {
              const isSelected = !!compareTray.find(p => p.id === product.id);
              return (
                <div key={product.id} className={`list-card glass-panel ${isSelected ? 'selected' : ''}`}>
                  <img src={product.imageUrl} alt={product.name} className="list-img" />
                  <div className="list-info">
                    <span className="source-badge">{product.source}</span>
                    <h4 className="list-title">{product.name}</h4>
                    <p className="list-price neon-text">{product.price}</p>
                  </div>
                  <div className="list-action" onClick={() => toggleCompare(product)}>
                     {isSelected ? <CheckSquare color="#00f3ff" size={28} /> : <Square color="#a0a5b5" size={28} />}
                  </div>
                </div>
              );
            })}
          </div>

          {compareTray.length > 0 && (
            <div className="compare-tray glass-panel">
               <div className="tray-info"><Scale color="#ec008c" /><span>{compareTray.length} selected for comparison</span></div>
               <button className="run-compare-btn" onClick={() => setScreen('compare_view')}>Compare Now</button>
            </div>
          )}
        </div>
      )}

      {screen === 'compare_view' && (
        <div className="compare-view-screen">
          <TopNav title="AI COMPARISON" showBack={true} rightAction={() => setScreen('result_list')} />
          <div className="compare-matrix">
            <div className="matrix-row header-row">
              <div className="matrix-cell label-cell">Features</div>
              {compareTray.map(p => (
                <div key={p.id} className="matrix-cell product-cell glass-panel">
                   <img src={p.imageUrl} alt={p.name} />
                   <h5>{p.name}</h5>
                   <span className="source-badge">{p.source}</span>
                </div>
              ))}
            </div>

            <div className="matrix-row">
              <div className="matrix-cell label-cell">Price</div>
              {compareTray.map(p => <div key={p.id} className="matrix-cell value-cell neon-text">{p.price}</div>)}
            </div>

            {['auth', 'bluetooth', 'anc', 'battery'].map(specKey => (
              <div key={specKey} className="matrix-row">
                <div className="matrix-cell label-cell text-gradient">{specKey.toUpperCase()}</div>
                {compareTray.map(p => <div key={p.id} className="matrix-cell value-cell">{p.specs[specKey]}</div>)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
