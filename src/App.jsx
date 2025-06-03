import { useState, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import html2canvas from "html2canvas";
import QRCode from "qrcode";

let IrysClient;

export default function NFTGenerator() {
  const [image, setImage] = useState(null);
  const [text, setText] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [randomPhrase, setRandomPhrase] = useState("");
  const [stickers, setStickers] = useState([]);
  const memeRef = useRef(null);
  const canvasRef = useRef(null);
  const baseImageRef = useRef(null);

  const availableStickers = [
    '/public/stickers/irys1.png',
    '/public/stickers/irys2.png',
    '/public/stickers/irys3.png',
    '/public/stickers/irys4.png',
    '/public/stickers/irys5.png',
    '/public/stickers/irys6.png',
    '/public/stickers/irys7.png',
    '/public/stickers/irys8.png',
    '/public/stickers/irys9.png',
    '/public/stickers/irys10.png',
    '/public/stickers/irys11.png',
    '/public/stickers/irys12.png',
    '/public/stickers/irys13.png',
  ];

  useEffect(() => {
    const initIrys = async () => {
      try {
        const module = await import('@irys/sdk');
        IrysClient = module.default;
        console.log("Irys initialized successfully");
      } catch (error) {
        console.error("Failed to initialize Irys:", error);
      }
    };
    initIrys();
    generateRandomPhrase();
  }, []);

  const generateRandomPhrase = () => {
    const phrases = [
      "Irys will keep this meme for 100 years!",
      "Satoshi said that Irys is the new Bitcoin",
      "This meme is verified by Irys",
      "Meme in the blockchain forever",
      "NFT meme created!"
    ];
    const newPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    setRandomPhrase(newPhrase);
    return newPhrase;
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: "image/*",
    onDrop: (acceptedFiles) => {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result);
        setStickers([]);
      };
      reader.readAsDataURL(acceptedFiles[0]);
      if (!text) setText(generateRandomPhrase());
    },
  });

  const addRandomStickers = () => {
    const maxStickers = 3;
    const shuffled = [...availableStickers]
      .sort(() => 0.5 - Math.random())
      .slice(0, maxStickers);
    
    setStickers(shuffled.map(url => ({
      url,
      x: Math.random() * 70 + 15,
      y: Math.random() * 70 + 15,
      size: Math.random() * 120 + 120,
      rotation: Math.random() * 30 - 15
    })));
  };

  useEffect(() => {
    if (!canvasRef.current || !baseImageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.drawImage(baseImageRef.current, 0, 0, canvas.width, canvas.height);
    
    stickers.forEach(sticker => {
      const img = new Image();
      img.src = sticker.url;
      img.onload = () => {
        ctx.save();
        const x = canvas.width * sticker.x / 100;
        const y = canvas.height * sticker.y / 100;
        ctx.translate(x, y);
        ctx.rotate(sticker.rotation * Math.PI / 180);
        ctx.drawImage(
          img, 
          -sticker.size/2, -sticker.size/2, 
          sticker.size, sticker.size
        );
        ctx.restore();
      };
    });
  }, [stickers, image]);

  const saveToIrys = async () => {
    if (!memeRef.current) {
      alert("Please upload an image first");
      return;
    }
    
    setIsLoading(true);
    setQrCode("");
    setTransactionId("");

    try {
      const canvas = await html2canvas(memeRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true
      });
      
      const blob = await new Promise(resolve => 
        canvas.toBlob(resolve, 'image/png', 0.95)
      );

      if (!IrysClient) {
        throw new Error("Irys client not initialized");
      }

      const irys = new IrysClient({
        url: 'https://devnet.irys.xyz',
        token: 'matic',
        key: 'test-key',
      });

      const { id } = await irys.upload(blob, {
        tags: [{ name: 'Content-Type', value: 'image/png' }]
      });

      setTransactionId(id);
      const qr = await QRCode.toDataURL(`https://devnet.irys.xyz/tx/${id}`, {
        width: 200,
        margin: 2
      });
      setQrCode(qr);
      
    } catch (error) {
      console.error("Upload error:", error);
      const demoHash = `0x${Array.from({length: 64}, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`;
      setTransactionId(demoHash);
      
      const qr = await QRCode.toDataURL(`https://devnet.irys.xyz/tx/${demoHash}`, {
        width: 200,
        margin: 2
      });
      setQrCode(qr);
      alert("Test mode: Using mock data");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadMeme = async () => {
    if (!memeRef.current) return;
    const canvas = await html2canvas(memeRef.current, {
      scale: 2,
      useCORS: true
    });
    const link = document.createElement('a');
    link.download = 'nft-with-stickers.png';
    link.href = canvas.toDataURL('image/png', 0.95);
    link.click();
  };

  const downloadQR = () => {
    if (!qrCode) return;
    const link = document.createElement('a');
    link.download = 'meme-qr-code.png';
    link.href = qrCode;
    link.click();
  };

  return (
    <div className="app">
      <h1>Irys NFT Generator</h1>
      
      <div {...getRootProps()} className="upload-zone">
        <input {...getInputProps()} />
        {image ? (
          <img src={image} alt="NFT Base" className="preview-image" />
        ) : (
          <p>Drag and drop an image or click to select</p>
        )}
      </div>

      <div className="controls">
        <div className="text-controls">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter your NFT text..."
            disabled={!image}
          />
          <button 
            onClick={() => setText(generateRandomPhrase())} 
            disabled={!image}
            className="random-btn"
          >
            Random text
          </button>
          <button 
            onClick={addRandomStickers}
            disabled={!image}
            className="sticker-btn"
          >
            Add Irys Stickers
          </button>
        </div>
      </div>

      <div className="meme-container" ref={memeRef}>
        <div style={{ position: 'relative' }}>
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: 'auto',
              display: image ? 'block' : 'none'
            }}
          />
          {text && <div className="meme-text">{text}</div>}
        </div>
        
        <img 
          ref={baseImageRef}
          src={image || ''}
          alt="Base"
          style={{ display: 'none' }}
          onLoad={() => {
            if (canvasRef.current && baseImageRef.current) {
              const canvas = canvasRef.current;
              canvas.width = baseImageRef.current.naturalWidth;
              canvas.height = baseImageRef.current.naturalHeight;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(e.target, 0, 0);
               stickers.forEach(sticker => {
                const img = new Image();
                img.src = sticker.url;
                img.onload = () => {
                  ctx.save();
                  const x = canvas.width * sticker.x / 100;
                  const y = canvas.height * sticker.y / 100;
                  ctx.translate(x, y);
                  ctx.rotate(sticker.rotation * Math.PI / 180);
                  ctx.drawImage(
                    img, 
                    -sticker.size/2, -sticker.size/2, 
                    sticker.size, sticker.size
                  );
                  ctx.restore();
                };
              });
            }
          }}
        />
      </div>

      <div className="result-section">
        {qrCode && (
          <div className="qr-wrapper">
            <img src={qrCode} alt="Transaction QR" className="qr-code" />
            <button onClick={downloadQR} className="download-btn">
              Download QR
            </button>
          </div>
        )}
        
        {transactionId && (
          <div className="tx-info">
            <h3>Transaction ID:</h3>
            <code>{transactionId}</code>
            <p className="tx-link">
              <a 
                href={`https://devnet.irys.xyz/tx/${transactionId}`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                View on Irys (devnet)
              </a>
            </p>
          </div>
        )}
      </div>

      <div className="actions">
        <button 
          onClick={saveToIrys} 
          disabled={!image || isLoading}
          className={`confirm-btn ${isLoading ? 'loading' : ''}`}
        >
          {isLoading ? "Processing..." : "Upload to Irys (Test Mode)"}
        </button>
        <button 
          onClick={downloadMeme} 
          disabled={!image} 
          className="download-btn"
        >
          Download High-Quality NFT
        </button>
      </div>

      <style jsx>{`
        .app {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
        }
        
        .upload-zone {
          border: 2px dashed #6200ea;
          border-radius: 8px;
          padding: 30px;
          text-align: center;
          cursor: pointer;
          margin-bottom: 20px;
          transition: border-color 0.3s;
        }
        
        .upload-zone:hover {
          border-color: #3700b3;
        }
        
        .preview-image {
          max-width: 100%;
          max-height: 200px;
          display: block;
          margin: 0 auto;
        }
        
        .controls {
          margin: 20px 0;
        }
        
        .text-controls {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
          flex-wrap: wrap;
        }
        
        input[type="text"] {
          flex: 1;
          min-width: 200px;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
        }
        
        .random-btn, .sticker-btn {
          padding: 10px 15px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.3s;
        }
        
        .random-btn {
          background: #ff9800;
          color: white;
        }
        
        .sticker-btn {
          background: #4a2dbf;
          color: white;
        }
        
        .random-btn:hover {
          background: #f57c00;
        }
        
        .sticker-btn:hover {
          background: #3a1d9f;
        }
        
        .random-btn:disabled, .sticker-btn:disabled {
          background: #cccccc;
          cursor: not-allowed;
        }
        
        .meme-container {
          position: relative;
          margin: 20px auto;
          max-width: 600px;
          border: 1px solid #ddd;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .meme-text {
          position: absolute;
          bottom: 20px;
          left: 0;
          right: 0;
          color: white;
          font-size: 24px;
          font-weight: bold;
          text-shadow: 2px 2px 4px #000;
          padding: 10px;
          text-align: center;
          pointer-events: none;
        }
        
        .result-section {
          display: flex;
          gap: 30px;
          margin: 30px 0;
          padding: 20px;
          background: #f9f9f9;
          border-radius: 8px;
          align-items: flex-start;
        }
        
        .qr-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        
        .qr-code {
          width: 200px;
          height: 200px;
        }
        
        .tx-info {
          flex: 1;
        }
        
        .tx-info h3 {
          margin-top: 0;
          color: #6200ea;
        }
        
        code {
          display: block;
          word-break: break-all;
          background: #eee;
          padding: 10px;
          border-radius: 4px;
          margin: 10px 0;
          font-family: monospace;
        }
        
        .tx-link a {
          color: #6200ea;
          text-decoration: none;
        }
        
        .tx-link a:hover {
          text-decoration: underline;
        }
        
        .actions {
          display: flex;
          gap: 15px;
          margin-top: 20px;
        }
        
        .confirm-btn {
          background: #6200ea;
          color: white;
          flex: 1;
          padding: 12px 24px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          transition: background 0.3s;
        }
        
        .confirm-btn:hover {
          background: #3700b3;
        }
        
        .confirm-btn:disabled {
          background: #cccccc;
          cursor: not-allowed;
        }
        
        .confirm-btn.loading {
          background: #3700b3;
        }
        
        .download-btn {
          background: #4caf50;
          color: white;
          flex: 1;
          padding: 12px 24px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          transition: background 0.3s;
        }
        
        .download-btn:hover {
          background: #388e3c;
        }
        
        .download-btn:disabled {
          background: #cccccc;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}