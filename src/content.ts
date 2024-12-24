// content.ts
import type { PlasmoCSConfig } from "plasmo"

import "../assets/orangeTheme.css"

// **Plasmo Configuration**
export const config: PlasmoCSConfig = {
  matches: ["https://neo.bullx.io/*"],
  run_at: "document_idle" 
}

console.log("Twizzy Content Loaded.")

// **Utility Functions**

/**
 * Extract the 'address' query parameter from the current URL.
 * @returns The address string if present, otherwise null.
 */
const getAddressFromUrl = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get("address")
}

/**
 * Handle URL changes by extracting the address and sending it to the background script.
 */
const handleUrlChange = (): void => {
  const address = getAddressFromUrl()
  if (address) {
    console.log(`Token Address: ${address}`)
    chrome.runtime.sendMessage(
      { action: "setAddress", address },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error(
            "Failed to send address:",
            chrome.runtime.lastError.message
          )
        } else {
          console.log("Address sent successfully:", response)
        }
      }
    )
  } else {
    console.warn("Address parameter not found in the URL.")
  }
}

/**
 * Inject an external script into the page.
 */
const injectScript = async (): Promise<void> => {
  const script = document.createElement("script")
  script.src = chrome.runtime.getURL("assets/injectedScript.js")
  script.onload = () => {
    // Optionally remove the script after it has been executed
    script.remove()
  }
  ;(document.head || document.documentElement).appendChild(script)
}

/**
 * Initialize a MutationObserver to watch for URL changes.
 */
const initUrlObserver = (): void => {
  let lastUrl = window.location.href

  const observer = new MutationObserver(() => {
    const currentUrl = window.location.href
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl
      console.log("URL changed to:", currentUrl)
      handleUrlChange()
    }
  })

  observer.observe(document.body, { childList: true, subtree: true })

  console.log("URL Observer initialized.")
}

/**
 * Apply theme based on active classes and predefined priorities.
 */
const applyTheme = (): void => {
  const root = document.documentElement

  // Disconnect observer to prevent recursion
  themeObserver.disconnect()

  // Check for other themes
  const activeOtherThemes = otherThemes.filter((theme) =>
    root.classList.contains(theme)
  )

  if (activeOtherThemes.length > 0) {
    // Remove "twizzy" if present
    if (root.classList.contains("twizzy")) {
      root.classList.remove("twizzy")
    }

    // Set data-theme to highest priority active theme
    const highestPriorityTheme = themePriority.find((theme) =>
      activeOtherThemes.includes(theme)
    )
    if (highestPriorityTheme) {
      root.setAttribute("data-theme", highestPriorityTheme)
    }

    // Reconnect observer
    themeObserver.observe(rootElement, {
      attributes: true,
      attributeFilter: ["class"]
    })

    return // Exit early since another theme is active
  }

  // Handle "theme1"
  if (root.classList.contains("theme1")) {
    // Replace "theme1" with "twizzy"
    root.classList.remove("theme1")
    root.classList.add("twizzy")

    // Set data-theme to "twizzy"
    root.setAttribute("data-theme", "twizzy")

    // Reconnect observer
    themeObserver.observe(rootElement, {
      attributes: true,
      attributeFilter: ["class"]
    })

    return
  }

  // No specific theme detected

  // Reconnect observer
  themeObserver.observe(rootElement, {
    attributes: true,
    attributeFilter: ["class"]
  })
}

/**
 * Debounced version of applyTheme to prevent rapid calls.
 */
let applyThemeTimeout: number
const applyThemeDebounced = (): void => {
  clearTimeout(applyThemeTimeout)
  applyThemeTimeout = window.setTimeout(applyTheme, 100)
}

/**
 * Update the target elements on the homepage.
 */
