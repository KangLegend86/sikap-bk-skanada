"use client";

import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Contact, Users, Notebook, Pencil, type LucideIcon } from "lucide-react";

type Ripple = {
    id: number;
    left: number;
    top: number;
    size: number;
};

type NavItem = {
    path: string;
    label: string;
    Icon: LucideIcon;
    isCenter?: boolean;
};

const NAV_ITEMS: NavItem[] = [
    { path: "/", label: "Beranda", Icon: Home },
    { path: "/jurnal", label: "Jurnal BK", Icon: Notebook },
    { path: "/jurnal/baru", label: "Formulir Jurnal BK", Icon: Pencil, isCenter: true },
    { path: "/jurnal-sikap", label: "Jurnal Sikap", Icon: Contact },
    { path: "/siswa", label: "Siswa", Icon: Users },
];

export default function BottomNav() {
    const pathname = usePathname();
    const [ripples, setRipples] = useState<Ripple[]>([]);
    const navBarRef = useRef<HTMLDivElement>(null);
    const nextRippleId = useRef(0);
    const rippleTimeouts = useRef(new Map<number, ReturnType<typeof setTimeout>>());

    useEffect(() => {
        const timeouts = rippleTimeouts.current;
        return () => {
            timeouts.forEach(clearTimeout);
        };
    }, []);

    const createRipple = (event: ReactMouseEvent<HTMLAnchorElement>) => {
        if (!navBarRef.current) return;
        const itemBounds = event.currentTarget.getBoundingClientRect();
        const navBounds = navBarRef.current.getBoundingClientRect();
        const size = Math.max(itemBounds.width, itemBounds.height);
        const id = nextRippleId.current++;

        setRipples((current) => [
            ...current,
            {
                id,
                size,
                left: event.clientX - navBounds.left - size / 2,
                top: event.clientY - navBounds.top - size / 2,
            },
        ]);

        rippleTimeouts.current.set(
            id,
            setTimeout(() => {
                setRipples((current) => current.filter((ripple) => ripple.id !== id));
                rippleTimeouts.current.delete(id);
            }, 900),
        );
    };

    return (
        <>
            <style>{`
        .bottom-nav-ripple {
          position: absolute;
          z-index: 0;
          border-radius: 9999px;
          background-color: rgb(4 120 87 / 25%);
          pointer-events: none;
          transform: scale(0);
          animation: bottom-nav-ripple-animation 400ms ease-out forwards;
        }
        @keyframes bottom-nav-ripple-animation {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `}</style>

            <nav className="fixed bottom-0 left-0 right-0 z-50 overflow-visible pt-6">
                <div className="mx-auto max-w-md">
                    <div
                        ref={navBarRef}
                        className="relative flex h-16 items-end justify-center rounded-t-md bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
                    >
                        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-t-md">
                            {ripples.map((ripple) => (
                                <span
                                    key={ripple.id}
                                    aria-hidden="true"
                                    className="bottom-nav-ripple"
                                    style={{
                                        width: ripple.size,
                                        height: ripple.size,
                                        left: ripple.left,
                                        top: ripple.top,
                                    }}
                                />
                            ))}
                        </div>

                        {NAV_ITEMS.map((item) => {
                            const Icon = item.Icon;

                            if (item.isCenter) {
                                return (
                                    <Link
                                        key={item.path}
                                        href={item.path}
                                        aria-label={item.label}
                                        onClick={createRipple}
                                        className="relative z-10 flex flex-1 flex-col items-center justify-end gap-2 overflow-visible pb-6"
                                    >
                                        <div className="relative z-10 flex items-center justify-center rounded-full border-[6px] border-[#e3e3e3]">
                                            <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-emerald-700 shadow-[0_4px_20px_0_rgba(4,120,87,0.2)]">
                                                <Icon className="h-6 w-6 text-white" />
                                            </div>
                                        </div>
                                    </Link>
                                );
                            }

                            const isActive =
                                item.path === "/"
                                    ? pathname === "/"
                                    : item.path === "/jurnal"
                                      ? pathname === "/jurnal" ||
                                        (pathname.startsWith("/jurnal/") && pathname !== "/jurnal/baru")
                                      : pathname === item.path || pathname.startsWith(`${item.path}/`);

                            return (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    onClick={createRipple}
                                    className="relative z-10 flex flex-1 flex-col items-center justify-center gap-1 self-stretch overflow-visible"
                                >
                                    <div className="relative z-10 flex flex-col items-center gap-1">
                                        <div className={isActive ? "text-emerald-700" : "text-[#5E5F60]"}>
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        <span
                                            className={`text-xs font-bold leading-normal ${isActive ? "text-emerald-700" : "text-[#5E5F60]"
                                                }`}
                                        >
                                            {item.label}
                                        </span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </nav>
        </>
    );
}
