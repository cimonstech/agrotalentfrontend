'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function ServicesPage() {
  return (
    <main className="flex-1">
      <div className="max-w-[1200px] mx-auto px-4 py-16 text-center">
        <h1 className="text-[#101914] dark:text-white text-5xl font-black leading-tight tracking-[-0.033em] mb-4">Our Services</h1>
        <p className="text-[#578e73] dark:text-[#8ab6a1] text-lg font-normal max-w-2xl mx-auto">
          Comprehensive modules for recruiting, training, and managing qualified agricultural professionals across Ghana.
        </p>
      </div>
      <div className="max-w-[1200px] mx-auto px-4 flex flex-col gap-24 pb-24">
        {/* Recruitment & Placement */}
        <motion.div
          id="recruitment"
          className="flex flex-col md:flex-row items-center gap-12"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex-1 flex flex-col gap-6">
            <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold w-fit">MODULE 1</div>
            <h3 className="text-3xl font-bold leading-tight">Recruitment & Placement</h3>
            <p className="text-[#578e73] dark:text-[#8ab6a1] text-base leading-relaxed">
              Location-based recruitment connecting verified graduates with farms in their preferred regions. Only graduates from accredited Training Colleges and Universities.
            </p>
            <div className="space-y-4">
              <div>
                <h4 className="font-bold mb-2">Role-Based Recruitment:</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <i className="fas fa-check-circle text-primary"></i>
                    Farm Hands (GHS 1,200 - 1,500)
                  </li>
                  <li className="flex items-center gap-2">
                    <i className="fas fa-check-circle text-primary"></i>
                    Farm Managers (GHS 2,000+)
                  </li>
                  <li className="flex items-center gap-2">
                    <i className="fas fa-check-circle text-primary"></i>
                    Interns / NSS Personnel
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-2">Advanced Filtering:</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <i className="fas fa-filter text-primary"></i>
                    Qualification, Location, Experience, Specialty
                  </li>
                </ul>
              </div>
            </div>
            <Link href="/for-farms" className="bg-primary/10 text-primary rounded-lg h-10 px-6 text-sm font-bold w-fit hover:bg-primary/20 transition-all inline-flex items-center">
              Learn More
            </Link>
          </div>
          <div className="flex-1 w-full">
            <img
              src="/Agriculture-Culture-in-Africa-Images.webp"
              alt="Recruitment & Placement"
              className="w-full h-[300px] md:h-[400px] object-cover rounded-xl shadow-lg border border-black/5"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = "https://lh3.googleusercontent.com/aida-public/AB6AXuDTNeHX_vQtokDfBMjYoqBW6vhYwe0H04F1f4iU9784jP9ZhUuSBJp4vedRA9NWRgNMtVFYnjGDLXtKVfgjegmg7XHH-zOpBJoi6HY9s-r8YwSCt6DXZ0rr9oQG1m6EZ8f5f3f__xT7yWx6J5FZ73FPJUGmtRH4NEuHDBU2_9h8PGCDw5hPvJocBvW0J6wosqsevsZtIGbAvWQuI4PpIC_i81eicqPXSmvnK4SHFyfkWgCK1ZELr72Zyubab5GO9UIx9zBfFzv8Zx8"
              }}
            />
          </div>
        </motion.div>
        
        {/* Training & Onboarding */}
        <motion.div
          id="training"
          className="flex flex-col md:flex-row-reverse items-center gap-12"
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex-1 flex flex-col gap-6">
            <div className="bg-accent/10 text-accent px-3 py-1 rounded-full text-xs font-bold w-fit">MODULE 2</div>
            <h3 className="text-3xl font-bold leading-tight">Training & Onboarding</h3>
            <p className="text-[#578e73] dark:text-[#8ab6a1] text-base leading-relaxed">
              Mandatory Zoom orientation sessions and pre-employment training ensure all workers are prepared before deployment.
            </p>
            <div className="space-y-4">
              <div>
                <h4 className="font-bold mb-2">Zoom Training Sessions:</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <i className="fas fa-video text-primary"></i>
                    Quarterly Zoom meetings with Farm Owners/Managers
                  </li>
                  <li className="flex items-center gap-2">
                    <i className="fas fa-video text-primary"></i>
                    Pre-employment Zoom training for workers
                  </li>
                  <li className="flex items-center gap-2">
                    <i className="fas fa-check-circle text-primary"></i>
                    Digital attendance tracking
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-2">Training Materials:</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <i className="fas fa-file-pdf text-primary"></i>
                    PDFs, videos, and guidelines
                  </li>
                  <li className="flex items-center gap-2">
                    <i className="fas fa-check-circle text-primary"></i>
                    Compliance confirmation before deployment
                  </li>
                </ul>
              </div>
            </div>
            <Link href="/#how-it-works" className="bg-accent/10 text-accent rounded-lg h-10 px-6 text-sm font-bold w-fit hover:bg-accent/20 transition-all inline-flex items-center">
              Learn More
            </Link>
          </div>
          <div className="flex-1 w-full">
            <img
              src="/Agribusiness.jpg"
              alt="Training & Onboarding"
              className="w-full h-[300px] md:h-[400px] object-cover rounded-xl shadow-lg border border-black/5"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = "https://lh3.googleusercontent.com/aida-public/AB6AXuDTNeHX_vQtokDfBMjYoqBW6vhYwe0H04F1f4iU9784jP9ZhUuSBJp4vedRA9NWRgNMtVFYnjGDLXtKVfgjegmg7XHH-zOpBJoi6HY9s-r8YwSCt6DXZ0rr9oQG1m6EZ8f5f3f__xT7yWx6J5FZ73FPJUGmtRH4NEuHDBU2_9h8PGCDw5hPvJocBvW0J6wosqsevsZtIGbAvWQuI4PpIC_i81eicqPXSmvnK4SHFyfkWgCK1ZELr72Zyubab5GO9UIx9zBfFzv8Zx8"
              }}
            />
          </div>
        </motion.div>

        {/* Internship & NSS */}
        <motion.div
          id="internships"
          className="flex flex-col md:flex-row items-center gap-12"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex-1 flex flex-col gap-6">
            <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold w-fit">MODULE 3</div>
            <h3 className="text-3xl font-bold leading-tight">Internship & NSS Placement</h3>
            <p className="text-[#578e73] dark:text-[#8ab6a1] text-base leading-relaxed">
              Farms can request NSS Agriculture students and internship students. Student profiles include institution, area of specialization, and preferred region.
            </p>
            <div className="space-y-4">
              <div>
                <h4 className="font-bold mb-2">Student Profiles Include:</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <i className="fas fa-university text-primary"></i>
                    Institution information
                  </li>
                  <li className="flex items-center gap-2">
                    <i className="fas fa-book text-primary"></i>
                    Area of specialization
                  </li>
                  <li className="flex items-center gap-2">
                    <i className="fas fa-map-marker-alt text-primary"></i>
                    Preferred region
                  </li>
                  <li className="flex items-center gap-2">
                    <i className="fas fa-chart-line text-primary"></i>
                    Placement tracking and reporting
                  </li>
                </ul>
              </div>
            </div>
            <Link href="/for-graduates" className="bg-primary/10 text-primary rounded-lg h-10 px-6 text-sm font-bold w-fit hover:bg-primary/20 transition-all inline-flex items-center">
              Learn More
            </Link>
          </div>
          <div className="flex-1 w-full">
            <img
              src="/Women_interns.webp"
              alt="Internship & NSS Placement"
              className="w-full h-[300px] md:h-[400px] object-cover rounded-xl shadow-lg border border-black/5"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = "https://lh3.googleusercontent.com/aida-public/AB6AXuDTNeHX_vQtokDfBMjYoqBW6vhYwe0H04F1f4iU9784jP9ZhUuSBJp4vedRA9NWRgNMtVFYnjGDLXtKVfgjegmg7XHH-zOpBJoi6HY9s-r8YwSCt6DXZ0rr9oQG1m6EZ8f5f3f__xT7yWx6J5FZ73FPJUGmtRH4NEuHDBU2_9h8PGCDw5hPvJocBvW0J6wosqsevsZtIGbAvWQuI4PpIC_i81eicqPXSmvnK4SHFyfkWgCK1ZELr72Zyubab5GO9UIx9zBfFzv8Zx8"
              }}
            />
          </div>
        </motion.div>

        {/* Data Collection */}
        <motion.div
          id="data-collection"
          className="flex flex-col md:flex-row-reverse items-center gap-12"
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex-1 flex flex-col gap-6">
            <div className="bg-accent/10 text-accent px-3 py-1 rounded-full text-xs font-bold w-fit">MODULE 4</div>
            <h3 className="text-3xl font-bold leading-tight">Data Collection & Field Research</h3>
            <p className="text-[#578e73] dark:text-[#8ab6a1] text-base leading-relaxed">
              Farms and organizations can request field data collectors, survey officers, and agricultural enumerators. Personnel assigned by region with data submission and reporting tools.
            </p>
            <div className="space-y-4">
              <div>
                <h4 className="font-bold mb-2">Available Personnel:</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <i className="fas fa-clipboard-list text-primary"></i>
                    Field data collectors
                  </li>
                  <li className="flex items-center gap-2">
                    <i className="fas fa-clipboard-list text-primary"></i>
                    Survey officers
                  </li>
                  <li className="flex items-center gap-2">
                    <i className="fas fa-clipboard-list text-primary"></i>
                    Agricultural enumerators
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-2">Features:</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <i className="fas fa-map-marker-alt text-primary"></i>
                    Regional assignment
                  </li>
                  <li className="flex items-center gap-2">
                    <i className="fas fa-upload text-primary"></i>
                    Data submission tools
                  </li>
                  <li className="flex items-center gap-2">
                    <i className="fas fa-chart-bar text-primary"></i>
                    Reporting and analytics
                  </li>
                </ul>
              </div>
            </div>
            <Link href="/contact" className="bg-accent/10 text-accent rounded-lg h-10 px-6 text-sm font-bold w-fit hover:bg-accent/20 transition-all inline-flex items-center">
              Contact Us
            </Link>
          </div>
          <div className="flex-1 w-full">
            <img
              src="/large_photo_data_collection.jpg"
              alt="Data Collection & Field Research"
              className="w-full h-[300px] md:h-[400px] object-cover rounded-xl shadow-lg border border-black/5"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = "https://lh3.googleusercontent.com/aida-public/AB6AXuDTNeHX_vQtokDfBMjYoqBW6vhYwe0H04F1f4iU9784jP9ZhUuSBJp4vedRA9NWRgNMtVFYnjGDLXtKVfgjegmg7XHH-zOpBJoi6HY9s-r8YwSCt6DXZ0rr9oQG1m6EZ8f5f3f__xT7yWx6J5FZ73FPJUGmtRH4NEuHDBU2_9h8PGCDw5hPvJocBvW0J6wosqsevsZtIGbAvWQuI4PpIC_i81eicqPXSmvnK4SHFyfkWgCK1ZELr72Zyubab5GO9UIx9zBfFzv8Zx8"
              }}
            />
          </div>
        </motion.div>
      </div>
    </main>
  )
}
