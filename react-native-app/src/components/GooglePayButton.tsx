import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { canUseGooglePay, payWithGooglePay, type GpaySuccess, type GpayPaymentInput, GPAY_ENV } from '../lib/googlePay';

type Props = {
  amountRupees: number;
  label: string;
  disabled?: boolean;
  onPaying?: () => void;
  onSuccess: (result: GpaySuccess) => void;
  onError?: (err: Error) => void;
  onCancel?: () => void;
  buttonType?: 'pay' | 'book' | 'plain' | 'buy';
  fallbackLabel?: string;
  onFallback?: () => void;
};

export const GooglePayButton = ({
  amountRupees,
  label,
  disabled,
  onPaying,
  onSuccess,
  onError,
  onCancel,
  buttonType = 'pay',
  fallbackLabel,
  onFallback,
}: Props) => {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ok = await canUseGooglePay();
      if (!cancelled) setAvailable(ok);
    })();
    return () => { cancelled = true; };
  }, []);

  const handlePay = async () => {
    if (disabled || busy) return;
    setBusy(true);
    onPaying?.();
    try {
      const input: GpayPaymentInput = { amountRupees, label };
      const result = await payWithGooglePay(input);
      onSuccess(result);
    } catch (e: any) {
      const code = e?.statusCode || e?.code;
      if (code === 'CANCELED') {
        onCancel?.();
      } else {
        onError?.(e instanceof Error ? e : new Error(String(e?.message || e)));
      }
    } finally {
      setBusy(false);
    }
  };

  if (available === null) {
    return <View style={styles.skeleton} />;
  }

  // Google Pay not available in React Native — show fallback button
  return (
    <TouchableOpacity
      onPress={onFallback || handlePay}
      disabled={disabled || busy}
      activeOpacity={0.85}
      style={[styles.fallbackBtn, (disabled || busy) && { opacity: 0.4 }]}
    >
      {busy ? (
        <ActivityIndicator size="small" color="#ffffff" />
      ) : (
        <Text style={styles.fallbackText}>{fallbackLabel || `Pay ₹${amountRupees}`}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  skeleton: { height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)' },
  fallbackBtn: {
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  fallbackText: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
});
