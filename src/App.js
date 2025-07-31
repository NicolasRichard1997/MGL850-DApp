import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './contracts/PromiseDApp';

function App() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [promiseInput, setPromiseInput] = useState("");
  const [category, setCategory] = useState("Confession");
  const [promises, setPromises] = useState([]);
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});
  const [nickname, setNickname] = useState("");
  const [nicknameSet, setNicknameSet] = useState(false);
  const [userAddress, setUserAddress] = useState("");

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask.");
        return;
      }

      await window.ethereum.request({ method: "eth_requestAccounts" });

      const ethProvider = new ethers.BrowserProvider(window.ethereum);
      const signer = await ethProvider.getSigner();
      const address = await signer.getAddress();
      const network = await ethProvider.getNetwork();

      if (network.chainId !== 11155111n) {
        alert("Please connect to the Sepolia network.");
        return;
      }

      const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const contractWithProvider = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, ethProvider);

      setUserAddress(address);
      setWalletConnected(true);
      setProvider(ethProvider);
      setContract(contractWithSigner);

      try {
        const existingNickname = await contractWithProvider.getNickname(address);
        if (existingNickname && existingNickname.length > 0) {
          setNickname(existingNickname);
          setNicknameSet(true);
        }
      } catch (err) {
        console.warn("Could not fetch nickname:", err);
      }
    } catch (err) {
      console.error("connectWallet error:", err);
      alert("Failed to connect wallet.");
    }
  };

  const handleSetNickname = async () => {
    if (!nickname || nickname.trim().length === 0) {
      alert("Nickname cannot be empty.");
      return;
    }
    if (!contract) {
      alert("Contract is not connected.");
      return;
    }

    try {
      const cleanNickname = nickname.trim();
      if (cleanNickname.length > 20) {
        alert("Nickname is too long (max 20 characters).");
        return;
      }

      const tx = await contract.setNickname(cleanNickname, { gasLimit: 100_000 });
      alert("⛏️ Nickname transaction submitted. It will appear once the transaction is confirmed...");
      await tx.wait();
      alert("✅ Nickname saved!");
      setNicknameSet(true);
    } catch (err) {
      console.error(err);
      alert("Failed to save nickname.");
    }
  };

  const submitPromise = async () => {
    if (!contract || promiseInput.length === 0 || promiseInput.length > 140) return;

    try {
      const tx = await contract.addPromise(promiseInput, category);
      alert("⛏️ Promise submitted! It will appear once the transaction is confirmed...");
      await tx.wait();
      alert("✅ Promise recorded!");
      setPromiseInput("");
      setCategory("Confession");
      loadPromises();
    } catch (err) {
      console.error(err);
      alert("Transaction failed.");
    }
  };

  const loadPromises = async () => {
    try {
      const ethProvider = new ethers.BrowserProvider(window.ethereum || ethers.getDefaultProvider("sepolia"));
      const readContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, ethProvider);

      const result = await readContract.getAllPromises();
      if (!result || result.length === 0) {
        setPromises([]);
        return;
      }

      const formatted = await Promise.all(result.map(async (p, idx) => {
        const rawComments = await readContract.getComments(idx);
        const commentData = await Promise.all(rawComments.map(async c => {
          let userNickname = "🕵️ Anonymous";
          try {
            const fetchedNickname = await readContract.getNickname(c.user);
            if (fetchedNickname && fetchedNickname.length > 0) {
              userNickname = fetchedNickname;
            }
          } catch (e) {
            console.warn(`No nickname for ${c.user}`);
          }

          return {
            message: c.message,
            timestamp: Number(c.timestamp),
            date: new Date(Number(c.timestamp) * 1000).toLocaleString(),
            nickname: userNickname
          };
        }));

        return {
          index: idx,
          message: p.message,
          category: p.category,
          timestamp: Number(p.timestamp),
          date: new Date(Number(p.timestamp) * 1000).toLocaleString(),
          comments: commentData
        };
      }));

      setPromises(formatted.reverse());
    } catch (error) {
      console.warn("Load error:", error);
      setPromises([]);
    }
  };

  const handleCommentChange = (id, value) => {
    setCommentInputs(prev => ({ ...prev, [id]: value }));
  };

  const submitComment = async (promiseId) => {
    const text = commentInputs[promiseId];
    if (!contract || !text || text.length === 0 || text.length > 200) return;

    try {
      const tx = await contract.addComment(promiseId, text);
      alert("⛏️ Comment submitted! It will appear once the transaction is confirmed...");
      await tx.wait();
      alert("✅ Comment posted!");
      setCommentInputs(prev => ({ ...prev, [promiseId]: "" }));
      loadPromises();
    } catch (err) {
      console.error(err);
      alert("Failed to submit comment.");
    }
  };

  useEffect(() => {
    loadPromises();
  }, []);

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif", maxWidth: "850px", margin: "0 auto", lineHeight: "1.6" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}> WhisperChain, Whispers on the Blockchain</h1>

      {!walletConnected ? (
        <button onClick={connectWallet} style={buttonStyle}>Connect MetaMask</button>
      ) : (
        <>
          <p>🟢 Wallet connected: <code>{userAddress.slice(0, 6)}...{userAddress.slice(-4)}</code></p>

          {!nicknameSet ? (
            <div style={{ marginBottom: "1rem" }}>
              <input
                type="text"
                placeholder="Choose a nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                style={inputStyle}
              />
              <button onClick={handleSetNickname} style={buttonStyle}>Save Nickname</button>
            </div>
          ) : (
            <p>👤 Nickname: <strong>{nickname}</strong></p>
          )}

          <div style={{ margin: "1rem 0" }}>
            <label htmlFor="category">Category</label><br />
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ ...inputStyle, width: "100%", marginTop: "0.25rem" }}
            >
              <option value="Confession">🕯️ Confession</option>
              <option value="Regret">😔 Regret</option>
              <option value="Love">❤️ Love</option>
              <option value="Hope">🌱 Hope</option>
              <option value="Random">🎲 Random Thought</option>
            </select>
          </div>

          <textarea
            rows="4"
            cols="50"
            placeholder="Write your anonymous promise or confession (max 140 chars)"
            value={promiseInput}
            onChange={(e) => setPromiseInput(e.target.value)}
            style={{ ...inputStyle, width: "100%", resize: "none" }}
          />
          <br />
          <button onClick={submitPromise} style={buttonStyle}>Submit Anonymously</button>
        </>
      )}

      <hr style={{ margin: "2rem 0" }} />
      <h4 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Anonymous confessions, public comments</h4>

      <p style={{ fontStyle: "italic", marginBottom: "2rem", color: "#555" }}>
        <strong>WhisperChain</strong> is a decentralized app (DApp) that lets you share anonymous confessions recorded immutably on the Ethereum blockchain. 
        Your confession is <strong>anonymous</strong> while your comments are <strong>pseudonymous</strong>, meaning that only your chosen nickname is ever shown. 
        Others can read and leave <strong>public comments</strong> on your post, creating a shared space for empathy, support, or reflection.
        You can also tag your confession with a category to give it context, whether it's a heartfelt regret, a secret hope, or just a random thought.
      </p>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {promises.map((p) => (
          <li key={p.index} style={cardStyle}>
            <strong>[{p.category}]</strong><br />
            <p style={{ margin: "0.5rem 0" }}>{p.message}</p>
            <small>{p.date}</small>

            <div style={{ marginTop: "1rem" }}>
              <input
                type="text"
                placeholder="Write a comment (max 200 characters)"
                value={commentInputs[p.index] || ""}
                onChange={(e) => handleCommentChange(p.index, e.target.value)}
                style={{ ...inputStyle, width: "75%" }}
              />
              <button onClick={() => submitComment(p.index)} style={{ ...buttonStyle, marginLeft: "0.5rem" }}>Comment</button>
            </div>

            {p.comments.length > 0 && (
              <ul style={{ marginTop: "1rem", paddingLeft: "1rem" }}>
                {p.comments.map((c, ci) => (
                  <li key={ci} style={{ marginBottom: "0.5rem" }}>
                    💬 <strong>{c.nickname}</strong>: {c.message}<br />
                    <small>{c.date}</small>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

const inputStyle = {
  padding: "0.5rem",
  borderRadius: "4px",
  border: "1px solid #ccc",
  fontSize: "1rem",
  marginBottom: "0.5rem"
};

const buttonStyle = {
  padding: "0.5rem 1rem",
  backgroundColor: "#1e88e5",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontWeight: "bold"
};

const cardStyle = {
  background: "#f5f5f5",
  padding: "1rem",
  borderRadius: "8px",
  marginBottom: "1.5rem",
  boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
};

export default App;
