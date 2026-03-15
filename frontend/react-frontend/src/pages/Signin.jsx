import React, { useState } from 'react';
import { data , useNavigate} from 'react-router-dom';



const SignIn = () => {
    const navigate=useNavigate();
    const [authType, setAuthType] = useState('email');
    // const [mobile, setMobile] = useState('');
    const [view, setView] = useState('')
    function comingSoon() {
        setView("comingsoon");
    }
    function backToEmail() {
        setView('');
        setAuthType('email');
    }

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const handleMobileInput = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 0) {
            if (!value.startsWith('91')) {
                value = '91' + value;
            }
            if (!value.startsWith('+')) {
                value = '+' + value;
            }
        }
        setMobile(value);
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const res = await fetch("http://localhost:3000/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",

                },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || "Login failed");
                return;
            }

            localStorage.setItem("token", data.token);
            alert("Login successful");
            navigate('/Main');
        } catch (error) {
            console.error("Login error: ", error);
            alert("Some thing went wrong");
        }
    };


    return (
        <div className="min-h-screen bg-black flex items-center justify-center px-6 py-12 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
            </div>

            {/* Pattern overlay */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gMTAgMCBMIDAgMCAwIDEwIiBmaWxsPSJub25lIiBzdHJva2U9IiMzQjgyRjYiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjA1Ii8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>

            {/* Login Form Container */}
            <div className="relative w-full max-w-md">
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="font-heading text-3xl font-bold text-white mb-2">
                            Welcome Back
                        </h1>
                        <p className="text-white/60 text-sm">
                            Sign in to your Konnectia account
                        </p>
                    </div>

                    {/* Auth Type Selection */}
                    <div className="flex gap-3 mb-6 p-1 bg-white/5 rounded-xl border border-white/10">
                        <button
                            type="button"
                            onClick={() => setAuthType('email')}
                            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${authType === 'email'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'text-white/70 hover:text-white'
                                }`}
                        >
                            Email Login
                        </button>
                        <button
                            type="button"
                            //   onClick={() => setAuthType('otp')}
                            onClick={() => comingSoon()}
                            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${authType === 'otp'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'text-white/70 hover:text-white'
                                }`}
                        >
                            Mobile OTP
                        </button>
                    </div>

                    {/* Form */}
                    {/* <form action="/signin" method="POST" className="space-y-5"> */}
                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Username Field */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
                                Username
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter your Email"
                                    required
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Email Authentication Fields */}
                        {authType === 'email' && (
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Enter your password"
                                        required
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Coming Soon Overlay */}
                        {view == "comingsoon" && (
                            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm rounded-lg flex items-center justify-center mt-8">
                                <div className="text-center">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/20 rounded-full mb-3">
                                        <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-white font-semibold text-lg mb-1">Coming Soon</h3>
                                    <p className="text-white/60 text-sm">Mobile OTP authentication will be available soon
                                        <div>so create a account and login
                                            <br></br>
                                            <button
                                                type="button"
                                                onClick={backToEmail}
                                                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all duration-300"
                                            >

                                                <div>Email Login</div>
                                            </button>
                                        </div>
                                    </p>
                                </div>
                            </div>
                        )}
                        {/* OTP Authentication Fields */}
                        {authType === 'otp' && (
                            <div className="relative">
                                <label htmlFor="mobile" className="block text-sm font-medium text-white/80 mb-2">
                                    Mobile Number
                                </label>
                                <div className="relative">
                                    <input
                                        type="tel"
                                        id="mobile"
                                        name="mobile"
                                        placeholder="+91XXXXXXXXXX"
                                        value={mobile}
                                        onChange={handleMobileInput}
                                        maxLength="15"
                                        pattern="^\+?[0-9]{10,15}$"
                                        disabled
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 opacity-50 cursor-not-allowed"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                </div>

                            </div>
                        )}

                        {/* Remember & Forgot */}
                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center text-white/70 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-600 focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                                />
                                <span className="ml-2 group-hover:text-white transition-colors duration-300">Remember me</span>
                            </label>
                            <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors duration-300 font-medium">
                                Forgot password?
                            </a>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black transition-all duration-300 shadow-lg shadow-blue-600/30"
                        >
                            Sign In
                        </button>

                        {/* Register Link */}
                        <div className="text-center text-sm text-white/60">
                            Don't have an account?{' '}
                            <a href="/signup" className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-300">
                                Create Account
                            </a>
                        </div>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white/5 text-white/40">Or continue with</span>
                        </div>
                    </div>

                    {/* Social Login */}
                    <div className="grid grid-cols-3 gap-3">
                        <button className="py-2.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-300 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                        </button>
                        <button className="py-2.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-300 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                        </button>
                        <button className="py-2.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-300 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Bottom Note */}
                <div className="mt-6 text-center">
                    <p className="text-white/40 text-sm">
                        Protected by reCAPTCHA and subject to the{' '}
                        <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors duration-300">
                            Privacy Policy
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignIn;