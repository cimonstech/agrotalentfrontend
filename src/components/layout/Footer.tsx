import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-white dark:bg-background-dark border-t border-[#e9f1ed] dark:border-white/10 pt-16 pb-8">
      <div className="max-w-[1200px] mx-auto px-4 lg:px-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1 space-y-6">
            <div className="flex items-center gap-3">
              <img src="/agrotalent-logo.webp" alt="AgroTalent Hub" className="w-8 h-8" />
              <h2 className="text-[#101914] dark:text-white text-xl font-bold tracking-tight">AgroTalent Hub</h2>
            </div>
            <p className="text-sm text-gray-500">The premier platform for agricultural talent and operational excellence in Ghana.</p>
            <div className="flex gap-4">
              <a className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all" href="#" aria-label="Social">
                <i className="fab fa-linkedin"></i>
              </a>
              <a className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all" href="#" aria-label="Share">
                <i className="fas fa-share-alt"></i>
              </a>
              <a className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all" href="#" aria-label="Link">
                <i className="fas fa-link"></i>
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-6">Navigation</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><Link className="hover:text-primary transition-colors" href="/services">Services</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="/about">About Us</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="/for-farms">For Employers/Farms</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="/for-graduates">For Graduates</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6">Support</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><Link className="hover:text-primary transition-colors" href="/help-center">Help Center</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="/privacy-policy">Privacy Policy</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="/terms-of-service">Terms of Service</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="/contact">Contact Support</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="/sentry-example-page">Sentry test</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6">Contact</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li className="flex items-center gap-2">
                <i className="fas fa-envelope text-sm"></i> 
                support@agrotalenthub.com
              </li>
              <li className="flex items-center gap-2">
                <i className="fas fa-phone text-sm"></i> 
                +233 54 343 5294 / +233 55 301 8172
              </li>
              <li className="flex items-center gap-2">
                <i className="fas fa-map-marker-alt text-sm"></i> 
                Accra, Ghana
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-100 dark:border-white/5 pt-8 text-center text-xs text-gray-400">
          <p>© 2024 AgroTalent Hub. All rights reserved. Cultivating the future of Ghana.</p>
        </div>
      </div>
    </footer>
  )
}
