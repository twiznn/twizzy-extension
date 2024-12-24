import React from 'react'

import '../style.css'

import { createMemoryRouter, RouterProvider } from 'react-router-dom'

import { RootLayout } from './layouts/root-layout'
import { Home } from './routes/home'
import { Settings } from './routes/settings'
import { SignInPage } from './routes/sign-in'

const router = createMemoryRouter([
    {
      element: <RootLayout />, // RootLayout should be here
      children: [
        { path: '/'},
        { path: '/sign-in', element: <SignInPage /> },
        { path: '/settings', element: <Settings /> },
      ],
    },
  ])
  
  export default function PopupIndex() {
    return <RouterProvider router={router} />
  }
  