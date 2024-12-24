/// <reference types="chrome" />

import { createClerkClient } from "@clerk/chrome-extension/background"

const publishableKey = process.env.PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY

if (!publishableKey) {
  throw new Error(
    "Please add the PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY to the .env.development file"
  )
}

async function getToken() {
  const clerk = await createClerkClient({
    publishableKey
  })

  // If there is no valid session, then return null. Otherwise proceed.
  if (!clerk.session) {
    return null
  }

  // Return the user's session
  return await clerk.session?.getToken()
}

let storedAddress = ""
let storedTwitterLink = ""
let storedWebsiteLink = ""
let storedTokenData = {
  totalSupply: "",
  decimals: "",
  creationBlockNumber: "",
  symbol: "",
  deployerAddress: ""
}

chrome.commands?.onCommand.addListener((command) => {
  if (command === "open-extension") {
    chrome.action.openPopup()
  }
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  getToken()
    .then((token) => sendResponse({ token }))
    .catch((error) => {
      console.error("[Background service worker] Error:", JSON.stringify(error))
      // If there is no token then send a null response
      sendResponse({ token: null })
    })
  return true // REQUIRED: Indicates that the listener responds asynchronously.
})

chrome.runtime.onMessage.addListener((message: any, sender, sendResponse) => {
  if (message.action === "setAddress") {
    storedAddress = message.address
    sendResponse({ success: true })
  } else if (message.action === "getAddress") {
    sendResponse({ address: storedAddress })
  } else if (message.action === "linksFound") {
    storedTwitterLink = message.twitterLink || ""
    storedWebsiteLink = message.websiteLink || ""
    sendResponse({ success: true })
  } else if (message.action === "getTwitterLink") {
    sendResponse({ twitterLink: storedTwitterLink })
  } else if (message.action === "getWebsiteLink") {
    sendResponse({ websiteLink: storedWebsiteLink })
  } else if (message.action === "tokenDataFound") {
    // Store token data
    storedTokenData = {
      totalSupply: message.totalSupply || "",
      decimals: message.decimals || "",
      creationBlockNumber: message.creationBlockNumber || "",
      symbol: message.symbol || "",
      deployerAddress: message.deployerAddress || ""
    }
    sendResponse({ success: true })
  } else if (message.action === "getTokenData") {
    // Return stored token data
    sendResponse(storedTokenData)
  }
})

export {}
