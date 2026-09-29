import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { announceVoice, playChime } from '@/utils/voiceAnnouncer';

export interface SignalPayload {
    status: 'PENDING' | 'PAID' | 'CONFIRMED' | string;
    transaction_id: string | number;
}

export interface FullTransactionDetail {
    id: number;
    invoice_number: string;
    store_id?: string;
    table_number: string;
    customer_name: string;
    customer_phone?: string;
    order_type: string;
    payment_type: string;
    payment_status: string;
    status: string;
    subtotal: number;
    tax: number;
    discount: number;
    total_amount: number;
    created_at: string;
    items: Array<{
        id?: number;
        product_id: number;
        product_name: string;
        sku?: string;
        quantity: number;
        price: number;
        subtotal: number;
        notes?: string;
        category_type?: string;
    }>;
}

interface UseOrderSignalOptions {
    storeId?: string;
    onOrderReceived?: (order: FullTransactionDetail, status: string) => void;
    autoVoice?: boolean;
}

export function useOrderSignalListener({
    storeId,
    onOrderReceived,
    autoVoice = true,
}: UseOrderSignalOptions) {
    const processedIdsRef = useRef<Set<string>>(new Set());

    // Fungsi untuk menarik data utuh melalui API (Pull Pattern)
    const fetchFullTransaction = useCallback(async (transactionId: string | number, status: string) => {
        const idKey = `${transactionId}-${status}`;
        if (processedIdsRef.current.has(idKey)) return;
        processedIdsRef.current.add(idKey);

        try {
            const response = await fetch(`/owner/online-orders/${transactionId}`);
            if (!response.ok) {
                console.warn(`[SignalListener] Gagal memuat data transaksi #${transactionId}`);
                return;
            }

            const result = await response.json();
            if (result.status === 'success' && result.data) {
                const order: FullTransactionDetail = result.data;

                // 1. Eksekusi Callback UI
                if (onOrderReceived) {
                    onOrderReceived(order, status);
                }

                // 2. Play Audio Bell & Indonesian TTS
                if (autoVoice) {
                    playChime();
                    const tableText = order.table_number ? `dari ${order.table_number}` : '';
                    if (status === 'PAID') {
                        announceVoice(`Pembayaran QRIS lunas ${tableText} atas nama ${order.customer_name}. Total Rp ${order.total_amount.toLocaleString('id-ID')}`);
                        toast.success(`💰 Pembayaran QRIS Lunas #${order.invoice_number}`, {
                            description: `${order.customer_name} (${order.table_number}) - Rp${order.total_amount.toLocaleString('id-ID')}`,
                        });
                    } else {
                        announceVoice(`Pesanan baru masuk ${tableText} atas nama ${order.customer_name}. Pembayaran di kasir.`);
                        toast.info(`🔔 Pesanan Baru Masuk #${order.invoice_number}`, {
                            description: `${order.customer_name} (${order.table_number}) - Total Rp${order.total_amount.toLocaleString('id-ID')}`,
                        });
                    }
                }
            }
        } catch (err) {
            console.error('[SignalListener] Error fetch online order:', err);
        }
    }, [onOrderReceived, autoVoice]);

    // Handle payload sinyal masuk
    const handleSignal = useCallback((signal: SignalPayload) => {
        if (!signal || !signal.transaction_id) return;
        console.log('[SignalListener] Sinyal notifikasi diterima:', signal);
        fetchFullTransaction(signal.transaction_id, signal.status);
    }, [fetchFullTransaction]);

    useEffect(() => {
        // 1. Registrasi Service Worker untuk Background Push
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/firebase-messaging-sw.js').catch((err) => {
                console.warn('[SW] Registration failed:', err);
            });

            const onServiceWorkerMessage = (event: MessageEvent) => {
                if (event.data && event.data.type === 'FIREBASE_ORDER_SIGNAL') {
                    handleSignal(event.data.signal);
                }
            };

            navigator.serviceWorker.addEventListener('message', onServiceWorkerMessage);
            return () => {
                navigator.serviceWorker.removeEventListener('message', onServiceWorkerMessage);
            };
        }
    }, [handleSignal]);

    useEffect(() => {
        // 2. Listener event window (untuk simulasi / internal app dispatcher)
        const onCustomSignal = (e: any) => {
            if (e.detail) {
                handleSignal(e.detail);
            }
        };

        window.addEventListener('kilatz:order-signal', onCustomSignal);
        return () => {
            window.removeEventListener('kilatz:order-signal', onCustomSignal);
        };
    }, [handleSignal]);

    return {
        triggerManualSignal: handleSignal,
    };
}
