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
        alert("Veuillez installer MetaMask.");
        return;
      }

      await window.ethereum.request({ method: "eth_requestAccounts" });

      const ethProvider = new ethers.BrowserProvider(window.ethereum);
      const signer = await ethProvider.getSigner();
      const address = await signer.getAddress();
      const network = await ethProvider.getNetwork();

      if (network.chainId !== 11155111n) {
        alert("Veuillez vous connecter au réseau Sepolia.");
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
        console.warn("Impossible de récupérer le pseudonyme:", err);
      }
    } catch (err) {
      console.error("Erreur dans connectWallet:", err);
      alert("Erreur de connexion au portefeuille.");
    }
  };

  const handleSetNickname = async () => {
  if (!nickname || nickname.trim().length === 0) {
    alert("Le pseudonyme ne peut pas être vide.");
    return;
  }
  if (!contract) {
    alert("Contrat non connecté.");
    return;
  }

  try {
    const cleanNickname = nickname.trim();

    if (cleanNickname.length > 20) {
      alert("Le pseudonyme est trop long (max 20 caractères).");
      return;
    }
    
    console.log("Setting nickname:", nickname);

    const tx = await contract.setNickname(cleanNickname, { gasLimit: 100_000 });
    await tx.wait();
    alert("Pseudonyme enregistré !");
    setNicknameSet(true);
  } catch (err) {
    console.error(err);
    alert("Erreur lors de l'enregistrement du pseudonyme.");
  }
};

  const submitPromise = async () => {
    if (!contract || promiseInput.length === 0 || promiseInput.length > 140) return;

    try {
      const tx = await contract.addPromise(promiseInput, category);
      await tx.wait();
      alert("Promesse soumise !");
      setPromiseInput("");
      setCategory("Confession");
      loadPromises();
    } catch (err) {
      console.error(err);
      alert("La transaction a échoué.");
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
          let userNickname = "🕵️ Anonyme";
          try {
            const fetchedNickname = await readContract.getNickname(c.user);
            if (fetchedNickname && fetchedNickname.length > 0) {
              userNickname = fetchedNickname;
            }
          } catch (e) {
            console.warn(`Nickname not set for ${c.user}`);
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
      console.warn("Erreur lors du chargement :", error);
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
      await tx.wait();
      setCommentInputs(prev => ({ ...prev, [promiseId]: "" }));
      alert("Commentaire envoyé !");
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

          {!nicknameSet ? (
            <div>
              <input
                type="text"
                placeholder="Choisis un pseudonyme"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
              <button onClick={handleSetNickname}>Enregistrer pseudonyme</button>
            </div>
          ) : (
            <p>Pseudonyme: <strong>{nickname}</strong></p>
          )}

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
                    💬 <strong>{c.nickname}</strong>: {c.message} <br />
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
