
import { Link } from 'react-router';

export default function PaymentFailed() {
  return (
    <main className="flex min-h-[65vh] items-center justify-center px-5 py-16">
      <section className="w-full max-w-lg text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-9 w-9 text-red-600"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
            <path
              d="m9 9 6 6m0-6-6 6"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.25em] text-neutral-500">
          Payment unsuccessful
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
          Let's try that again.
        </h1>

        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-neutral-500">
          Your payment couldn't be completed. You can return to checkout
          and try again, or choose another available payment method.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/checkout"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-neutral-950 px-7 py-3 text-sm font-medium text-white transition hover:bg-neutral-700"
          >
            Retry payment
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4"
              stroke="currentColor"
              strokeWidth="1.7"
              aria-hidden="true"
            >
              <path
                d="M5 12h14m-6-6 6 6-6 6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>

          <Link
            to="/cart"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-neutral-200 px-7 py-3 text-sm font-medium text-neutral-800 transition hover:border-neutral-950 hover:bg-neutral-50"
          >
            Back to bag
          </Link>
        </div>

        <div className="mx-auto mt-10 max-w-sm border-t border-neutral-200 pt-5">
          <p className="text-xs leading-6 text-neutral-500">
            If the amount appears to have been deducted, check your
            transaction status before attempting another payment.
          </p>
        </div>
      </section>
    </main>
  );
}
