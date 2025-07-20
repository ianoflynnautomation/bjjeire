import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { paths } from '../../config/paths';
import { FooterTestIds } from '../../constants/commonDataTestIds';

const footerPathKeys = ['events', 'gyms'] as const;

interface FooterProps {
  'data-testid'?: string;
}

const Footer: React.FC<FooterProps> = ({
  'data-testid': dataTestIdFromProp
}) => {
  const rootTestId =
    dataTestIdFromProp || FooterTestIds.ROOT;

  const quickLinksSectionMinHeight = 'min-h-[120px]';

  return (

    <footer
      className="bg-slate-100 dark:bg-slate-900 min-h-[280px]"
      data-testid={rootTestId}
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 min-w-[320px]">
        <div
          className={`grid grid-cols-1 gap-8 md:grid-cols-3 ${quickLinksSectionMinHeight}`}
        >
          {footerPathKeys.length > 0 ? (
            <div
              data-testid={FooterTestIds.QUICK_LINKS_HEADING}
            >
              <h3
                className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100"
                data-testid={FooterTestIds.QUICK_LINKS_HEADING}
              >
                Quick Links
              </h3>
              <ul className="space-y-2">
                {footerPathKeys.map(pathKey => {
                  const pathConfig = paths[pathKey as keyof typeof paths];
                  if (!pathConfig) {
                    console.warn(
                      `Path configuration for key "${pathKey}" not found.`
                    );
                    return null;
                  }
                  return (
                    <li key={pathKey}>
                      <Link
                        to={pathConfig.getHref()}
                        className="text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                        data-testid={FooterTestIds.QUICK_LINK}
                      >
                        {pathConfig.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="animate-pulse bg-gray-200 h-10 w-full rounded"></div>
          )}
        </div>

        <div className="mt-8 border-t border-slate-300 pt-8 text-center dark:border-slate-700">
          <p
            className="text-slate-600 dark:text-slate-400"
            data-testid={FooterTestIds.COPYRIGHT}
          >
            © {new Date().getFullYear()} BJJ Éire. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default memo(Footer);