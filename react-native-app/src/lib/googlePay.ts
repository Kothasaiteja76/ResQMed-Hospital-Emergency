/**
 * Google Pay helper for React Native.
 *
 * In React Native, the browser-based Google Pay JS SDK is not available.
 * This module provides a stub API surface that:
 *  - Returns `canUseGooglePay() → false` (since RN doesn't have the web SDK)
 *  - Preserves all types for use by other components
 *
 * For real mobile Google Pay integration, use `@google-pay/react-native-google-pay`
 * or `expo-google-pay` when those become available.
 */

export type GpayEnv = 'TEST' | 'PRODUCTION';
export const GPAY_ENV: GpayEnv = 'TEST';

export const GPAY_MERCHANT_ID = '12345678901234567890';
export const GPAY_MERCHANT_NAME = 'Arogya Care';

export type GpayPaymentInput = {
  amountRupees: number;
  label: string;
  transactionId?: string;
};

export type GpaySuccess = {
  paymentMethodData: {
    type: string;
    description: string;
    tokenizationData: { type: string; token: string };
    info: { cardNetwork: string; cardDetails: string };
  };
};

/** In React Native, Google Pay web SDK is not available. */
export async function canUseGooglePay(): Promise<boolean> {
  return false;
}

export async function getPaymentsClient(): Promise<any> {
  throw new Error('Google Pay web SDK not available in React Native');
}

export function buildIsReadyRequest() {
  return { apiVersion: 2, apiVersionMinor: 0, allowedPaymentMethods: [] };
}

export function buildPaymentDataRequest(_input: GpayPaymentInput) {
  return { apiVersion: 2, apiVersionMinor: 0, allowedPaymentMethods: [] };
}

export async function payWithGooglePay(_input: GpayPaymentInput): Promise<GpaySuccess> {
  throw new Error('Google Pay web SDK not available in React Native. Use a native payment module.');
}
