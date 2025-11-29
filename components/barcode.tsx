'use client'

import { useEffect, useRef } from 'react'
import JsBarcode from 'jsbarcode'

interface BarcodeProps {
  value: string
  width?: number
  height?: number
  displayValue?: boolean
  fontSize?: number
}

export function Barcode({ value, width = 2, height = 60, displayValue = true, fontSize = 14 }: BarcodeProps) {
  const barcodeRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, value, {
          format: 'CODE128',
          width,
          height,
          displayValue,
          fontSize,
          margin: 10,
        })
      } catch (error) {
        console.error('Error generating barcode:', error)
      }
    }
  }, [value, width, height, displayValue, fontSize])

  return (
    <div className="flex items-center justify-center">
      <svg ref={barcodeRef}></svg>
    </div>
  )
}
