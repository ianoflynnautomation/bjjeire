import { Link } from 'react-router-dom'
import { paths } from '../config/paths'

const Footer = () => {
  return (
    <footer className="bg-slate-100 dark:bg-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to={paths.events.getHref()}
                  className="text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                >
                  {paths.events.label}
                </Link>
              </li>
              <li>
                <Link
                  to={paths.gyms.getHref()}
                  className="text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                >
                  Gyms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-300 pt-8 text-center dark:border-slate-700">
          <p className="text-slate-600 dark:text-slate-400">
            © {new Date().getFullYear()} BJJ Éire. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
