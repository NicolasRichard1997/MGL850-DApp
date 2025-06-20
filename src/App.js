// src/App.js
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";

// Paste your contract ABI and address here
const CONTRACT_ADDRESS = "0x486f86DB9ab4E4BaF4e1287fcA32094B9C2C83b2";
const CONTRACT_ABI =
[
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_message",
				"type": "string"
			}
		],
		"name": "addPromise",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getAllPromises",
		"outputs": [
			{
				"components": [
					{
						"internalType": "address",
						"name": "user",
						"type": "address"
					},
					{
						"internalType": "string",
						"name": "message",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "timestamp",
						"type": "uint256"
					}
				],
				"internalType": "struct PromiseDApp.Promise[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "promises",
		"outputs": [
			{
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "message",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]

function App() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [promiseInput, setPromiseInput] = useState("");
  const [promises, setPromises] = useState([]);
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);

  // Connect to MetaMask
  const connectWallet = async () => {
    if (window.ethereum) {
      const ethProvider = new ethers.BrowserProvider(window.ethereum);
      const signer = await ethProvider.getSigner();
      const network = await ethProvider.getNetwork();
      if (network.chainId !== 11155111) {
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
      await tx.wait();
      setPromiseInput("");
      loadPromises();
    } catch (err) {
      console.error(err);
      alert("Transaction failed.");
    }
  };

  // Load all promises
  const loadPromises = async () => {
    if (!provider) return;
    const readContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    const result = await readContract.getAllPromises();
    const formatted = result.map((p) => ({
      user: p.user,
      message: p.message,
      date: new Date(p.timestamp * 1000).toLocaleString(),
    }));
    setPromises(formatted.reverse());
  };

  useEffect(() => {
    if (walletConnected) {
      loadPromises();
    }
  }, [walletConnected]);

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
