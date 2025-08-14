import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './contracts/WhisperChainDApp';

function App() {
  const [walletConnected, setWalletConnected] = useState(false); // Si le portefeuille est connecté
  const [confessionInput, setConfessionInput] = useState("");    // Texte de la confession
  const [category, setCategory] = useState("Confession");        // Catégorie sélectionnée (Par défaut à Confession)
  const [confessions, setConfessions] = useState([]);            // Liste des confessions
  const [provider, setProvider] = useState(null);                // Provider Ethereum
  const [contract, setContract] = useState(null);                // Contrat Ethereum
  const [commentInputs, setCommentInputs] = useState({});        // Texte des commentaires par confession
  const [nickname, setNickname] = useState("");                  // Pseudo de l'utilisateur
  const [nicknameSet, setNicknameSet] = useState(false);         // Si le pseudo est défini
  const [userAddress, setUserAddress] = useState("");            // Adresse de l'utilisateur

  // Connexion du portefeuille MetaMask
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

      setUserAddress(address);
      setWalletConnected(true);
      setProvider(ethProvider);
      setContract(contractWithSigner);

      // Vérifie si l'utilisateur a déjà un pseudonyme
      try {
        const existingNickname = await contractWithSigner.getNickname(address);
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

  // Définir le pseudonyme de l'utilisateur
  const handleSetNickname = async () => {
    if (!nickname.trim()) {
      alert("Nickname cannot be empty.");
      return;
    }
    if (!contract) return alert("Contract not connected.");

    try {
      const cleanNickname = nickname.trim();
      if (cleanNickname.length > 20) {
        alert("Nickname is too long (max 20 chars).");
        return;
      }

      const tx = await contract.setNickname(cleanNickname);
      alert("⛏️ Transaction submitted, waiting for confirmation...");
      await tx.wait();
      alert("✅ Nickname saved!");
      setNicknameSet(true);
    } catch (err) {
      console.error(err);
      alert("Failed to save nickname.");
    }
  };

  // Soumettre une nouvelle confession
  const submitConfession = async () => {
    if (!contract || confessionInput.length === 0 || confessionInput.length > 140) return;

    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const tx = await contract.addConfession(confessionInput, category, timestamp);
      alert("⛏️ Confession submitted! Waiting for confirmation...");
      await tx.wait();
      alert("✅ Confession recorded!");
      setConfessionInput("");
      setCategory("Confession");
      loadConfessions(); // Recharge les confessions
    } catch (err) {
      console.error(err);
      alert("Transaction failed.");
    }
  };

  // Charger toutes les confessions depuis le contrat
  const loadConfessions = async () => {
    try {
      if (!window.ethereum) return;
      const ethProvider = new ethers.BrowserProvider(window.ethereum);
      const readContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, ethProvider);

      const result = await readContract.getAllConfessions();
      if (!result || result.length === 0) {
        setConfessions([]);
        return;
      }

      // Formate les confessions et les commentaires
      const formatted = await Promise.all(result.map(async (c, idx) => {
        const rawComments = await readContract.getComments(idx);
        const commentData = await Promise.all(rawComments.map(async cm => {
          let userNickname = "🕵️ Anonymous";
          try {
            const fetchedNickname = await readContract.getNickname(cm.user);
            if (fetchedNickname && fetchedNickname.length > 0) userNickname = fetchedNickname;
          } catch {}

          return {
            message: cm.message,
            timestamp: Number(cm.timestamp),
            date: new Date(Number(cm.timestamp) * 1000).toLocaleString(),
            nickname: userNickname
          };
        }));

        return {
          index: idx,
          message: c.message,
          category: c.category,
          timestamp: Number(c.timestamp),
          date: new Date(Number(c.timestamp) * 1000).toLocaleString(),
          comments: commentData
        };
      }));

      setConfessions(formatted.reverse());
    } catch (err) {
      console.warn(err);
      setConfessions([]);
    }
  };

  // Met à jour le texte d'un commentaire pour une confession spécifique
  const handleCommentChange = (id, value) => {
    setCommentInputs(prev => ({ ...prev, [id]: value }));
  };

  // Soumettre un commentaire sous une confession
  const submitComment = async (confessionId) => {
    const text = commentInputs[confessionId];
    if (!contract || !text || text.length === 0 || text.length > 200) return;

    try {
      const tx = await contract.addComment(confessionId, text);
      alert("⛏️ Comment submitted! Waiting for confirmation...");
      await tx.wait();
      alert("✅ Comment posted!");
      setCommentInputs(prev => ({ ...prev, [confessionId]: "" }));
      loadConfessions(); 
    } catch (err) {
      console.error(err);
      alert("Failed to submit comment.");
    }
  };

  // Charger les confessions au démarrage de la page
  useEffect(() => {
    loadConfessions();
  }, []);

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif", maxWidth: "850px", margin: "0 auto", lineHeight: "1.6" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>WhisperChain, Whispers on the Blockchain</h1>

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
          ) : <p>👤 Nickname: <strong>{nickname}</strong></p>}

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
            placeholder="Write your anonymous confession (max 140 chars)"
            value={confessionInput}
            onChange={(e) => setConfessionInput(e.target.value)}
            style={{ ...inputStyle, width: "100%", resize: "none" }}
          />
          <br />
          <button onClick={submitConfession} style={buttonStyle}>Submit Anonymously</button>
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
        {confessions.map((c) => (
          <li key={c.index} style={cardStyle}>
            <strong>[{c.category}]</strong><br />
            <p style={{ margin: "0.5rem 0" }}>{c.message}</p>
            <small>{c.date}</small>

            <div style={{ marginTop: "1rem" }}>
              <input
                type="text"
                placeholder="Write a comment (max 200 characters)"
                value={commentInputs[c.index] || ""}
                onChange={(e) => handleCommentChange(c.index, e.target.value)}
                style={{ ...inputStyle, width: "75%" }}
              />
              <button onClick={() => submitComment(c.index)} style={{ ...buttonStyle, marginLeft: "0.5rem" }}>Comment</button>
            </div>

            {c.comments.length > 0 && (
              <ul style={{ marginTop: "1rem", paddingLeft: "1rem" }}>
                {c.comments.map((cm, ci) => (
                  <li key={ci} style={{ marginBottom: "0.5rem" }}>
                    💬 <strong>{cm.nickname}</strong>: {cm.message}<br />
                    <small>{cm.date}</small>
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