const updateTargetElement = (): void => {
  const isHomePage =
    window.location.origin === "https://neo.bullx.io" &&
    window.location.pathname === "/"
  if (!isHomePage) {
    return
  }

  // Check for any other theme
  const hasOtherTheme = otherThemes.some((theme) =>
    rootElement.classList.contains(theme)
  )
  if (hasOtherTheme) {
    return
  }

  if (!rootElement.classList.contains("twizzy")) {
    return
  }

  const targetContainer = document.querySelector(
    "div.flex.gap-x-1.items-center"
  )
  if (!targetContainer) {
    return
  }

  // Update the span text and style
  const targetSpan = targetContainer.querySelector(
    "span.text-base.font-semibold.whitespace-nowrap"
  ) as HTMLSpanElement | null
  if (targetSpan) {
    if (targetSpan.textContent?.trim() !== "Vision") {
      targetSpan.textContent = "Vision"
      targetSpan.style.color = "orange"
    }
  }

  // Replace the SVG with an image
  const targetSvg = targetContainer.querySelector("svg")
  if (targetSvg) {
    const newImg = document.createElement("img")
    const imgPath = chrome.runtime.getURL("assets/twizzy.png")

    newImg.src = imgPath
    newImg.alt = "twizzy Icon"
    newImg.className = targetSvg.className

    // Assign styles using cssText
    newImg.style.cssText = `
      height: 10em;
      aspect-ratio: 512 / 178;
      vertical-align: middle;
    `

    // Replace SVG with the new image
    targetSvg.replaceWith(newImg)
  }
}

/**
 * Update the text and style of specific buttons.
 */
const updateButtonText = (): void => {
  const button = document.querySelector(
    'button[jf-ext-button-ct="aa"]'
  ) as HTMLButtonElement | null
  if (!button) {
    return
  }

  const targetSpan = button.querySelector(
    "span.text-base.font-semibold.whitespace-nowrap"
  ) as HTMLSpanElement | null
  if (targetSpan) {
    if (targetSpan.textContent?.trim() !== "Twizzy") {
      targetSpan.textContent = "Twizzy"
      targetSpan.style.color = "purple" // Optional: Change color as desired
    }
  }
}

/**
 * Simulate a click on the "alerts", "search", or specific link button based on keyboard shortcuts.
 */
const handleKeydown = (event: KeyboardEvent): void => {
  // Handle Shift+A
  if (event.shiftKey && event.key.toLowerCase() === "a") {
    event.preventDefault()
    const button = document.querySelector(
      'button[jf-ext-button-ct^="alerts"]'
    ) as HTMLButtonElement | null
    if (button) {
      button.click()
    }
  }

  // Handle Shift+S
  if (event.shiftKey && event.key.toLowerCase() === "s") {
    event.preventDefault()
    const button = document.querySelector(
      'button[jf-ext-button-ct^="search"]'
    ) as HTMLButtonElement | null
    if (button) {
      button.click()
    }
  }

  // Handle Shift+D
  if (event.shiftKey && event.key.toLowerCase() === "d") {
    event.preventDefault()
    const button = document.querySelector(
      'a[href="/"].flex.flex-row.group.rounded-lg.text-start.items-center.bg-transparent.border-none.outline-none.hover\\:cursor-pointer.transition-all.hover\\:scale-105.hover\\:bg-grey-700.min-w-\\[32px\\]'
    ) as HTMLAnchorElement | null
    if (button) {
      button.click()
    }
  }
}

/**
 * Simulate a click on the "5M" element in the terminal.
 */
const openVol = (): void => {
  const isTerminal =
    window.location.origin === "https://neo.bullx.io" &&
    window.location.pathname === "/terminal" &&
    window.location.search.includes("chainId=1399811149") &&
    window.location.search.includes("address=")

  if (!isTerminal) {
    return
  }

  // Improved selector: Find the div that contains the "5M" text
  const fiveMElement = Array.from(
    document.querySelectorAll(".grid.grid-cols-4.z-10.relative > div")
  ).find(
    (div) =>
      div.querySelector("h3.text-xs.font-medium")?.textContent.trim() === "5M"
  ) as HTMLElement | null

  if (fiveMElement) {
    // Check if it's already open by verifying the presence of specific classes
    const isOpen = fiveMElement.classList.contains("!border-b-green-700")
    if (!isOpen) {
      // Simulate a click event to trigger the open state
      ;(fiveMElement as HTMLElement).click()
    }
  }
}

/**
 * Initialize a MutationObserver to watch for changes in the target grid for openVol.
 */
