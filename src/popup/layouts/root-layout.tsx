// layouts/root-layout.tsx

import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  UserButton
} from "@clerk/chrome-extension"
import React, { useState, useEffect } from "react"
import { Link, Outlet, useNavigate } from "react-router-dom"
import MainPage from "../components/MainPage"
import SignOut from "~popup/components/SignedOut"
import { checkSubscriptionStatus } from "~api/subscrption"
import NonSub from "~popup/components/NonSub"
import Spinner from "~popup/components/Spinner"

const PUBLISHABLE_KEY = process.env.PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY
const SYNC_HOST = process.env.PLASMO_PUBLIC_CLERK_SYNC_HOST

if (!PUBLISHABLE_KEY || !SYNC_HOST) {
  throw new Error(
    "Please add the PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY and PLASMO_PUBLIC_CLERK_SYNC_HOST to the .env.development file"
  )
}

export const RootLayout = () => {
  const navigate = useNavigate()
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        const status = await checkSubscriptionStatus()
        setIsSubscribed(status)
      } catch (err) {
        console.error("Error fetching subscription status:", err)
        setError("Failed to fetch subscription status.")
      }
    }

    fetchSubscriptionStatus()
  }, [])

  return (
    <ClerkProvider
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/"
      syncHost={SYNC_HOST}
    >
      <div className="w-[360px] h-[600px] bg-[#1C1D21] text-gray-100 font-sans flex flex-col">
        <SignedIn>
          {isSubscribed === null ? (
            error ? (
              <div className="text-red-500">{error}</div>
            ) : (
              <Spinner/>
            )
          ) : isSubscribed ? (
            <MainPage />
          ) : (
            <NonSub />
          )}
        </SignedIn>

        <SignedOut>
          <SignOut />
        </SignedOut>
      </div>
      <Outlet />
    </ClerkProvider>
  )
}
