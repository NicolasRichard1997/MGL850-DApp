// src/App.js
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './contracts/PromiseDApp';

function App() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [promiseInput, setPromiseInput] = useState("");
  const [promises, setPromises] = useState([]);
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);

  // Connect to MetaMask
  const connectWallet = async () => {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    if (window.ethereum) {
      const ethProvider = new ethers.BrowserProvider(window.ethereum);
      const signer = await ethProvider.getSigner();
      const network = await ethProvider.getNetwork();
      console.log("Current network chainId:", network.chainId);
      if (network.chainId !== 11155111n) {
        alert("Please connect to Sepolia testnet.");
        return;
      }
      const c = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      setWalletConnected(true);
      setProvider(ethProvider);
      setContract(c);
    } else {
      alert("Install MetaMask first.");
    }
  };

  // Submit a promise
  const submitPromise = async () => {
    if (!contract || promiseInput.length === 0 || promiseInput.length > 140) return;
    try {
      const tx = await contract.addPromise(promiseInput);

      // ✅ Clear input and show alert immediately after sending transaction
      setPromiseInput("");
      alert("Promesse soumise avec succès. Celle-ci sera visible lorsque la transaction sera confirmée.");

      // ✅ Wait for confirmation, then reload
      await tx.wait();
      loadPromises();
    } catch (err) {
      console.error(err);
      alert("La transaction a échoué. Veuillez réessayer.");
    }
  };

  // Load all promises
  const loadPromises = async () => {
    try {
      const ethProvider = new ethers.BrowserProvider(window.ethereum || ethers.getDefaultProvider("sepolia"));
      const readContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, ethProvider);

      const result = await readContract.getAllPromises();
      if (!result || result.length === 0) {
        setPromises([]);
        return;
      }

      const formatted = result.map(p => ({
        user: p.user,
        message: p.message,
        timestamp: Number(p.timestamp),
        date: new Date(Number(p.timestamp) * 1000).toLocaleString(),
      }));

      setPromises(formatted.reverse());
    } catch (error) {
      console.warn("Failed to load promises, possibly empty array:", error);
      setPromises([]);
    }
  };

  useEffect(() => {
    loadPromises();
  }, []);


  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>📜 Promesses sur la Blockchain</h1>

      {!walletConnected ? (
        <button onClick={connectWallet}>Connecter MetaMask</button>
      ) : (
        <>
          <p>Portefeuille connecté ✅</p>
          <textarea
            rows="3"
            cols="50"
            placeholder="Écris ta promesse (max 140 caractères)"
            value={promiseInput}
            onChange={(e) => setPromiseInput(e.target.value)}
          />
          <br />
          <button onClick={submitPromise}>Soumettre la promesse</button>
        </>
      )}

      <hr />
      <h2>📖 Promesses publiques</h2>
      <ul>
        {promises.map((p, i) => (
          <li key={i}>
            <strong>{p.message}</strong> <br />
            <span>{p.user.slice(0, 6)}...{p.user.slice(-4)} – {p.date}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
