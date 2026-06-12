import React from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, router } from '@inertiajs/react';

export default function CashDrawerLogs({ logs, filters }) {
    const handleDateChange = (e) => {
        router.get(route('reports.cashDrawerLogs'), { date: e.target.value }, { preserveState: true });
    };

    return (
        <AppLayout
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Laporan Buka Laci (Cash Drawer)</h2>}
        >
            <Head title="Cash Drawer Logs" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            
                            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h3 className="text-lg font-medium">Histori Pembukaan Laci Manual</h3>
                                    <p className="text-sm text-gray-500">Melihat daftar kasir yang membuka laci kasir di luar transaksi beserta alasannya.</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <label className="text-sm font-medium text-gray-700">Tanggal:</label>
                                    <input 
                                        type="date" 
                                        className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 rounded-md shadow-sm"
                                        value={filters.date || ''}
                                        onChange={handleDateChange}
                                    />
                                    {filters.date && (
                                        <button 
                                            onClick={() => router.get(route('reports.cashDrawerLogs'))}
                                            className="text-sm text-gray-500 hover:text-red-500 underline ml-2"
                                        >
                                            Reset
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-gray-500">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3">Waktu Buka</th>
                                            <th className="px-6 py-3">Nama Kasir</th>
                                            <th className="px-6 py-3">Alasan (Note)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.data.length > 0 ? (
                                            logs.data.map((log) => (
                                                <tr key={log.id} className="bg-white border-b hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                                        {log.opened_at}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {log.employee_name}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {log.reason}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="3" className="px-6 py-4 text-center text-gray-500 italic">
                                                    Tidak ada histori pembukaan laci pada tanggal ini.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination (if many) */}
                            {logs.links && logs.links.length > 3 && (
                                <div className="mt-4 flex justify-end">
                                    <div className="flex gap-1">
                                        {logs.links.map((link, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => link.url && router.get(link.url)}
                                                disabled={!link.url}
                                                className={`px-3 py-1 border rounded ${
                                                    link.active ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-700 hover:bg-gray-50'
                                                } ${!link.url && 'opacity-50 cursor-not-allowed'}`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
