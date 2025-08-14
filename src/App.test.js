import '@testing-library/jest-dom';
import React from "react";
import { render, screen } from "@testing-library/react";
import App from './App';

test("affichage du titre principal", () => {
  render(<App />);
  expect(screen.getByText(/WhisperChain, Whispers on the Blockchain/i)).toBeInTheDocument();
});

test("affichage du bouton Connect MetaMask", () => {
  render(<App />);
  expect(screen.getByText(/Connect MetaMask/i)).toBeInTheDocument();
});

test("affichage du sous-titre", () => {
  render(<App />);
  expect(screen.getByText(/Anonymous confessions, public comments/i)).toBeInTheDocument();
});
