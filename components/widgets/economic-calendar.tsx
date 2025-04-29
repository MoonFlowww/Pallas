"use client"

import { useEffect, useRef } from "react"
import { useTheme } from "next-themes"

export function EconomicCalendar() {
  const container = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    if (container.current) {
      const script = document.createElement("script")
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js"
      script.type = "text/javascript"
      script.async = true
      script.innerHTML = `
        {
          "width": "100%",
          "height": "100%",
          "colorTheme": "${theme === "dark" ? "dark" : "light"}",
          "isTransparent": true,
          "locale": "en",
          "importanceFilter": "0,1,2",
          "currencyFilter": "USD,EUR,JPY,GBP,CNY,AUD,CAD,CHF,HKD,KRW,INR,BRL,RUB,MXN,ZAR,SGD,TWD,TRY,SAR,THB"
        }`

      // Remove old script if it exists
      const oldScript = container.current.querySelector("script")
      if (oldScript) {
        container.current.removeChild(oldScript)
      }

      container.current.appendChild(script)
    }
  }, [theme])

  return (
    <div className="relative h-[400px] w-full overflow-hidden">
      <div className="tradingview-widget-container absolute inset-0" ref={container}>
        <div className="tradingview-widget-container__widget h-full"></div>
      </div>
    </div>
  )
}

