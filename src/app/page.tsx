import Link from 'next/link'
import { ArrowRight, Shield, Bell, FileText, TrendingUp, Users, Handshake } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <Handshake className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">LendTrust</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background effects */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1.5s' }} />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-emerald-400 mb-8">
            <Shield className="h-4 w-4" />
            Trusted by families everywhere
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
            <span className="text-white">Lending Built on </span>
            <span className="gradient-text">Trust</span>
            <br />
            <span className="text-white">Not </span>
            <span className="gradient-text">Fine Print</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Stop losing friendships over money. LendTrust formalizes loans between friends and family
            with clear agreements, automatic reminders, and transparent tracking.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto text-base">
                Start Lending Safely
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-base">
                See How It Works
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { value: '$184B+', label: 'Lent informally in the US yearly', icon: TrendingUp },
            { value: '46%', label: 'Of informal loans cause disputes', icon: Users },
            { value: '100%', label: 'Transparency with LendTrust', icon: Shield },
          ].map((stat) => (
            <div key={stat.label} className="text-center glass rounded-2xl p-8">
              <stat.icon className="h-8 w-8 text-emerald-400 mx-auto mb-4" />
              <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
              <div className="text-sm text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6" id="how-it-works">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything You Need to <span className="gradient-text">Lend With Confidence</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Like Venmo for loans — but with contracts, transparency, and automated reminders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: FileText,
                title: 'Auto-Generated Contracts',
                description: 'Professional loan agreements with all terms, downloadable as PDF. Both parties sign digitally.',
              },
              {
                icon: Bell,
                title: 'Smart Reminders',
                description: 'Automated payment reminders before due dates, on due dates, and for overdue payments.',
              },
              {
                icon: TrendingUp,
                title: 'Payment Tracking',
                description: 'Real-time dashboard showing balances, payment history, and repayment progress.',
              },
              {
                icon: Shield,
                title: 'Trust & Transparency',
                description: 'Both parties see the same information. Clear terms prevent misunderstandings.',
              },
              {
                icon: Users,
                title: 'Easy Invitations',
                description: 'Invite your borrower or lender via email. They can sign up and review terms in minutes.',
              },
              {
                icon: Handshake,
                title: 'Preserve Relationships',
                description: 'Structured agreements reduce tension. Keep finances and friendships separate.',
              },
            ].map((feature) => (
              <div key={feature.title} className="glass rounded-2xl p-6 hover:border-emerald-500/30 transition-all duration-300 group">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Steps */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-16">
            Get Started in <span className="gradient-text">4 Simple Steps</span>
          </h2>

          <div className="space-y-8">
            {[
              { step: '01', title: 'Create Your Account', description: 'Sign up in seconds with your email.' },
              { step: '02', title: 'Set Up Your Loan', description: 'Enter the loan amount, interest rate, repayment schedule, and terms.' },
              { step: '03', title: 'Invite & Sign', description: 'Send an invitation to your friend or family member. Both of you review and sign the agreement.' },
              { step: '04', title: 'Track & Relax', description: 'Payments are tracked automatically. Reminders are sent so nobody forgets.' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-6 glass rounded-2xl p-6">
                <div className="flex-shrink-0 h-14 w-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <span className="text-xl font-bold text-white">{item.step}</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">{item.title}</h3>
                  <p className="text-slate-400">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center glass rounded-3xl p-12 glow-emerald">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Lend the <span className="gradient-text">Smart Way</span>?
          </h2>
          <p className="text-slate-400 text-lg mb-8">
            Join thousands of families who use LendTrust to keep money and relationships healthy.
          </p>
          <Link href="/signup">
            <Button size="lg" className="text-base">
              Create Free Account
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <Handshake className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-400">LendTrust</span>
          </div>
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} LendTrust. Not a financial institution. We facilitate documentation, not loans.
          </p>
        </div>
      </footer>
    </div>
  )
}
