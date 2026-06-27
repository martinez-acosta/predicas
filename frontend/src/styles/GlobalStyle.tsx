"use client";

import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
  }

  html {
    min-height: 100%;
    scroll-behavior: smooth;
    -webkit-text-size-adjust: 100%;
  }

  body {
    min-height: 100%;
    margin: 0;
    color: #18181B;
    background: #FAFAFA;
    font-family: var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 15px;
    line-height: 1.5;
    letter-spacing: -0.011em;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  h1, h2, h3, h4 {
    letter-spacing: -0.02em;
  }

  button, input, textarea, select {
    font: inherit;
    letter-spacing: inherit;
  }

  button {
    cursor: pointer;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  ::selection {
    background: #DBE6FF;
  }

  /* Scrollbars sutiles */
  * {
    scrollbar-width: thin;
    scrollbar-color: #D4D4D8 transparent;
  }
  *::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }
  *::-webkit-scrollbar-thumb {
    background: #D4D4D8;
    border: 3px solid transparent;
    background-clip: content-box;
    border-radius: 999px;
  }
  *::-webkit-scrollbar-thumb:hover {
    background: #B4B4BB;
    background-clip: content-box;
  }
`;
