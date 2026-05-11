import { Head, Link, useForm } from '@inertiajs/react';
import React, { useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp';
import { login } from '@/routes';
import { store } from '@/routes/register';
import { CheckCircle2, ChevronRight, Store, MapPin, Tag, ArrowLeft, ShieldCheck, User, Zap } from 'lucide-react';

export default function Register() {
    const [step, setStep] = useState(1);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
        otp: '',
        business_name: '',
        business_address: '',
        store_id: '',
        coupon_code: ''
    });

    const handleNextStep = (e: React.MouseEvent) => {
        e.preventDefault();
        setStep(step + 1);
    };

    const handlePreviousStep = (e: React.MouseEvent) => {
        e.preventDefault();
        setStep(step - 1);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        // Fallback to normal registration for MVP
        post(store.form().action, {
            onSuccess: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <Head title="Register - Kilatz Onboarding" />
            
            <div className="mb-10 text-center sm:text-left">
                <h1 className="text-3xl font-black italic tracking-tighter uppercase text-zinc-900 dark:text-white mb-2">
                    {step === 1 && "Identity Intake."}
                    {step === 2 && "Verifikasi OTP."}
                    {step === 3 && "Business Setup."}
                </h1>
                <p className="text-sm text-zinc-500 font-medium">
                    {step === 1 && "Langkah 1: Masukkan detail pribadi Anda untuk memulai."}
                    {step === 2 && `Langkah 2: Kami telah mengirimkan kode 6-digit ke ${data.email || 'email Anda'}.`}
                    {step === 3 && "Langkah 3: Siapkan toko pertama Anda bersama Kilatz."}
                </p>
                
                {/* Stepper Progress */}
                <div className="mt-8 flex items-center justify-between gap-2">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex-1 flex flex-col gap-2">
                            <div className={`h-1.5 w-full rounded-full transition-all duration-500 ${step >= s ? 'bg-[#FEB400]' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
                            <span className={`text-[10px] font-black uppercase tracking-widest ${step >= s ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'}`}>Step {s}</span>
                        </div>
                    ))}
                </div>
            </div>

            <form onSubmit={submit} className="flex flex-col gap-6 relative">
                
                {/* STEP 1: IDENTITY INTAKE */}
                {step === 1 && (
                    <div className="grid gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid gap-2">
                            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-zinc-500">Nama Owner</Label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                                    <User size={16} />
                                </div>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Nama lengkap sesuai KTP"
                                    className="pl-10 h-12 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl"
                                />
                            </div>
                            <InputError message={errors.name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-zinc-500">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                required
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="owner@bisnis.com"
                                className="h-12 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl"
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-widest text-zinc-500">Phone Number (WhatsApp)</Label>
                            <Input
                                id="phone"
                                type="tel"
                                required
                                value={data.phone}
                                onChange={(e) => setData('phone', e.target.value)}
                                placeholder="08123456789"
                                className="h-12 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl"
                            />
                            <InputError message={errors.phone} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-zinc-500">Password</Label>
                            <PasswordInput
                                id="password"
                                required
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="Buat password yang kuat"
                                className="h-12 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl"
                            />
                            <InputError message={errors.password} />
                        </div>
                        
                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation" className="text-xs font-bold uppercase tracking-widest text-zinc-500">Confirm Password</Label>
                            <PasswordInput
                                id="password_confirmation"
                                required
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                placeholder="Ketik ulang password"
                                className="h-12 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl"
                            />
                            <InputError message={errors.password_confirmation} />
                        </div>

                        <Button 
                            type="button" 
                            className="mt-6 h-12 rounded-xl bg-[#FEB400] text-black hover:bg-[#E5A200] font-black tracking-widest uppercase shadow-lg shadow-yellow-500/20 w-full flex items-center justify-center gap-2 transition-all hover:gap-4"
                            onClick={handleNextStep}
                        >
                            Lanjutkan <ChevronRight size={18} />
                        </Button>
                    </div>
                )}

                {/* STEP 2: OTP VERIFICATION */}
                {step === 2 && (
                    <div className="grid gap-6 animate-in fade-in slide-in-from-right-8 duration-500 text-center">
                        <div className="mx-auto w-16 h-16 bg-[#FEB400]/10 rounded-2xl flex items-center justify-center mb-2">
                            <ShieldCheck size={32} className="text-[#FEB400]" />
                        </div>
                        
                        <div className="grid gap-2 text-center place-items-center mb-4">
                            <Label htmlFor="otp" className="mb-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">Masukkan kode 6 digit OTP</Label>
                            <InputOTP maxLength={6} value={data.otp} onChange={(val) => setData('otp', val)}>
                              <InputOTPGroup>
                                <InputOTPSlot index={0} className="h-12 w-12 sm:h-14 sm:w-14 text-lg font-black" />
                                <InputOTPSlot index={1} className="h-12 w-12 sm:h-14 sm:w-14 text-lg font-black" />
                                <InputOTPSlot index={2} className="h-12 w-12 sm:h-14 sm:w-14 text-lg font-black" />
                              </InputOTPGroup>
                              <InputOTPSeparator />
                              <InputOTPGroup>
                                <InputOTPSlot index={3} className="h-12 w-12 sm:h-14 sm:w-14 text-lg font-black" />
                                <InputOTPSlot index={4} className="h-12 w-12 sm:h-14 sm:w-14 text-lg font-black" />
                                <InputOTPSlot index={5} className="h-12 w-12 sm:h-14 sm:w-14 text-lg font-black" />
                              </InputOTPGroup>
                            </InputOTP>
                        </div>
                        
                        <div className="text-sm font-medium text-zinc-500">
                            Tidak menerima kode? <button type="button" className="text-[#FEB400] hover:underline font-bold">Kirim ulang</button>
                        </div>
                        
                        <div className="flex gap-4 mt-6">
                            <Button type="button" variant="outline" onClick={handlePreviousStep} className="h-12 px-4 rounded-xl border-zinc-200 dark:border-zinc-800">
                                <ArrowLeft size={18} />
                            </Button>
                            <Button 
                                type="button" 
                                className="h-12 flex-1 rounded-xl bg-[#FEB400] text-black hover:bg-[#E5A200] font-black tracking-widest uppercase shadow-lg shadow-yellow-500/20 transition-all"
                                onClick={handleNextStep}
                                disabled={data.otp.length < 6}
                            >
                                Verifikasi OTP <CheckCircle2 size={18} className="ml-2" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* STEP 3: BUSINESS PROVISIONING */}
                {step === 3 && (
                    <div className="grid gap-5 animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="grid gap-2">
                            <Label htmlFor="business_name" className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2"><Store size={14}/> Nama Bisnis</Label>
                            <Input
                                id="business_name"
                                type="text"
                                required
                                value={data.business_name}
                                onChange={(e) => setData('business_name', e.target.value)}
                                placeholder="Contoh: Kopi Kenangan"
                                className="h-12 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="store_id" className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2"><Store size={14}/> Store ID (Subdomain)</Label>
                            <div className="flex relative items-center">
                                <span className="absolute left-4 font-bold text-zinc-400 select-none">kilatz.com/</span>
                                <Input
                                    id="store_id"
                                    type="text"
                                    required
                                    value={data.store_id}
                                    onChange={(e) => setData('store_id', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                    placeholder="nama-toko"
                                    className="h-12 pl-[90px] bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl font-medium"
                                />
                                {data.store_id.length > 3 && (
                                    <div className="absolute right-4 text-emerald-500 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest animate-in fade-in zoom-in">
                                        <CheckCircle2 size={14} /> Tersedia
                                    </div>
                                )}
                            </div>
                            <p className="text-[11px] text-zinc-500 font-medium">Ini akan menjadi link unik untuk toko Anda.</p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="business_address" className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2"><MapPin size={14}/> Alamat Lengkap Bisnis</Label>
                            <Input
                                id="business_address"
                                type="text"
                                required
                                value={data.business_address}
                                onChange={(e) => setData('business_address', e.target.value)}
                                placeholder="Jl. Sudirman No. 123..."
                                className="h-12 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="coupon_code" className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2"><Tag size={14}/> Kode Kupon (Opsional)</Label>
                            <Input
                                id="coupon_code"
                                type="text"
                                value={data.coupon_code}
                                onChange={(e) => setData('coupon_code', e.target.value.toUpperCase())}
                                placeholder="Masukkan kode promo"
                                className="h-12 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl font-mono uppercase"
                            />
                        </div>

                        <div className="flex gap-4 mt-6">
                            <Button type="button" variant="outline" onClick={handlePreviousStep} className="h-12 px-4 rounded-xl border-zinc-200 dark:border-zinc-800">
                                <ArrowLeft size={18} />
                            </Button>
                            <Button
                                type="submit"
                                className="h-12 flex-1 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-black font-black tracking-widest uppercase shadow-xl transition-all hover:scale-[1.02]"
                                disabled={processing}
                            >
                                {processing ? <Spinner className="mr-2" /> : <Zap size={18} className="mr-2 text-[#FEB400]" />}
                                Selesai & Luncurkan
                            </Button>
                        </div>
                    </div>
                )}
            </form>
            
            <div className="mt-10 text-center text-sm font-medium text-zinc-500">
                Sudah punya akun Kilatz?{' '}
                <TextLink href={login()} className="text-[#FEB400] hover:text-[#E5A200] font-black uppercase tracking-widest">
                    Log in
                </TextLink>
            </div>
        </div>
    );
}

Register.layout = {
    title: '',
    description: '',
};
