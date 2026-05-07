import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { fetchWithBaseUrlFallback } from '../../../Src/axios';

const THEME = {
  bg: '#F4F6F9',
  card: '#FFFFFF',
  ink: '#111827',
  muted: '#667085',
  border: '#DDE3EA',
  primary: '#146C63',
  primaryDark: '#0F514A',
  success: '#168A5A',
  warning: '#B45309',
  danger: '#B42318',
};

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return `₹${amount.toFixed(2)}`;
};

const formatDate = (value) => {
  if (!value) return 'Not scheduled';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not scheduled';
  return date.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const loadRazorpayScript = () => {
  if (Platform.OS !== 'web') return Promise.resolve(true);
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const openCheckout = async (options) => {
  if (Platform.OS === 'web') {
    const loaded = await loadRazorpayScript();
    if (!loaded || !window.Razorpay) {
      throw new Error('Unable to load Razorpay checkout');
    }

    return new Promise((resolve, reject) => {
      const checkout = new window.Razorpay({
        ...options,
        handler: resolve,
        modal: {
          ondismiss: () => reject(new Error('Payment cancelled')),
        },
      });
      checkout.open();
    });
  }

  const RazorpayCheckout = require('react-native-razorpay').default;
  return RazorpayCheckout.open(options);
};

export default function Subscription({ instituteId = '', instituteName = '', adminEmail = '', adminName = '' }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  const resolvedInstituteId = (instituteId || '').trim();

  const loadSummary = useCallback(async () => {
    if (!resolvedInstituteId) {
      setError('Institute context is missing. Please sign in again.');
      setSummary(null);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { response } = await fetchWithBaseUrlFallback(
        `/api/institutes/${encodeURIComponent(resolvedInstituteId)}/subscription`
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || 'Unable to load subscription');
      }
      setSummary(payload);
    } catch (err) {
      setError(err.message || 'Unable to load subscription');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [resolvedInstituteId]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const handlePay = async () => {
    if (!summary || paying) return;

    setPaying(true);
    setError('');
    try {
      const { response: orderResponse } = await fetchWithBaseUrlFallback(
        `/api/institutes/${encodeURIComponent(resolvedInstituteId)}/subscription/order`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' } }
      );
      const orderPayload = await orderResponse.json();
      if (!orderResponse.ok) {
        throw new Error(orderPayload?.message || 'Unable to create payment order');
      }

      const order = orderPayload.order;
      const paymentResult = await openCheckout({
        key: orderPayload.keyId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: instituteName || summary.instituteName || 'UniVerse',
        description: `Monthly subscription for ${summary.userCount} users`,
        order_id: order.id,
        prefill: {
          name: adminName,
          email: adminEmail,
        },
        notes: {
          instituteId: resolvedInstituteId,
        },
        theme: { color: THEME.primary },
      });

      const { response: verifyResponse } = await fetchWithBaseUrlFallback(
        `/api/institutes/${encodeURIComponent(resolvedInstituteId)}/subscription/verify`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: paymentResult.razorpay_order_id,
            razorpay_payment_id: paymentResult.razorpay_payment_id,
            razorpay_signature: paymentResult.razorpay_signature,
          }),
        }
      );
      const verifyPayload = await verifyResponse.json();
      if (!verifyResponse.ok) {
        throw new Error(verifyPayload?.message || 'Payment verification failed');
      }

      Alert.alert('Payment verified', 'Monthly subscription payment has been recorded.');
      await loadSummary();
    } catch (err) {
      const message = err?.description || err?.message || 'Payment could not be completed';
      setError(message);
      Alert.alert('Payment not completed', message);
    } finally {
      setPaying(false);
    }
  };

  const breakdown = summary?.userBreakdown || {};
  const payment = summary?.payment || {};
  const canPay = summary && Number(summary.monthlyAmount || 0) > 0 && !paying;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>BILLING</Text>
          <Text style={styles.title}>Subscription</Text>
          <Text style={styles.subtitle}>{summary?.instituteName || instituteName || resolvedInstituteId}</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={loadSummary} activeOpacity={0.75}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={THEME.primary} />
        </View>
      ) : null}

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {summary ? (
        <>
          <View style={styles.summaryGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Per user fee</Text>
              <Text style={styles.metricValue}>{formatCurrency(summary.pricePerUser)}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Billable users</Text>
              <Text style={styles.metricValue}>{summary.userCount}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Monthly total</Text>
              <Text style={styles.metricValue}>{formatCurrency(summary.monthlyAmount)}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>Current Month</Text>
                <Text style={styles.cardSubtitle}>Calculated from active institute users</Text>
              </View>
              <View style={[styles.statusBadge, payment.status === 'completed' && styles.statusPaid]}>
                <Text style={[styles.statusText, payment.status === 'completed' && styles.statusPaidText]}>
                  {(payment.status || 'pending').toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Students</Text>
              <Text style={styles.rowValue}>{breakdown.students || 0}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Teachers</Text>
              <Text style={styles.rowValue}>{breakdown.teachers || 0}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Assistants</Text>
              <Text style={styles.rowValue}>{breakdown.assistants || 0}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Parents</Text>
              <Text style={styles.rowValue}>{breakdown.parents || 0}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Last paid</Text>
              <Text style={styles.rowValue}>{formatDate(payment.paidDate)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Next due</Text>
              <Text style={styles.rowValue}>{formatDate(payment.dueDate)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Transaction</Text>
              <Text style={styles.rowValue}>{payment.transactionId || 'Not available'}</Text>
            </View>

            <TouchableOpacity
              style={[styles.payButton, !canPay && styles.payButtonDisabled]}
              onPress={handlePay}
              disabled={!canPay}
              activeOpacity={0.82}
            >
              {paying ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.payText}>Pay {formatCurrency(summary.monthlyAmount)}</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  content: {
    padding: 24,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 18,
  },
  kicker: {
    fontSize: 11,
    color: THEME.primary,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: THEME.ink,
    marginTop: 3,
  },
  subtitle: {
    fontSize: 13,
    color: THEME.muted,
    marginTop: 4,
  },
  refreshButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.card,
  },
  refreshText: {
    color: THEME.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  loader: {
    paddingVertical: 36,
  },
  errorBox: {
    backgroundColor: '#FEF3F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: THEME.danger,
    fontSize: 13,
    fontWeight: '700',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 14,
  },
  metricCard: {
    flexGrow: 1,
    flexBasis: 180,
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 8,
    padding: 16,
  },
  metricLabel: {
    color: THEME.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  metricValue: {
    color: THEME.ink,
    fontSize: 24,
    fontWeight: '800',
    marginTop: 8,
  },
  card: {
    backgroundColor: THEME.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  cardTitle: {
    color: THEME.ink,
    fontSize: 18,
    fontWeight: '800',
  },
  cardSubtitle: {
    color: THEME.muted,
    fontSize: 12,
    marginTop: 4,
  },
  statusBadge: {
    backgroundColor: '#FFF7ED',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusPaid: {
    backgroundColor: '#ECFDF3',
  },
  statusText: {
    color: THEME.warning,
    fontSize: 11,
    fontWeight: '800',
  },
  statusPaidText: {
    color: THEME.success,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
  },
  rowLabel: {
    color: THEME.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  rowValue: {
    color: THEME.ink,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'right',
    flexShrink: 1,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.border,
    marginVertical: 8,
  },
  payButton: {
    marginTop: 18,
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonDisabled: {
    backgroundColor: '#98A2B3',
  },
  payText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