const initOpenVolObserver = (): void => {
  const targetNode = document.querySelector(".grid.grid-cols-4.z-10.relative")
  if (!targetNode) {
    setTimeout(initOpenVolObserver, 500)
    return
  }

  const config: MutationObserverInit = { childList: true, subtree: true }
  const callback: MutationCallback = (mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type === "childList") {
        openVol()
      }
    }
  }

  const observer = new MutationObserver(callback)
  observer.observe(targetNode, config)
}

/**
 * Observe and update the button text dynamically.
 */
const observeButtonChanges = (): void => {
  const targetNode = document.body
  const config: MutationObserverInit = { childList: true, subtree: true }

  const callback: MutationCallback = (mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type === "childList") {
        // Attempt to update the button text whenever new nodes are added
        updateButtonText()
      }
    }
  }

  const observer = new MutationObserver(callback)
  observer.observe(targetNode, config)
}

/**
 * Observe the DOM for dynamic changes to update target elements, button text, and openVol.
 */
const observeDomChanges = (): void => {
  const domObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        updateTargetElement()
        updateButtonText()
        openVol()
      }
    }
  })

  domObserver.observe(document.body, {
    childList: true,
    subtree: true
  })
}

// **Theme Management Variables**
const otherThemes: string[] = ["theme2", "theme3"] // Extend this list as needed
const themePriority: string[] = ["theme3", "theme2"] // Higher index = higher priority
const rootElement = document.documentElement

// Initialize a MutationObserver for theme changes
const themeObserver = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === "attributes" && mutation.attributeName === "class") {
      applyThemeDebounced()
    }
  }
})

// **Message Handling**

/**
 * Handle messages from the injected script.
 * @param event The message event.
 */
const handleMessage = (event: MessageEvent): void => {
  if (!event.source) return

  if (event.data.type === "tokenDataFound") {
    console.log("Token Data Received:", event.data)
    // Extract token data fields from event.data
    const { totalSupply, decimals, creationBlockNumber, symbol, deployerAddress } = event.data

    // Validate that all required fields are present and have correct types
    if (
      totalSupply &&
      typeof decimals === "number" &&
      typeof creationBlockNumber === "number" &&
      symbol &&
      deployerAddress
    ) {
      // Send the token data with fields at the top level
      chrome.runtime.sendMessage(
        { action: "tokenDataFound", totalSupply, decimals, creationBlockNumber, symbol, deployerAddress },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error(
              "Failed to send token data:",
              chrome.runtime.lastError.message
            )
          } else {
            console.log("Token data sent successfully:", response)
          }
        }
      )
    } else {
      console.error("Incomplete or invalid token data received:", event.data)
    }
  }

  if (event.data.type === "linksFound") {
    console.log("Links Data Received:", event.data)
    // Extract twitterLink and websiteLink from event.data
    const { twitterLink, websiteLink } = event.data

    chrome.runtime.sendMessage(
      { action: "linksFound", twitterLink, websiteLink },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error(
            "Failed to send links data:",
            chrome.runtime.lastError.message
          )
        } else {
          console.log("Links data sent successfully:", response)
        }
      }
    )
  }
}

/**
 * Initialize the content script functionalities.
 */
const initialize = (): void => {
  console.log("Twizzy: Initializing content script functionalities.")

  // Inject external script
  injectScript()

  // Handle the URL when the content script first runs
  handleUrlChange()

  // Initialize the observer to handle subsequent URL changes
  initUrlObserver()

  // Theme Management
  applyTheme()
  updateTargetElement()
  updateButtonText()
  openVol()

  // Start observing the root element for attribute changes (theme changes)
  themeObserver.observe(rootElement, {
    attributes: true,
    attributeFilter: ["class"]
  })

  // Observe the DOM for dynamic changes to update target elements, button text, and openVol
  observeDomChanges()

  // Observe button changes to dynamically update button text
  observeButtonChanges()

  // Initialize the openVol observer
  initOpenVolObserver()

  // Add keyboard event listener
  document.addEventListener("keydown", handleKeydown, false)
}

/**
 * Start observing messages from the injected script.
 */
const setupMessageListener = (): void => {
  window.addEventListener("message", handleMessage, false)
}

// **Initialization**
initialize()
setupMessageListener()
