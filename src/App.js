// src/App.js
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

  // Connect to MetaMask
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask first.");
      return;
    }
    await window.ethereum.request({ method: "eth_requestAccounts" });
    const ethProvider = new ethers.BrowserProvider(window.ethereum);
    const signer = await ethProvider.getSigner();
    const network = await ethProvider.getNetwork();
    if (network.chainId !== 11155111n) {
      alert("Please connect to Sepolia testnet.");
      return;
    }
    const c = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    setWalletConnected(true);
    setProvider(ethProvider);
    setContract(c);
  };

  // Submit a promise
  const submitPromise = async () => {
    if (!contract || promiseInput.length === 0 || promiseInput.length > 140) return;
    try {
      const tx = await contract.addPromise(promiseInput, category);
      setPromiseInput("");
      setCategory("Confession");
      alert("Promesse soumise avec succès. Celle-ci sera visible lorsque la transaction sera confirmée.");
      await tx.wait();
      loadPromises();
    } catch (err) {
      console.error(err);
      alert("La transaction a échoué. Veuillez réessayer.");
    }
  };

  // Load all promises and comments
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
        return {
          index: idx,
          message: p.message,
          category: p.category,
          timestamp: Number(p.timestamp),
          date: new Date(Number(p.timestamp) * 1000).toLocaleString(),
          comments: rawComments.map(c => ({
            message: c.message,
            timestamp: Number(c.timestamp),
            date: new Date(Number(c.timestamp) * 1000).toLocaleString(),
          }))
        };
      }));

      setPromises(formatted.reverse());
    } catch (error) {
      console.warn("Failed to load promises:", error);
      setPromises([]);
    }
  };

  // Handle comment input change
  const handleCommentChange = (id, value) => {
    setCommentInputs(prev => ({ ...prev, [id]: value }));
  };

  // Submit a comment
  const submitComment = async (promiseId) => {
    const text = commentInputs[promiseId];
    if (!contract || !text || text.length === 0 || text.length > 200) return;
    try {
      const tx = await contract.addComment(promiseId, text);
      setCommentInputs(prev => ({ ...prev, [promiseId]: "" }));
      alert("Commentaire envoyé !");
      await tx.wait();
      loadPromises();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'envoi du commentaire.");
    }
  };

  useEffect(() => {
    loadPromises();
  }, []);

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif", maxWidth: "800px", margin: "0 auto" }}>
      <h1>🕯️ Confessions anonymes sur la Blockchain</h1>

      {!walletConnected ? (
        <button onClick={connectWallet}>Connecter MetaMask</button>
      ) : (
        <>
          <p>Portefeuille connecté ✅</p>

          <div style={{ padding: "0.5rem", background: "#fff3cd", border: "1px solid #ffeeba", marginBottom: "1rem" }}>
            🔐 <strong>Poste anonymement :</strong> utilise un portefeuille temporaire pour plus d’anonymat.
            <br />
            👉 <a href="https://www.burnerwallet.io/" target="_blank" rel="noopener noreferrer">Essayer Burner Wallet ↗</a>
          </div>

          <label htmlFor="category">Catégorie</label><br />
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ marginBottom: "1rem" }}
          >
            <option value="Confession">🕯️ Confession</option>
            <option value="Regret">😔 Regret</option>
            <option value="Love">❤️ Amour</option>
            <option value="Hope">🌱 Espoir</option>
            <option value="Random">🎲 Pensée aléatoire</option>
          </select>

          <br />
          <textarea
            rows="3"
            cols="50"
            placeholder="Écris ta promesse ou confession (max 140 caractères)"
            value={promiseInput}
            onChange={(e) => setPromiseInput(e.target.value)}
          />
          <br />
          <button onClick={submitPromise}>Soumettre anonymement</button>
        </>
      )}

      <hr />
      <h2>📖 Confessions publiques</h2>
      <ul style={{ listStyleType: "none", padding: 0 }}>
        {promises.map((p) => (
          <li key={p.index} style={{ marginBottom: "1.5rem", background: "#f9f9f9", padding: "1rem", borderRadius: "8px" }}>
            <strong>[{p.category}]</strong><br />
            <p style={{ margin: "0.5rem 0" }}>{p.message}</p>
            <small>{p.date}</small>

            <div style={{ marginTop: "1rem" }}>
              <input
                type="text"
                placeholder="Écrire un commentaire (max 200 caractères)"
                value={commentInputs[p.index] || ""}
                onChange={(e) => handleCommentChange(p.index, e.target.value)}
                style={{ width: "80%" }}
              />
              <button onClick={() => submitComment(p.index)}>Commenter</button>
            </div>

            {p.comments.length > 0 && (
              <ul style={{ marginTop: "1rem", paddingLeft: "1rem" }}>
                {p.comments.map((c, ci) => (
                  <li key={ci} style={{ marginBottom: "0.5rem" }}>
                    💬 {c.message} <br />
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

export default App;
