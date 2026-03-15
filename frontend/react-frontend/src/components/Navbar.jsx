import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
function Navbar(){
   const [isScrolled, setIsScrolled] = useState(false);
   
   useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

    return(
    <div className="navigation_bar">
        {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'glass-effect border-b border-slate-800' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <a href="#" className="text-2xl font-bold tracking-tight">
              <span className="text-white">Konnect</span>
              <span className="text-blue-500">ia</span>
            </a>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className="nav-link active text-sm font-medium text-white hover:text-blue-400 transition-colors">Home</a>
              <a href="#about" className="nav-link text-sm font-medium text-slate-300 hover:text-blue-400 transition-colors">About</a>
              <a href="#department" className="nav-link text-sm font-medium text-slate-300 hover:text-blue-400 transition-colors">Departments</a>
              <a href="#community" className="nav-link text-sm font-medium text-slate-300 hover:text-blue-400 transition-colors">Community</a>
            </div>

            <div className="flex items-center space-x-3">
              <Link to={"/signup"} className="hidden sm:block px-5 py-2 text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors">
               Sign Up
              </Link>
             <Link to={"/signin"} className="px-5 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </div>
)
}

export default Navbar;