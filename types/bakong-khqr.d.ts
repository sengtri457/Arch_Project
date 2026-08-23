declare module 'bakong-khqr' {
  export interface KhqrStatus {
    code: number
    message?: string
  }

  export interface KhqrResult {
    status?: KhqrStatus
    data?: {
      qr: string
      md5?: string
      [key: string]: unknown
    }
  }

  export declare class IndividualInfo {
    [key: string]: any
    constructor(...args: any[])
  }

  export declare class BakongKHQR {
    generateIndividual(info: IndividualInfo): KhqrResult
    generateMerchant?(info: unknown): KhqrResult
    checkBakongTransactionByMd5?(md5: string, token?: string): unknown
  }

  export declare const khqrData: {
    currency: { usd: string | number; khr: string | number }
    [key: string]: unknown
  }
}
