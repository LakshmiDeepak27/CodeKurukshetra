import {React} from 'react';
function Herosection(){
    return (
        <div className="herosection">
            
      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>

        {/* Dot Grid Pattern */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}></div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-32 text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-slate-900/50 border border-slate-800 mb-8">
            <span className="text-sm text-slate-300 font-medium">Welcome to the Community</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Connect, Learn & Grow<br />
            <span className="text-gradient">Together</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Join our vibrant academic community where students, faculty, and alumni collaborate to create an enriching learning environment.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="group px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all duration-300 flex items-center space-x-2">
              <span>Join Now</span>
              <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
            </button>
            <button className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold border border-slate-800 hover:border-slate-700 transition-all duration-300">
              Explore Resources
            </button>
          </div>

          {/* Stats */}
          {/* <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto mt-20">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">10K+</div>
              <div className="text-sm text-slate-400">Active Students</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">500+</div>
              <div className="text-sm text-slate-400">Expert Faculty</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">50+</div>
              <div className="text-sm text-slate-400">Programs</div>
            </div>
          </div> */}
        </div>
      </section>
        </div>
    )
}



export default Herosection;