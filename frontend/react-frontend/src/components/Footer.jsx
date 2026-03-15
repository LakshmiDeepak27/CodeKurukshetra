export function Footer(){
    return (
        <div className="footer">
            {/* Footer */}
      <footer className="relative border-t border-slate-900 py-12 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-bold mb-3">
                <span className="text-white">Konnect</span>
                <span className="text-blue-500">ia</span>
              </h3>
              <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                Connecting students, faculty, and alumni to create a vibrant academic community.
              </p>
              <div className="flex space-x-3">
                {['facebook-f', 'twitter', 'instagram', 'linkedin-in'].map((social) => (
                  <a
                    key={social}
                    href="#"
                    className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors"
                  >
                    <i className={`fab fa-${social} text-sm`}></i>
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-3">Quick Links</h4>
              <div className="space-y-2">
                {['Home', 'About', 'Departments', 'Community'].map((link) => (
                  <a key={link} href="#" className="block text-sm text-slate-400 hover:text-blue-400 transition-colors">
                    {link}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-3">Resources</h4>
              <div className="space-y-2">
                {['Learning Materials', 'Research Papers', 'Career Development', 'Alumni Network'].map((link) => (
                  <a key={link} href="#" className="block text-sm text-slate-400 hover:text-blue-400 transition-colors">
                    {link}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-3">Contact</h4>
              <div className="space-y-2 text-sm text-slate-400">
                <p className="flex items-center space-x-2">
                  <i className="fas fa-envelope w-4"></i>
                  <span>contact@konnectia.edu</span>
                </p>
                <p className="flex items-center space-x-2">
                  <i className="fas fa-phone w-4"></i>
                  <span>(123) 456-7890</span>
                </p>
                <p className="flex items-center space-x-2">
                  <i className="fas fa-map-marker-alt w-4"></i>
                  <span>123 University Ave</span>
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-900 pt-6 text-center">
            <p className="text-sm text-slate-500">© 2025 Konnectia. All rights reserved.</p>
          </div>
        </div>
      </footer>
        </div>
    );
}