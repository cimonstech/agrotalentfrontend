import Link from 'next/link'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold mb-4">Get Started</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Choose your role to create an account
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Employer/Farm Account */}
          <Link
            href="/signup/farm"
            className="group bg-white dark:bg-gray-800 p-8 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary transition-all shadow-lg hover:shadow-xl"
          >
            <div className="bg-primary/10 p-4 rounded-xl inline-block mb-6 group-hover:bg-primary/20 transition-colors">
              <i className="fas fa-building text-2xl text-primary"></i>
            </div>
            <h3 className="text-2xl font-bold mb-3">For Employers/Farms</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Find verified agricultural talent for your business or farm operations.
            </p>
            <span className="text-primary font-semibold group-hover:underline">
              Create Employer/Farm Account →
            </span>
          </Link>

          {/* Graduate Account */}
          <Link
            href="/signup/graduate"
            className="group bg-white dark:bg-gray-800 p-8 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary transition-all shadow-lg hover:shadow-xl"
          >
            <div className="bg-primary/10 p-4 rounded-xl inline-block mb-6 group-hover:bg-primary/20 transition-colors">
              <i className="fas fa-graduation-cap text-2xl text-primary"></i>
            </div>
            <h3 className="text-2xl font-bold mb-3">For Graduates</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start your career in modern agriculture with verified opportunities.
            </p>
            <span className="text-primary font-semibold group-hover:underline">
              Create Graduate Account →
            </span>
          </Link>

          {/* Student/Intern Account */}
          <Link
            href="/signup/student"
            className="group bg-white dark:bg-gray-800 p-8 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary transition-all shadow-lg hover:shadow-xl"
          >
            <div className="bg-primary/10 p-4 rounded-xl inline-block mb-6 group-hover:bg-primary/20 transition-colors">
              <i className="fas fa-user-graduate text-2xl text-primary"></i>
            </div>
            <h3 className="text-2xl font-bold mb-3">For Students</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Find internship and NSS placement opportunities.
            </p>
            <span className="text-primary font-semibold group-hover:underline">
              Create Student Account →
            </span>
          </Link>
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link href="/signin" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
