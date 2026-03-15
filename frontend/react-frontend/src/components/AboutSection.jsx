export  function AboutSection(){
    return (
        <div>
            {/* About Section */}
      <section id="about" className="relative py-24 px-6 lg:px-8 bg-gradient-to-b from-black to-slate-950">
        <div className="max-w-7xl mx-auto">
          {/* Hero Image */}
          <div className="relative mb-20 h-80 rounded-2xl overflow-hidden border border-slate-800">
            <div className="absolute inset-0 gradient-blue opacity-90"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <i className="fas fa-graduation-cap text-7xl mb-4 opacity-90"></i>
                <h3 className="text-3xl font-bold">Shaping Tomorrow's Leaders</h3>
              </div>
            </div>
          </div>

          <div className="text-center mb-16">
            <div className="inline-block px-4 py-1 rounded-full bg-blue-600/10 border border-blue-600/20 mb-4">
              <span className="text-sm text-blue-400 font-semibold uppercase tracking-wide">About Us</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Our Mission & Vision
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Creating a collaborative academic ecosystem that fosters innovation and excellence.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: 'fa-comments', title: 'Student-Teacher Discussion', desc: 'Engage in meaningful academic discussions with faculty members.' },
              { icon: 'fa-user-friends', title: 'Mentorship Program', desc: 'Connect with seniors for guidance and career advice.' },
              { icon: 'fa-book-open', title: 'Resource Hub', desc: 'Access and share academic resources and materials.' },
              { icon: 'fa-calendar-alt', title: 'Events Calendar', desc: 'Stay updated with college events and activities.' },
            ].map((feature, index) => (
              <div 
                key={index}
                className="group relative bg-slate-900/50 rounded-xl p-6 border border-slate-800 hover:border-blue-600/50 transition-all duration-300 hover-lift"
              >
                <div className="w-12 h-12 bg-blue-600/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600/20 transition-colors">
                  <i className={`fas ${feature.icon} text-xl text-blue-500`}></i>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
        </div>
    );
}