import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-emerald-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/events" className="text-emerald-700 hover:text-emerald-600 transition-colors">
                  Events
                </Link>
              </li>
              <li>
                <Link to="/dojos" className="text-emerald-700 hover:text-emerald-600 transition-colors">
                  Dojos
                </Link>
              </li>
              <li>
                <Link to="/organizations" className="text-emerald-700 hover:text-emerald-600 transition-colors">
                  Organizations
                </Link>
              </li>
              <li>
                <Link to="/articles" className="text-emerald-700 hover:text-emerald-600 transition-colors">
                  Articles
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-emerald-700 hover:text-emerald-600 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 hover:text-emerald-600 transition-colors"
              >
                Instagram
              </a>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Support Project</h3>
            <p className="text-slate-600">Help us grow the BJJ community</p>
            <button
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-emerald-700 hover:to-emerald-800 focus:ring-2 focus:ring-emerald-500"
            >
              Support Now
            </button>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-emerald-200 text-center">
          <p className="text-slate-600">© {new Date().getFullYear()} BJJ Éire. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;