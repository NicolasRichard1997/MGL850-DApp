# WhisperChain

**WhisperChain** is a decentralized confession wall built on the Ethereum Sepolia testnet. It lets you share anonymous thoughts, secrets, or regrets, tagged by theme, and allows others to leave public comments using pseudonymous nicknames.

### Live on the Ethereum Sepolia Testnet

Make sure to connect your MetaMask wallet to Sepolia to use the app.

## Features

* **Anonymous confessions** posted immutably to the blockchain
* **Public comments** on each confession
* **Custom nicknames** shown instead of wallet addresses
* **Categories**: Confession, Regret, Love, Hope, Random Thought
* Confessions are anonymous. Comments are pseudonymous.

---

## How to run

### 1. Install dependencies

```bash
npm install
```

### 2. Run the DApp locally

```bash
npm start
```

### 3. Requirements

* MetaMask installed
* Connected to Ethereum **Sepolia** testnet
* Some test ETH can be obtained via a Sepolia faucet

---

## 🛠 Tech Stack

* React
* Ethers.js
* Solidity (smart contract)
* Ethereum (Sepolia testnet)

---

## Smart Contract

The contract allows:

* `addPromise(message, category)`
* `addComment(promiseId, message)`
* `setNickname(name)`
* `getAllPromises()`
* `getComments(promiseId)`
* `getNickname(address)`

---

## Demo
https://youtu.be/CcLy3s6SKUU
