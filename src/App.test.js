// App.test.js
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from './App';

// Mock ethers.js
jest.mock("ethers", () => {
  return {
    ethers: {
      BrowserProvider: jest.fn().mockImplementation(() => ({
        getSigner: jest.fn().mockResolvedValue({
          getAddress: jest.fn().mockResolvedValue("0x1234567890abcdef"),
        }),
        getNetwork: jest.fn().mockResolvedValue({ chainId: 11155111n }),
      })),
      Contract: jest.fn().mockImplementation(() => ({
        getNickname: jest.fn().mockResolvedValue("TestUser"),
        setNickname: jest.fn().mockResolvedValue({ wait: jest.fn().mockResolvedValue(true) }),
        addConfession: jest.fn().mockResolvedValue({ wait: jest.fn().mockResolvedValue(true) }),
        addComment: jest.fn().mockResolvedValue({ wait: jest.fn().mockResolvedValue(true) }),
        getAllConfessions: jest.fn().mockResolvedValue([
          { message: "Hello world", category: "Confession", timestamp: Math.floor(Date.now() / 1000) }
        ]),
        getComments: jest.fn().mockResolvedValue([])
      })),
    }
  };
});

// Mock window.ethereum
beforeEach(() => {
  window.ethereum = { request: jest.fn().mockResolvedValue(["0x1234567890abcdef"]) };
});

// Mock alert to prevent popups
beforeAll(() => {
  window.alert = jest.fn();
});

test("renders Connect MetaMask button if wallet not connected", () => {
  render(<App />);
  expect(screen.getByText(/Connect MetaMask/i)).toBeInTheDocument();
});

test("connects wallet and displays address", async () => {
  render(<App />);
  fireEvent.click(screen.getByText(/Connect MetaMask/i));

  await waitFor(() => screen.getByText(/Wallet connected/i));
  expect(screen.getByText(/0x1234...cdef/i)).toBeInTheDocument();
});

test("set nickname", async () => {
  render(<App />);
  fireEvent.click(screen.getByText(/Connect MetaMask/i));

  const input = await screen.findByPlaceholderText(/Choose a nickname/i);
  userEvent.type(input, "Tester");

  const saveBtn = screen.getByText(/Save Nickname/i);
  fireEvent.click(saveBtn);

  await waitFor(() => screen.getByText(/Nickname: Tester/i));
});

test("submit a confession", async () => {
  render(<App />);
  fireEvent.click(screen.getByText(/Connect MetaMask/i));

  const textarea = await screen.findByPlaceholderText(/Write your anonymous confession/i);
  userEvent.type(textarea, "This is a test confession");

  const submitBtn = screen.getByText(/Submit Anonymously/i);
  fireEvent.click(submitBtn);

  await waitFor(() => expect(window.alert).toHaveBeenCalledWith("✅ Confession recorded!"));
});
