import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Edit, Shield, Search, UserCheck, UserX } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import * as employees from '@/routes/owner/employees';

interface Employee {
    id: number;
    name: string;
    username: string;
    role: 'CASHIER' | 'SUPERVISOR' | 'OWNER';
    is_active: boolean;
}

export default function EmployeesIndex({ employees: employeeData, filters }: { employees: any, filters: any }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
    const [search, setSearch] = useState(filters.search || '');

    const [formData, setFormData] = useState({
        name: '',
        username: '',
        role: 'CASHIER',
        pin_code: ''
    });

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Karyawan', href: employees.index.url() },
    ];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(employees.index.url(), { search }, { preserveState: true });
    };

    const openCreateModal = () => {
        setEditingEmp(null);
        setFormData({ name: '', username: '', role: 'CASHIER', pin_code: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (emp: Employee) => {
        setEditingEmp(emp);
        setFormData({
            name: emp.name,
            username: emp.username,
            role: emp.role,
            pin_code: ''
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (editingEmp) {
            router.put(employees.update.url(editingEmp.id), formData as any, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    toast.success('Karyawan berhasil diperbarui');
                },
                onError: (err) => {
                    toast.error(err.username || err.pin_code || 'Terjadi kesalahan');
                }
            });
        } else {
            router.post(employees.store.url(), formData as any, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    toast.success('Karyawan berhasil ditambahkan');
                },
                onError: (err) => {
                    toast.error(err.username || err.pin_code || 'Terjadi kesalahan');
                }
            });
        }
    };

    const handleToggleActive = (emp: Employee) => {
        if (!emp.is_active || confirm(`Nonaktifkan karyawan ${emp.name}? Mereka tidak akan bisa login.`)) {
            router.put(employees.update.url(emp.id), {
                is_active: !emp.is_active
            }, {
                onSuccess: () => toast.success(`Status ${emp.name} diperbarui`)
            });
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'OWNER': return <Badge className="bg-purple-500"><Shield className="w-3 h-3 mr-1"/> Owner</Badge>;
            case 'SUPERVISOR': return <Badge className="bg-blue-500">Supervisor</Badge>;
            default: return <Badge variant="outline">Kasir</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Karyawan" />
            
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-[#FEB400]">Karyawan</h2>
                        <p className="text-muted-foreground text-sm">Kelola akses staff ke aplikasi Kasir Mobile.</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <form onSubmit={handleSearch} className="flex relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Cari nama/username..."
                                className="pl-8 w-full md:w-[250px]"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </form>
                        <Button onClick={openCreateModal} className="bg-[#FEB400] text-black hover:bg-[#e0a000] shrink-0">
                            <Plus className="mr-2 h-4 w-4" /> Karyawan Baru
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-4">
                    {employeeData.data.map((emp: Employee) => (
                        <Card key={emp.id} className={`overflow-hidden transition-all ${!emp.is_active ? 'opacity-60 grayscale' : ''}`}>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold text-lg">
                                            {emp.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">{emp.name}</CardTitle>
                                            <CardDescription>@{emp.username}</CardDescription>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between mt-2 mb-4">
                                    {getRoleBadge(emp.role)}
                                    {emp.is_active ? (
                                        <span className="flex items-center text-xs text-green-500 font-medium"><UserCheck className="w-3 h-3 mr-1"/> Aktif</span>
                                    ) : (
                                        <span className="flex items-center text-xs text-red-500 font-medium"><UserX className="w-3 h-3 mr-1"/> Nonaktif</span>
                                    )}
                                </div>
                                
                                <div className="flex justify-end gap-2 pt-3 border-t">
                                    <Button variant="outline" size="sm" onClick={() => openEditModal(emp)}>
                                        Edit
                                    </Button>
                                    <Button 
                                        variant={emp.is_active ? "destructive" : "secondary"} 
                                        size="sm" 
                                        onClick={() => handleToggleActive(emp)}
                                    >
                                        {emp.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    
                    {employeeData.data.length === 0 && (
                        <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 rounded-lg">
                            <p>Tidak ada data karyawan ditemukan.</p>
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingEmp ? 'Edit Karyawan' : 'Tambah Karyawan Baru'}</DialogTitle>
                        <DialogDescription>
                            Karyawan dapat login ke Mobile POS menggunakan Username dan PIN ini.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nama Lengkap</Label>
                                <Input 
                                    id="name" 
                                    placeholder="Nama Karyawan" 
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    required 
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="username">Username (Login)</Label>
                                <Input 
                                    id="username" 
                                    placeholder="nama_kasir" 
                                    value={formData.username}
                                    onChange={e => setFormData({...formData, username: e.target.value.toLowerCase().replace(/\s/g, '')})}
                                    disabled={!!editingEmp}
                                    required 
                                />
                                {!editingEmp && <p className="text-xs text-muted-foreground">Hanya huruf kecil dan angka, tanpa spasi.</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="role">Jabatan / Role</Label>
                                <Select value={formData.role} onValueChange={v => setFormData({...formData, role: v})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CASHIER">Kasir (CASHIER)</SelectItem>
                                        <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                                        <SelectItem value="OWNER">Owner (Akses Penuh)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="pin_code">{editingEmp ? 'Reset PIN (Opsional)' : 'PIN Akses (4-6 Digit)'}</Label>
                                <Input 
                                    id="pin_code" 
                                    type="password"
                                    inputMode="numeric"
                                    pattern="[0-9]{4,6}"
                                    placeholder={editingEmp ? "Kosongkan jika tidak ingin diubah" : "1234"} 
                                    value={formData.pin_code}
                                    onChange={e => setFormData({...formData, pin_code: e.target.value})}
                                    required={!editingEmp} 
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                            <Button type="submit" className="bg-[#FEB400] text-black hover:bg-[#e0a000]">
                                {editingEmp ? 'Simpan Perubahan' : 'Buat Akun'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
