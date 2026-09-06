import Link from "next/link";
import { ArrowRight, Crosshair, LayoutDashboard, LogOut, Users } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/lib/auth-actions";

export async function Navbar() {
  const session = await auth();

  return (
    <nav className="dispatch-nav">
      <div className="dispatch-nav__brand">
        <Crosshair className="dispatch-nav__registration" aria-hidden="true" />
        <Link
          href="/"
          className="dispatch-wordmark"
        >
          <span className="font-black text-foreground">shrt</span>
          <span className="font-extralight text-muted-foreground">en</span>
        </Link>
        <div className="dispatch-nav__theme">
          <ThemeToggle />
        </div>
      </div>

      <div className="dispatch-nav__actions">
        <div className="dispatch-nav__account">
          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="dispatch-account-button">
                  {session.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={session.user.image}
                      alt={session.user.name ?? ""}
                      className="h-6 w-6 rounded-full object-cover ring-2 ring-primary/20"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                      {(session.user.name ?? session.user.email ?? "?")[0].toUpperCase()}
                    </div>
                  )}
                  <span className="hidden sm:inline text-sm max-w-32 truncate">
                    {session.user.name ?? session.user.email}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-none p-1.5">
                <DropdownMenuLabel className="font-normal px-2 py-1.5">
                  <div className="flex flex-col space-y-0.5">
                    <p className="text-sm font-medium leading-none">{session.user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground truncate">
                      {session.user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem asChild className="rounded-none">
                  <Link href="/dashboard" className="cursor-pointer">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-none">
                  <Link href="/dashboard/teams" className="cursor-pointer">
                    <Users className="h-4 w-4" />
                    Teams
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem asChild className="rounded-none">
                  <form action={signOutAction} className="w-full">
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2 text-destructive"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" asChild className="dispatch-get-started">
              <Link href="/sign-in">
                Get started
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
