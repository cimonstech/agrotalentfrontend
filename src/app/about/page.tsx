export default function AboutPage() {
  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="px-4 lg:px-10 py-10">
        <div
          className="max-w-[1200px] mx-auto relative overflow-hidden rounded-xl bg-cover bg-center min-h-[520px] flex items-center justify-center p-8 text-center"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.65)), url("https://lh3.googleusercontent.com/aida-public/AB6AXuD5GbVGFBpjH9N3d9Mx4aH8q6-vk9VZCFG4fw4y7KKtNoVUkLmTmystDNvqiRzOfCfQusY1e8yO5Z_etUAbQg-a1g_phStPYtT1Lwf-legC9Ht5OXYhw5PasXQ1aatSC2yrtZbMFr9i1p5sZatR71fo7fubDffcDjZ9MKm7aefOCApHrj1gXfSryYh3un9UbKhPfN5poFA6hXBaKc0Tl9e0OpElhBsyymEdqUMtX2IhRMkYS_zS2g7YiI210xRw-Y5itt4_CBJYVvQ")`
          }}
        >
          <div className="max-w-[860px] flex flex-col gap-6">
            <h1 className="text-white text-4xl md:text-6xl font-black leading-tight tracking-tight">
              Building a Structured and Trusted Agricultural Workforce
            </h1>
            <p className="text-white/90 text-lg md:text-xl font-normal leading-relaxed">
              Connecting verified talent with Ghana’s growing employers and farms through innovation and integrity.
            </p>
          </div>
        </div>
      </section>

      {/* Side-by-side sections (same layout style as Services) */}
      <section className="max-w-[1200px] mx-auto px-4 lg:px-10 pb-24 flex flex-col gap-24">
        <div id="story" className="flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 flex flex-col gap-5">
            <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold w-fit">OUR STORY</div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#101914] dark:text-white">Why AgroTalent Hub exists</h2>
            <p className="text-[#578e73] dark:text-[#8ab6a1] text-base leading-relaxed">
              AgroTalent Hub was built to solve a paradox: thousands of trained agricultural graduates looking for work,
              while employers and farms struggle to find reliable, verified staff.
            </p>
            <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
              By structuring profiles, verifying credentials, and improving placement readiness, we reduce friction and
              increase trust on both sides.
            </p>
          </div>
          <div
            className="flex-1 w-full h-[380px] bg-center bg-no-repeat bg-cover rounded-xl shadow-lg border border-black/5"
            style={{
              backgroundImage:
                `url('/image_interns.webp'), url("https://lh3.googleusercontent.com/aida-public/AB6AXuAGNznEPrxWCuf7elCVh5Gv0WSp_50LmfAed2f-kyFKvmWXBhAkuA4j3szXKwF9cJ48vAEzhyGXqMor9BYKq0tdJxdw12l0XXnQpMKVATzDpKo6mO5cdBnfIktZaV-pEW-GZ-AoiC6mDQL6ofW8krhIppDk_7kj3rfTt1FNo0nFloYSlyolHztVyOi53XbpLK6pJPk9tuoBD0xtVUqCmvudP6kG2JadqlOs-8VPg-DI_eM6bXINiLHbuIvqMlCF0N1r0JjPPt5BcIU")`
            }}
          />
        </div>

        <div id="mission" className="flex flex-col md:flex-row-reverse items-center gap-12">
          <div className="flex-1 flex flex-col gap-5">
            <div className="bg-accent/10 text-accent px-3 py-1 rounded-full text-xs font-bold w-fit">MISSION</div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#101914] dark:text-white">What we do</h2>
            <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
              To connect skilled agricultural talent with growth-oriented employers and farms using digital verification,
              structured onboarding, and clear placement workflows.
            </p>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2"><i className="fas fa-check-circle text-primary"></i> Verified profiles and documents</li>
              <li className="flex items-center gap-2"><i className="fas fa-check-circle text-primary"></i> Role-based recruitment and matching</li>
              <li className="flex items-center gap-2"><i className="fas fa-check-circle text-primary"></i> Training management and attendance proof</li>
            </ul>
          </div>
          <div
            className="flex-1 w-full h-[380px] bg-center bg-no-repeat bg-cover rounded-xl shadow-lg border border-black/5"
            style={{
              backgroundImage:
                `url('/ghana_5.jpg'), url("https://lh3.googleusercontent.com/aida-public/AB6AXuCYrscz6_X_sPvmsTQyqwdQ8eEnRbkbfwJvyx-VZO15GGg5O1DI9ehkdZQ-e3ARAdLrqvAhARtJoDAVyaT_Dm4v_tlcKZU1qMeRFtoR4P_3GXv9OHXqfSvWEqtZcz3M4GKxuCKSYF1BnDzsJLRUZIaPxuFcdLERJi0cN0a9YpiebgWiQSiHK_u1MlIFX0Nc-xzv8a2HycZUJlw7rPaElVaq1QXr-YgXS8Ip3zQ8fq4E_xfM1M7VYbpZGdvTdFbwWQHes0g4F0AJ4wU")`
            }}
          />
        </div>

        <div id="vision" className="flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 flex flex-col gap-5">
            <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold w-fit">VISION</div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#101914] dark:text-white">Where we’re going</h2>
            <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
              To be a catalyst for modernizing Ghana’s agricultural workforce — building a trusted ecosystem where talent,
              opportunity, and readiness meet.
            </p>
          </div>
          <div
            className="flex-1 w-full h-[380px] rounded-xl shadow-lg border border-black/5 bg-center bg-no-repeat bg-cover"
            style={{
              backgroundImage: `url('/Learners_agric.jpg')`
            }}
          />
        </div>

        <div id="values" className="bg-white dark:bg-white/5 rounded-2xl border border-[#d3e4db] dark:border-white/10 p-8 md:p-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#101914] dark:text-white mb-10 text-center">Our Core Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: 'check-circle', title: 'Integrity', desc: 'Trust in every handshake' },
              { icon: 'briefcase', title: 'Professionalism', desc: 'Excellence in service' },
              { icon: 'lightbulb', title: 'Innovation', desc: 'Modern agri-solutions' },
              { icon: 'handshake', title: 'Reliability', desc: 'Always dependable' },
              { icon: 'chart-line', title: 'Sustainable Impact', desc: "Driving Ghana’s economic future" }
            ].map((value, i) => (
              <div key={i} className="bg-background-light dark:bg-background-dark p-6 rounded-2xl border border-primary/10 text-center">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                  <i className={`fas fa-${value.icon} text-3xl`}></i>
                </div>
                <h3 className="text-xl font-bold text-primary dark:text-white mb-2">{value.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
