import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-slate-100 dark:bg-slate-900"> {/* UPDATED: Background for better contrast and dark mode */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Quick Links Section */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100"> {/* UPDATED: Text colors */}
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/events"
                  className="text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300" // UPDATED: Link colors
                >
                  Events
                </Link>
              </li>
              <li>
                <Link
                  to="/dojos" // Assuming this is for Gyms/Dojos
                  className="text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300" // UPDATED: Link colors
                >
                  Dojos
                </Link>
              </li>
              <li>
                <Link
                  to="/organizations"
                  className="text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300" // UPDATED: Link colors
                >
                  Organizations
                </Link>
              </li>
              <li>
                <Link
                  to="/articles"
                  className="text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300" // UPDATED: Link colors
                >
                  Articles
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300" // UPDATED: Link colors
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Follow Us Section */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100"> {/* UPDATED: Text colors */}
              Follow Us
            </h3>
            {/* You can use the SocialMediaLinks component here if you have it for icons */}
            <div className="flex space-x-4">
              <a
                href="https://instagram.com" // Replace with actual Instagram link
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300" // UPDATED: Link colors
                aria-label="Instagram"
              >
                {/* Consider using an Instagram icon here from react-icons or heroicons */}
                Instagram
              </a>
              {/* Add other social media links similarly */}
            </div>
          </div>

          {/* Support Project Section */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100"> {/* UPDATED: Text colors */}
              Support Project
            </h3>
            <p className="text-slate-700 dark:text-slate-400"> {/* UPDATED: Text colors */}
              Help us grow the BJJ community in Ireland.
            </p>
            <button
              type="button" // Added type="button"
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors duration-150 ease-in-out hover:from-emerald-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:from-emerald-500 dark:to-emerald-600 dark:hover:from-emerald-600 dark:hover:to-emerald-700 dark:focus:ring-offset-slate-900" // UPDATED: Added dark mode variants & focus styles
            >
              Support Now
            </button>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="mt-8 border-t border-slate-300 pt-8 text-center dark:border-slate-700"> {/* UPDATED: Border color */}
          <p className="text-slate-600 dark:text-slate-400"> {/* UPDATED: Text colors */}
            © {new Date().getFullYear()} BJJ Éire. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;