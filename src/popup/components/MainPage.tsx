import { Clipboard, ExternalLink, Search } from "lucide-react"
import React, { useEffect, useState } from "react"
import iconUrl from "url:/assets/icon.png"

import { calculateDomainAge, getTimeDifference, sanitizeDomain } from "../../utils/utils"

const MainPage = () => {
  const [bundle, setBundle] = useState("Loading...")
  const [bundleCheckResult, setBundleCheckResult] = useState("")
  const [loadingBundleCheck, setLoadingBundleCheck] = useState(false)

  const [twitterLink, setTwitterLink] = useState("Loading...")
  const [websiteLink, setWebsiteLink] = useState("Loading...")

  const [dexStatus, setDexStatus] = useState("")
  const [loadingDexStatus, setLoadingDexStatus] = useState(false)

  const [twitterHistory, setTwitterHistory] = useState<string | null>(null)
  const [loadingTwitterHistory, setLoadingTwitterHistory] = useState(false)

  const [websiteAge, setWebsiteAge] = useState<string | null>(null)
  const [loadingWebsiteAge, setLoadingWebsiteAge] = useState(false)

  const [tokenData, setTokenData] = useState<{
    totalSupply: string
    decimals: number
    creationBlockNumber: number
    symbol: string
    deployerAddress: string
  } | null>(null)

  // Fetch data from background script once on mount
  useEffect(() => {
    chrome.runtime.sendMessage({ action: "getAddress" }, (response) => {
      setBundle(response?.address || "Address not found")
    })

    chrome.runtime.sendMessage({ action: "getTwitterLink" }, (response) => {
      setTwitterLink(response?.twitterLink || "Twitter link not found")
    })

    chrome.runtime.sendMessage({ action: "getWebsiteLink" }, (response) => {
      setWebsiteLink(response?.websiteLink || "Website link not found")
    })

    chrome.runtime.sendMessage({ action: "getTokenData" }, (response) => {
      if (
        response?.totalSupply &&
        response?.decimals &&
        response?.creationBlockNumber
      ) {
        setTokenData({
          totalSupply: response.totalSupply,
          decimals: response.decimals,
          creationBlockNumber: response.creationBlockNumber,
          symbol: response.symbol,
          deployerAddress: response.deployerAddress
        })
      }
    })
  }, [])

  // Handlers
  const handleBundleCheck = async () => {
    if (!tokenData) {
      setBundleCheckResult("Token data not available.")
      return
    }

    setLoadingBundleCheck(true)

    try {
      // Request the token from the background script
      chrome.runtime.sendMessage({ action: "getToken" }, async (response) => {
        if (chrome.runtime.lastError || !response?.token) {
          console.error("Failed to retrieve token:", chrome.runtime.lastError)
          setBundleCheckResult("Failed to retrieve authentication token.")
          setLoadingBundleCheck(false)
          return
        }

        const token = response.token

        try {
          // Use the token in the API request
          const apiResponse = await fetch(
            "https://www.twizzy.dev/api/bundle",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                tokenData,
                bundle
              })
            }
          )

          const data = await apiResponse.json()

          if (!apiResponse.ok) {
            setBundleCheckResult(data.error || "An error occurred.")
          } else {
            setBundleCheckResult(data.result)
          }
        } catch (error) {
          console.error("Something went wrong:", error)
          setBundleCheckResult(
            `Error: ${error.message || "An error occurred while checking the bundle."}`
          )
        } finally {
          setLoadingBundleCheck(false)
        }
      })
    } catch (error) {
      console.error("Something went wrong:", error)
      setBundleCheckResult("An unexpected error occurred.")
      setLoadingBundleCheck(false)
    }
  }

  const handleTwitterReuseCheck = async () => {
    setLoadingTwitterHistory(true)

    if (
      twitterLink.includes("x.com/intent") ||
      twitterLink.includes("x.com/search")
    ) {
      setTwitterHistory("Link type not supported.")
      setLoadingTwitterHistory(false)
      return
    }

    chrome.runtime.sendMessage({ action: "getToken" }, async (response) => {
      if (chrome.runtime.lastError || !response?.token) {
        console.error("Failed to retrieve token:", chrome.runtime.lastError)
        setTwitterHistory("Failed to retrieve authentication token.")
        setLoadingTwitterHistory(false)
        return
      }

      const token = response.token

      const twitterHandle = twitterLink.includes("x.com/")
        ? twitterLink.split("x.com/")[1].split("?")[0].split("/")[0]
        : null

      if (!twitterHandle) {
        setTwitterHistory("No Twitter found.")
        setLoadingTwitterHistory(false)
        return
      }

      try {
        const response = await fetch("https://www.twizzy.dev/api/twitter", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            twitterHandle
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          setTwitterHistory(errorData.error || "An error occurred.")
          setLoadingTwitterHistory(false)
          return
        }

        const data = await response.json()
        const usernamesWithDates = data.history.map((entry) => {
          const timeDiff = getTimeDifference(new Date(entry.lastChecked))
          return `${entry.username} (${timeDiff})`
        })

        if (usernamesWithDates.length) {
          setTwitterHistory(`Past usernames: ${usernamesWithDates.join(", ")}`)
        } else {
          setTwitterHistory("No past usernames found.")
        }
      } catch (error) {
        console.error("Something went wrong:", error)
        setTwitterHistory(`Error: ${error.message || "An error occurred."}`)
      } finally {
        setLoadingTwitterHistory(false)
      }
    })
  }

  const handleWebsiteAgeCheck = () => {
    setLoadingWebsiteAge(true)
    setWebsiteAge("")

    chrome.runtime.sendMessage({ action: "getToken" }, async (response) => {
      if (chrome.runtime.lastError || !response?.token) {
        console.error("Failed to retrieve token:", chrome.runtime.lastError)
        setWebsiteAge("Failed to retrieve authentication token.")
        setLoadingWebsiteAge(false)
        return
      }

      const token = response.token

      try {
       

        const domain = sanitizeDomain(websiteLink);
        const apiResponse = await fetch(
          "https://www.twizzy.dev/api/domain",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}` // Include token in headers
            },
            body: JSON.stringify({ domain })
          }
        )

        const data = await apiResponse.json()

        if (!apiResponse.ok) {
          // Handle errors returned from the API
          setWebsiteAge(
            data.error || "An error occurred while checking the domain age."
          )
        } else if (data.registrationDate) {
          // Calculate and set the domain age
          const age = calculateDomainAge(data.registrationDate)
          setWebsiteAge(`Domain age: ${age}`)
        } else {
          setWebsiteAge("Could not determine domain age.")
        }
      } catch (error) {
        console.error("Error fetching domain age:", error)
        setWebsiteAge("Error fetching domain age.")
      } finally {
        setLoadingWebsiteAge(false)
      }
    })
  }

  const handleDexCheck = async () => {
    if (!bundle) {
      setDexStatus("No Token.")
      return
    }

    setLoadingDexStatus(true)

    try {
      // Request the token from the background script
      chrome.runtime.sendMessage({ action: "getToken" }, async (response) => {
        if (chrome.runtime.lastError || !response?.token) {
          console.error("Failed to retrieve token:", chrome.runtime.lastError)
          setDexStatus("Failed to retrieve authentication token.")
          setLoadingDexStatus(false)
          return
        }

        const token = response.token

        try {
          // Use the token in the API request
          const apiResponse = await fetch(
            "https://www.twizzy.dev/api/dex/",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}` 
              },
              body: JSON.stringify({
                token: bundle 
              })
            }
          )

          const data = await apiResponse.json()

          if (!apiResponse.ok) {
            setDexStatus(data.error || "An error occurred.")
          } else {
            setDexStatus(data.message || "Dex check successful.")
          }
        } catch (error) {
          console.error("Something went wrong:", error)
          setDexStatus(
            `Error: ${error.message || "An error occurred while checking the Dex."}`
          )
        } finally {
          setLoadingDexStatus(false)
        }
      })
    } catch (error) {
      console.error("Something went wrong:", error)
      setDexStatus("An unexpected error occurred.")
      setLoadingDexStatus(false)
    }
  }

  return (
    <div className="w-[360px] h-[600px] bg-[#1C1D21] text-gray-100 font-sans flex flex-col">
      <header className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500 to-indigo-500 shadow-md rounded-lg m-4 mb-2">
        <div className="flex items-center space-x-4">
          <img
            src={iconUrl}
            alt="Twiz"
            className="w-16 h-16 rounded-full border-2 border-white shadow-lg"
          />
          <h1 className="text-3xl font-extrabold text-white drop-shadow-lg">
            Twizzy Vision
          </h1>
        </div>
      </header>

      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-16">
        <div className="flex flex-col space-y-4">
          <div className="bg-[#2A2B31] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">
                Contract Address ({tokenData?.symbol || "SYM"})
              </span>
              <button
                onClick={() => navigator.clipboard.writeText(bundle)}
                className="text-purple-400 hover:text-purple-300">
                <Clipboard size={16} />
              </button>
            </div>
            <div className="text-sm text-gray-300 break-all">{bundle}</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ActionButton
              label="Bundle Check"
              onClick={handleBundleCheck}
              loading={loadingBundleCheck}
              result={bundleCheckResult}
            />
            <ActionButton
              label="DEX Status"
              onClick={handleDexCheck}
              loading={loadingDexStatus}
              result={dexStatus}
            />
          </div>

          <div className="bg-[#2A2B31] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Twitter</span>
              <a
                href={twitterLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300">
                <ExternalLink size={16} />
              </a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 truncate flex-1 mr-2">
                {twitterLink}
              </span>
              <ActionButton
                label="Check History"
                onClick={handleTwitterReuseCheck}
                loading={loadingTwitterHistory}
                result={twitterHistory || ""}
                compact
              />
            </div>
          </div>

          <div className="bg-[#2A2B31] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Website</span>
              <a
                href={websiteLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300">
                <ExternalLink size={16} />
              </a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 truncate flex-1 mr-2">
                {websiteLink}
              </span>
              <ActionButton
                label="Check Age"
                onClick={handleWebsiteAgeCheck}
                loading={loadingWebsiteAge}
                result={websiteAge || ""}
                compact
              />
            </div>
          </div>
        </div>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 bg-[#1C1D21] border-t border-gray-800">
        <div className="flex justify-between items-center px-6 py-3">
          <a
            href={`https://dexscreener.com/solana/${bundle}`}
            onClick={(e) => {
              e.preventDefault()
              chrome.tabs.create({
                url: `https://dexscreener.com/solana/${bundle}`
              })
            }}
            className="p-2 hover:bg-[#2A2B31] rounded-lg transition-colors">
            <img
              src="/assets/dex.png"
              alt="DEX"
              className="w-5 h-5 opacity-70 hover:opacity-100"
            />
          </a>
          <a
            href={
              tokenData
                ? `https://x.com/search?q=%24${tokenData.symbol}&src=trend_click&vertical=trends`
                : "/"
            }
            onClick={(e) => {
              e.preventDefault()
              chrome.tabs.create({
                url: tokenData
                  ? `https://x.com/search?q=%24${tokenData.symbol}&src=trend_click&vertical=trends`
                  : "/"
              })
            }}
            className="p-2 hover:bg-[#2A2B31] rounded-lg transition-colors">
            <Search className="w-5 h-5 text-gray-400 hover:text-purple-400" />
          </a>
          <a
            href={
              tokenData
                ? `https://pump.fun/profile/${tokenData.deployerAddress}`
                : "/"
            }
            onClick={(e) => {
              e.preventDefault()
              chrome.tabs.create({
                url: tokenData
                  ? `https://pump.fun/profile/${tokenData.deployerAddress}`
                  : "/"
              })
            }}
            className="p-2 hover:bg-[#2A2B31] rounded-lg transition-colors">
            <img
              src="assets/pump.png"
              alt="Pump"
              className="w-5 h-5 opacity-70 hover:opacity-100"
            />
          </a>
        </div>
      </footer>
    </div>
  )
}

const ActionButton = ({
  label,
  onClick,
  loading,
  result,
  fullWidth = false,
  compact = false
}: {
  label: string
  onClick: () => void
  loading: boolean
  result: string
  fullWidth?: boolean
  compact?: boolean
}) => (
  <div
    className={`flex flex-col ${fullWidth ? "w-full" : ""} ${
      compact ? "w-auto" : ""
    }`}>
    <button
      onClick={onClick}
      disabled={loading}
      className={`px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-800 text-white rounded-lg text-sm font-medium transition-colors ${
        compact ? "px-2 py-1 text-xs" : ""
      }`}>
      {loading ? "..." : label}
    </button>
    {result && (
      <div className="text-xs text-gray-400 break-words mt-1">{result}</div>
    )}
  </div>
)

export default MainPage
