// src/features/static/AboutPage.tsx
// Or any other path you prefer, e.g., src/pages/AboutPage.tsx

import React from 'react';
// You might want to import a common PageHeader or Layout component if you have one.
// import { SocialMediaLinks } from '../../components/common/SocialMediaLinks/SocialMediaLinks'; // Optional: If you want to reuse for contact

const AboutPage: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen">
      <div className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Page Header */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl">
            About BJJ Éire
          </h1>
          <p className="mt-4 text-xl text-slate-600 dark:text-slate-400">
            Your guide to the Brazilian Jiu-Jitsu community in Ireland.
          </p>
        </header>

        {/* Main Content Area */}
        <main className="space-y-16">
          {/* Who We Are Section */}
          <section id="who-we-are" aria-labelledby="who-we-are-heading">
            <div className="rounded-lg bg-slate-50 p-6 shadow-lg dark:bg-slate-800 sm:p-8">
              <h2
                id="who-we-are-heading"
                className="mb-6 text-3xl font-semibold text-emerald-700 dark:text-emerald-500"
              >
                Who We Are
              </h2>
              <div className="space-y-4 text-slate-700 dark:text-slate-300">
                <p>
                  Welcome to BJJ Éire! We are passionate practitioners and enthusiasts of
                  Brazilian Jiu-Jitsu dedicated to fostering and supporting the BJJ
                  community across Ireland. Our mission is to provide a comprehensive
                  and up-to-date resource for anyone looking to find BJJ gyms, events,
                  and connect with fellow practitioners.
                </p>
                <p>
                  [<em>Replace this with more specific details about your project's origin, your team (if applicable), and your core values. For example: What inspired you to create BJJ Éire? What's your vision for the BJJ community in Ireland? Are you a team of developers, BJJ practitioners, or both?</em>]
                </p>
                <p>
                  We believe that BJJ offers incredible benefits, from physical fitness
                  and self-defense to mental discipline and camaraderie. Our goal is to
                  make it easier for everyone – from complete beginners to seasoned
                  black belts – to discover and engage with the vibrant BJJ scene in Ireland.
                </p>
              </div>
            </div>
          </section>

          {/* Our Mission/Vision Section (Optional) */}
          <section id="our-mission" aria-labelledby="our-mission-heading">
             <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-slate-800/50 sm:p-8">
              <h2
                id="our-mission-heading"
                className="mb-6 text-3xl font-semibold text-emerald-700 dark:text-emerald-500"
              >
                Our Vision
              </h2>
              <div className="space-y-4 text-slate-700 dark:text-slate-300">
                <p>
                  [<em>Placeholder: Describe your project's long-term goals and aspirations here. What impact do you hope to make? e.g., "To be the most trusted and comprehensive platform for BJJ in Ireland, connecting every gym and practitioner."</em>]
                </p>
                <p>
                  [<em>Placeholder: You could also add a "What We Offer" subsection here, briefly mentioning features like the gym directory, event listings, articles, etc.</em>]
                </p>
              </div>
            </div>
          </section>

          {/* How to Contact Section */}
          <section id="contact-us" aria-labelledby="contact-us-heading">
            <div className="rounded-lg bg-slate-50 p-6 shadow-lg dark:bg-slate-800 sm:p-8">
              <h2
                id="contact-us-heading"
                className="mb-6 text-3xl font-semibold text-emerald-700 dark:text-emerald-500"
              >
                Get In Touch
              </h2>
              <div className="space-y-6 text-slate-700 dark:text-slate-300">
                <p>
                  We'd love to hear from you! Whether you have a question, feedback,
                  a suggestion for a gym or event to add, or just want to say hello,
                  please feel free to reach out.
                </p>

                <div>
                  <h3 className="mb-2 text-xl font-medium text-slate-800 dark:text-slate-200">
                    Email Us
                  </h3>
                  <p>
                    For general inquiries, support, or feedback, please email us at:
                    <a
                      href="mailto:info@bjj-eire.com" // Replace with your actual email
                      className="ml-1 font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 hover:underline"
                    >
                      info@bjj-eire.com
                    </a>
                    .
                  </p>
                  <p className="mt-1">
                    [<em>Placeholder: If you have different emails for different purposes (e.g., partnerships, corrections), list them here.</em>]
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-xl font-medium text-slate-800 dark:text-slate-200">
                    Follow Us
                  </h3>
                  <p>
                    Stay updated with the latest news, event highlights, and community spotlights by following us on our social media channels:
                  </p>
                  <div className="mt-3 flex space-x-4">
                    {/* Example - Replace with actual links and consider using your SocialMediaLinks component if applicable */}
                    <a
                      href="https://instagram.com/yourprofile" // Replace
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 hover:underline"
                    >
                      Instagram
                    </a>
                    <a
                      href="https://facebook.com/yourprofile" // Replace
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 hover:underline"
                    >
                      Facebook
                    </a>
                    {/* Add more social links as needed */}
                  </div>
                   {/*
                    Alternatively, if you have your SocialMediaLinks component:
                    <div className="mt-3">
                      <SocialMediaLinks socialMedia={{
                        instagram: "https://instagram.com/yourprofile",
                        facebook: "https://facebook.com/yourprofile",
                        x: "", youTube: "" // Add as needed
                      }} />
                    </div>
                   */}
                </div>

                <div>
                  <h3 className="mb-2 text-xl font-medium text-slate-800 dark:text-slate-200">
                    Suggest a Gym or Event
                  </h3>
                  <p>
                    Know a gym or an upcoming event that's not listed on our site? Please let us know!
                    [<em>Placeholder: Explain how users can suggest content - e.g., "Use our 'Suggest a Gym/Event' form on the respective pages or email us the details."</em>]
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer section if not part of a global layout */}
        <footer className="mt-16 border-t border-slate-200 pt-8 text-center dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            BJJ Éire - Connecting the Irish Jiu-Jitsu Community.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default AboutPage;