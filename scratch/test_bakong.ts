import { BakongKHQR, IndividualInfo, khqrData } from 'bakong-khqr'

try {
  const khqrHelper = new BakongKHQR()
  const merchantInfo = new IndividualInfo()
  
  merchantInfo.bakongAccountID = 'sxngtri@aba'
  merchantInfo.merchantName = 'ArchViz Academy'
  merchantInfo.amount = 49.99 // Let's check if it accepts numbers or strings!
  merchantInfo.currency = khqrData.currency.usd // Use USD: 840
  merchantInfo.billNumber = 'BILL-TEST-123'
  merchantInfo.storeLabel = 'ArchViz Academy'
  merchantInfo.terminalLabel = 'Web Checkout'
  merchantInfo.merchantCity = 'Phnom Penh' // Often required for EMVCo merchant name details!

  const khqrResult = khqrHelper.generateIndividual(merchantInfo)
  console.log("Compilation response:", khqrResult)
} catch (err) {
  console.error("Compilation error caught:", err)
}
