import SidebarLink from "./sidebar-link";
import SignOutButton from "./sign-out-button";
import { ROLE_CLASSES, roleLabel } from "@/lib/types";
import type { CurrentUser } from "@/lib/auth";

/**
 * Menyja anash — si te TH-CRM.
 *
 * Mban emrin e llogarisë, rolin, lidhjet kryesore dhe butonin "Dil", që kreu
 * i çdo faqeje të mos i përsërisë ato dhe të mos zërë vend lart.
 *
 * Në telefon shndërrohet në një shirit të hollë sipër, sepse një shtyllë e
 * ngushtë atje do të hante gjysmën e ekranit.
 */
export default function Sidebar({ user }: { user: CurrentUser }) {
  return (
    <aside className="shrink-0 border-b border-slate-200 bg-white sm:sticky sm:top-0 sm:flex sm:h-screen sm:w-56 sm:flex-col sm:border-r sm:border-b-0">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:block sm:px-5 sm:py-5">
        <div>
          <p className="text-base font-semibold tracking-tight text-slate-900">
            CRM
          </p>
          <p className="hidden text-xs text-slate-500 sm:block">Terminet</p>
        </div>

        {/* Në telefon lidhjet rrinë në të njëjtin rresht me emrin. */}
        <nav className="flex flex-wrap gap-1 sm:mt-6 sm:block sm:space-y-1">
          <SidebarLink href="/dashboard" label="Dashboard" />
          <SidebarLink href="/" label="Terminet" exact />
          <SidebarLink href="/profili" label="Profili" />
          {user.isAdmin && (
            <>
              <SidebarLink href="/admin" label="Përdoruesit" exact />
              <SidebarLink href="/admin/aktiviteti" label="Aktiviteti" />
            </>
          )}
        </nav>
      </div>

      <div className="hidden border-t border-slate-200 px-5 py-4 sm:mt-auto sm:block">
        <p className="truncate text-xs text-slate-500" title={user.email}>
          {user.email}
        </p>
        {user.role !== "user" && (
          <span
            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
              ROLE_CLASSES[user.role]
            }`}
          >
            {roleLabel(user.role)}
          </span>
        )}
        <div className="mt-3">
          <SignOutButton />
        </div>
      </div>
    </aside>
  );
}
